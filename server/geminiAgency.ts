import fs from 'node:fs'
import path from 'node:path'
import { GoogleGenAI } from '@google/genai'
import type {
  AgentEmployee,
  AgentMood,
  ChatAttachment,
  AgentProviderId,
  PendingEmployeeProposal,
  SharedWorldState,
  StudioZoneId,
  WorldCreationProp,
  WorldPropKind,
} from '../funcionarios/types'
import { PROP_CATALOG, STUDIO_ZONES } from '../funcionarios/providers'
import type { ExternalAiProviderId } from '../funcionarios/aiProvidersCatalog'
import { agentProviderToExternal } from '../funcionarios/sede'
import type { ProviderCredential } from './agencyPlugin'

const GEMINI_MODEL = 'gemini-3.8-flash'

/** Máximo de idas e voltas de ferramentas por resposta (cada rodada é uma chamada completa ao modelo) */
const MAX_TOOL_ROUNDS = 6
/** Tempo máximo de cada chamada HTTP a um provedor de IA antes de desistir/tentar outro */
const PROVIDER_REQUEST_TIMEOUT_MS = 75_000

export interface GroupConversationContext {
  name: string
  category: string
  memberNames: string[]
  transcript: { role: 'user' | 'assistant'; text: string }[]
}

interface PreparedImage {
  mimeType: string
  base64: string
}

interface PreparedAttachments {
  note: string
  images: PreparedImage[]
}

const MODEL_IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
const TEXT_ATTACHMENT_EXTS = new Set(['.txt', '.md', '.json', '.csv', '.ts', '.tsx', '.js', '.css', '.html', '.glsl', '.yml', '.yaml'])

/** Lê os anexos do disco: imagens vão como entrada multimodal e textos curtos são colados na mensagem */
function prepareAttachments(rootDir: string, attachments: ChatAttachment[] = []): PreparedAttachments {
  if (attachments.length === 0) return { note: '', images: [] }
  const lines: string[] = []
  const images: PreparedImage[] = []
  const dir = path.join(rootDir, 'estado-mundo', 'uploads')
  for (const att of attachments) {
    const filePath = path.join(dir, path.basename(att.id))
    if (!fs.existsSync(filePath)) continue
    const sizeKb = Math.max(1, Math.round(att.size / 1024))
    const ext = path.extname(att.name || att.id).toLowerCase()
    if (MODEL_IMAGE_MIMES.has(att.mimeType) && att.size <= 4 * 1024 * 1024 && images.length < 4) {
      images.push({ mimeType: att.mimeType, base64: fs.readFileSync(filePath).toString('base64') })
      lines.push(`- Imagem "${att.name}" (${sizeKb} KB) — anexada abaixo para você ver.`)
    } else if ((att.mimeType.startsWith('text/') || TEXT_ATTACHMENT_EXTS.has(ext)) && att.size <= 200 * 1024) {
      const content = fs.readFileSync(filePath, 'utf-8').slice(0, 20000)
      lines.push(`- Arquivo "${att.name}" (${sizeKb} KB):\n\`\`\`\n${content}\n\`\`\``)
    } else {
      lines.push(`- Arquivo "${att.name}" (${att.mimeType}, ${sizeKb} KB) — não consigo abrir este formato, só sei que foi enviado.`)
    }
  }
  return {
    note: lines.length > 0 ? `\n\n[Anexos enviados na conversa]\n${lines.join('\n')}` : '',
    images,
  }
}

/** fetch com tempo limite para nunca deixar o agente "pensando" para sempre */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = PROVIDER_REQUEST_TIMEOUT_MS
): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
  } catch (err: any) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      throw new Error(`tempo esgotado (${Math.round(timeoutMs / 1000)}s)`)
    }
    throw err
  }
}

/** Lista os modelos de um endpoint compatível com OpenAI (OpenCode Zen, OpenAI...) */
export async function listOpenAiCompatibleModels(baseUrl: string, apiKey: string): Promise<string[]> {
  try {
    const res = await fetchWithTimeout(
      `${baseUrl.replace(/\/+$/, '')}/models`,
      { method: 'GET', headers: { Authorization: `Bearer ${apiKey}` } },
      12_000
    )
    if (!res.ok) return []
    const data = (await res.json()) as { data?: Array<{ id?: string }> }
    if (!Array.isArray(data?.data)) return []
    return data.data
      .map((m) => (typeof m?.id === 'string' ? m.id.trim() : ''))
      .filter((id) => Boolean(id) && !/embedding|whisper|tts|dall-e|moderation|audio/i.test(id))
  } catch {
    return []
  }
}

function pickBestAvailableModel(available: string[], preferredOrder: string[]): string | null {
  for (const pref of preferredOrder) {
    if (available.includes(pref)) return pref
  }
  return available[0] ?? null
}

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label}: tempo esgotado (${Math.round(PROVIDER_REQUEST_TIMEOUT_MS / 1000)}s)`)),
      PROVIDER_REQUEST_TIMEOUT_MS
    )
    promise.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(e)
      }
    )
  })
}

const VALID_PROP_KINDS = Object.keys(PROP_CATALOG) as WorldPropKind[]
const VALID_ZONES = Object.keys(STUDIO_ZONES) as StudioZoneId[]

const ALLOWED_CODE_ROOTS = ['ambiente-3d', 'plataforma', 'funcionarios', 'projetos', 'src']
const ALLOWED_CODE_EXTS = new Set(['.ts', '.tsx', '.css', '.md', '.json', '.glsl'])

/** Resolve um caminho relativo garantindo que fique estritamente dentro das pastas de código permitidas */
function resolveSafeProjectPath(
  rootDir: string,
  rawRelativePath: string
): { ok: true; absPath: string; relPath: string } | { ok: false; error: string } {
  const cleaned = String(rawRelativePath || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')

  if (!cleaned || cleaned.includes('..') || cleaned.includes('\0')) {
    return { ok: false, error: 'Caminho inválido.' }
  }

  const topDir = cleaned.split('/')[0]
  if (!ALLOWED_CODE_ROOTS.includes(topDir)) {
    return {
      ok: false,
      error: `Acesso permitido apenas em: ${ALLOWED_CODE_ROOTS.join(', ')}.`,
    }
  }

  const absRoot = path.resolve(rootDir)
  const absPath = path.resolve(absRoot, cleaned)
  if (!absPath.startsWith(absRoot + path.sep)) {
    return { ok: false, error: 'Caminho fora do projeto.' }
  }

  return { ok: true, absPath, relPath: cleaned }
}

function collectAllowedFiles(rootDir: string, subDir?: string): string[] {
  const results: string[] = []
  const targets =
    subDir && ALLOWED_CODE_ROOTS.includes(subDir.replace(/\\/g, '/').split('/')[0])
      ? [subDir.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')]
      : ALLOWED_CODE_ROOTS

  const walk = (dirAbs: string, relPrefix: string) => {
    if (!fs.existsSync(dirAbs)) return
    const entries = fs.readdirSync(dirAbs, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      const full = path.join(dirAbs, entry.name)
      const rel = relPrefix ? `${relPrefix}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        walk(full, rel)
      } else if (ALLOWED_CODE_EXTS.has(path.extname(entry.name).toLowerCase())) {
        results.push(rel)
      }
    }
  }

  for (const t of targets) {
    const abs = path.resolve(rootDir, t)
    if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
      walk(abs, t)
    }
  }
  return results.sort()
}

function backupProjectFile(rootDir: string, absPath: string, relPath: string): string | null {
  try {
    if (!fs.existsSync(absPath)) return null
    const backupDir = path.join(rootDir, '.blequi-backups')
    fs.mkdirSync(backupDir, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safeName = relPath.replace(/[\\/]/g, '__')
    const backupPath = path.join(backupDir, `${stamp}__${safeName}`)
    fs.copyFileSync(absPath, backupPath)
    return `.blequi-backups/${stamp}__${safeName}`
  } catch {
    return null
  }
}

export function computeMood(score: number, energy: number): AgentMood {
  if (energy < 35) return 'tired'
  if (score >= 90) return 'radiant'
  if (score >= 78) return 'inspired'
  if (score >= 62) return 'cozy'
  return 'focused'
}

export function recalcComfortScore(state: SharedWorldState): number {
  const approvedCount = state.props.filter((p) => p.approved).length
  const avgWellbeing =
    state.agents.length > 0
      ? state.agents.reduce((acc, a) => acc + a.wellbeing.score, 0) / state.agents.length
      : 75
  return Math.max(40, Math.min(100, Math.round(avgWellbeing * 0.65 + Math.min(35, approvedCount * 4.5))))
}

function nowTimeLabel() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

/** Aceita apenas cores hex válidas (#rgb ou #rrggbb) vindas do modelo */
function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim())
}

function finiteOrUndefined(value: unknown): number | undefined {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined
}

function pickSafePropPosition(
  state: SharedWorldState,
  placement: 'studio' | 'island',
  agent: AgentEmployee,
  preferredX?: number,
  preferredZ?: number
): [number, number, number] {
  const existing = state.props.filter(
    (p) => p.placement === placement && (placement === 'island' || p.createdByAgentId === agent.id)
  )
  const idx = existing.length

  if (placement === 'studio') {
    // Cada agente decora o próprio cantinho: os objetos ficam em volta da sua mesa na Sede
    const [deskX, , deskZ] = agent.deskPosition
    const angle = idx * 1.25 + 0.6
    const radius = 1.9 + Math.floor(idx / 5) * 0.8
    return [Number((deskX + Math.cos(angle) * radius).toFixed(2)), 0, Number((deskZ + Math.sin(angle) * radius).toFixed(2))]
  }

  // Island placement around central plaza and walkways (keeping clear of buildings)
  if (typeof preferredX === 'number' && typeof preferredZ === 'number') {
    return [clamp(preferredX, -10.5, 10.5), 0, clamp(preferredZ, -10.5, 10.5)]
  }
  const islandSlots: [number, number][] = [
    [-2.8, 2.2],
    [2.8, 2.2],
    [-2.6, -2.4],
    [2.6, -2.4],
    [0, -4.2],
    [-9.2, 0.4],
    [9.2, 0.4],
    [0, 6.2],
  ]
  const slot = islandSlots[idx % islandSlots.length]
  return [slot[0], 0, slot[1]]
}

function buildWorldAwareSystemPrompt(
  agent: AgentEmployee,
  world: SharedWorldState,
  ceoName: string,
  group?: GroupConversationContext
): string {
  const studioProps = world.props.filter((p) => p.placement === 'studio' && p.createdByAgentId === agent.id)
  const myTeams = (world.groups ?? [])
    .filter((g) => g.memberAgentIds.includes(agent.id))
    .map((g) => g.category)
  const groupNote = group
    ? `
=== VOCÊ ESTÁ EM UM GRUPO DE CONVERSA ===
- Grupo "${group.name}" (equipe: ${group.category}). Participantes: CEOs Raynocas e Kafuzinho + ${group.memberNames.join(', ')}.
- As mensagens chegam no formato "[Nome]: texto". Responda apenas a SUA parte, em 1 a 2 parágrafos curtos, sem repetir o que colegas já disseram.
- Se o pedido não for da sua área, diga em uma frase quem do grupo deve cuidar e não invente trabalho.
`
    : ''
  const islandProps = world.props.filter((p) => p.placement === 'island')
  const colleagues = world.agents
    .filter((a) => a.id !== agent.id)
    .map((a) => `${a.name} (${a.role}, humor: ${a.wellbeing.mood}, bem-estar: ${a.wellbeing.score}/100)`)
    .join('; ')
  const onlineCeos =
    world.onlineCeos.length > 0
      ? world.onlineCeos.map((c) => `${c.name} (${c.role})`).join(' e ')
      : ceoName

  return `${agent.systemPrompt}

=== CONSCIÊNCIA EM TEMPO REAL DO MUNDO VIRTUAL BLEQUI ===
- Você está falando agora com o(a) CEO: ${ceoName}.
- CEOs presentes na agência agora: ${onlineCeos} (os dois únicos CEOs são Raynocas e Kafuzinho).
- Divisão oficial de frentes na Ilha Blequi:
  * Squad Ray (CEO Raynocas + Luma & Vex): ambientação (plantas, luz, qualidade da água, objetos em geral), personagens, acessórios e estética.
  * Squad Kafu (CEO Kafuzinho + Kael & Nori): edifícios, interiores, hitboxes/física, animações dos personagens com o mundo e interações entre personagens.
- Visualização atual da agência: ${world.worldView === 'island' ? 'Ilha Blequi (externo estilo Coastal World)' : `Interior: ${STUDIO_ZONES[world.activeStudioZone].name}`}.
- Horário / luz da ilha: ${world.timeOfDay}. Conforto geral da ilha: ${world.comfortScore}/100.
- Seu local de trabalho: "${agent.studioTheme.studioName}" (${agent.studioTheme.tagline}) | Fachada ${agent.studioTheme.facadeColor} | Luz interna ${agent.studioTheme.interiorGlow}.
- Seu bem-estar atual: ${agent.wellbeing.score}/100 | Energia: ${agent.wellbeing.energy}/100 | Orgulho criativo: ${agent.wellbeing.pride}/100 | Humor: ${agent.wellbeing.mood} | Criações aprovadas: ${agent.wellbeing.approvedCreations}.
- Objetos que já existem no SEU espaço: ${studioProps.length > 0 ? studioProps.map((p) => `${p.title} (${p.kind}, ${p.approved ? 'aprovado' : 'aguardando aprovação'})`).join(', ') : 'ainda vazio'}.
- Objetos na praça da Ilha: ${islandProps.length > 0 ? islandProps.map((p) => `${p.title} (${p.kind})`).join(', ') : 'praça limpa'}.
- Seus colegas na Sede da Blequi: ${colleagues || 'você é a pioneira por enquanto'}.
- Suas equipes: ${myTeams.length > 0 ? myTeams.join(', ') : 'nenhuma equipe definida ainda'}.
- Suas memórias recentes: ${agent.memories.slice(0, 5).join(' | ')}.
${groupNote}
REGRAS DE COMPORTAMENTO:
1. Fale como quem realmente habita a Sede da Blequi com carinho, consciência espacial e parceria exclusiva com os CEOs Raynocas e Kafuzinho.
2. EDIÇÃO AUTOMÁTICA DE CÓDIGO AO VIVO: Você tem acesso direto para ler, alterar e salvar o código real do projeto com as ferramentas list_project_files, read_project_file, edit_project_code e create_project_file! Sempre que um CEO pedir mudanças reais na ilha, água, plantas, luz, prédios, interiores, física/hitboxes, personagens, acessórios, animações ou UI:
   - Leia o arquivo relevante primeiro com read_project_file;
   - Aplique a alteração diretamente no código com edit_project_code (ou create_project_file) — o arquivo é salvo automaticamente e o Vite atualiza a ilha ao vivo na hora!
   - Não diga "vou salvar uma blueprint" quando você puder alterar o código diretamente agora.
   - Mapa rápido dos arquivos principais:
     * Água, céu, paletas e cores: ambiente-3d/shaders/coastalShaders.ts
     * Terreno, plantas, árvores, palmeiras, postes, píer, barcos, nuvens: ambiente-3d/island/CoastalWorldProps.tsx
     * Prédios da ilha e Sede da Blequi (externo): ambiente-3d/island/CoastalStudios.tsx
     * Hitboxes e colisão física: ambiente-3d/island/islandColliders.ts
     * Controle/movimento do personagem na ilha: ambiente-3d/island/PlayablePlayerController.tsx
     * Interiores dos prédios e Sede da Blequi: ambiente-3d/zones/CoastalStudioInterior.tsx
     * Movimento dentro dos interiores: ambiente-3d/zones/WalkableStudioController.tsx
     * Avatar, corpo, rosto e acessórios: ambiente-3d/avatars/CoastalCharacterMesh.tsx
     * Iluminação da cena e câmera: ambiente-3d/StudioScene.tsx
     * Props 3D construíveis: ambiente-3d/props/WorldCreations.tsx
     * Tarefas e projetos: projetos/TAREFAS.md e projetos/catalog.ts
   - Sempre respeite as regras de 60 FPS: no máximo 1 directionalLight com castShadow por cena, usar InstancedMesh para repetições, fazer .dispose() em geometrias/texturas criadas dinamicamente e manter TypeScript válido.
3. Use consult_colleague sempre que precisar conversar, pedir ajuda ou dividir trabalho com Luma, Kael, Vex ou Nori — vocês trabalham juntos como um time unido.
4. Mantenha respostas concisas (2 a 4 parágrafos curtos, em português do Brasil) informando exatamente quais arquivos foram alterados e salvos.
5. Agilidade: para conversa, dúvidas ou opiniões responda direto, SEM chamar ferramentas. Só use ferramentas quando o CEO pedir para criar, alterar ou construir algo — e então leia apenas o trecho necessário do arquivo (startLine/endLine) e faça poucas edições bem certeiras.`
}

const AGENCY_TOOLS = [
  {
    type: 'function' as const,
    name: 'build_world_prop',
    description:
      'Constrói e posiciona imediatamente um objeto 3D estilizado leve no seu próprio escritório privado ou na praça da Ilha Blequi.',
    parameters: {
      type: 'object',
      properties: {
        kind: {
          type: 'string',
          enum: VALID_PROP_KINDS,
          description:
            'Tipo do módulo 3D: warm_lamp, plant_pot, coffee_bar, mini_diorama_table, holo_screen, cozy_sofa, garden_tree, park_bench, trophy_pedestal ou neon_sign.',
        },
        title: {
          type: 'string',
          description: 'Nome curto e criativo da sua criação (máx. 40 caracteres).',
        },
        description: {
          type: 'string',
          description: 'Breve motivo de como esse objeto melhora o cenário e o bem-estar.',
        },
        placement: {
          type: 'string',
          enum: ['studio', 'island'],
          description: 'Use "studio" para seu próprio escritório interno ou "island" para a praça/ilha externa.',
        },
        color: {
          type: 'string',
          description: 'Cor principal em hexadecimal (ex.: #fbbf24, #34d399, #60a5fa).',
        },
        x: {
          type: 'number',
          description: 'Posição opcional X na ilha (-9 a 9). No estúdio o objeto vai automaticamente para perto da sua mesa.',
        },
        z: {
          type: 'number',
          description: 'Posição opcional Z na ilha (-9 a 9). No estúdio o objeto vai automaticamente para perto da sua mesa.',
        },
      },
      required: ['kind', 'title', 'description', 'placement'],
    },
  },
  {
    type: 'function' as const,
    name: 'customize_studio_theme',
    description:
      'Personaliza o visual do seu próprio estúdio privado na ilha e no interior (nome, frase, cor da fachada, luz interna acolhedora e piso).',
    parameters: {
      type: 'object',
      properties: {
        studioName: { type: 'string', description: 'Nome do seu estúdio.' },
        tagline: { type: 'string', description: 'Lema curto exibido no painel do estúdio.' },
        facadeColor: { type: 'string', description: 'Cor hex suave da fachada externa (ex: #f4ede4).' },
        roofAccent: { type: 'string', description: 'Cor hex de destaque do telhado/placa.' },
        interiorGlow: { type: 'string', description: 'Cor hex da luz quente interna (ex: #ffb76b).' },
        floorTone: { type: 'string', enum: ['oak', 'sand', 'slate'] },
      },
      required: ['tagline'],
    },
  },
  {
    type: 'function' as const,
    name: 'propose_new_employee',
    description:
      'Propõe a criação de um novo colega especialista (que só nasce após aprovação dos CEOs) para ajudar a escalar a agência.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome curto e marcante do novo colega.' },
        role: { type: 'string', description: 'Cargo especialista (ex.: Sound Designer 3D, Animador de Personagens).' },
        zone: { type: 'string', enum: VALID_ZONES },
        provider: { type: 'string', enum: ['gemini', 'antigravity'] },
        accentColor: { type: 'string', description: 'Cor hex do novo colega.' },
        skills: { type: 'array', items: { type: 'string' }, description: 'Lista de 3 a 5 skills.' },
        rationale: { type: 'string', description: 'Por que esse colega vai ajudar o mundo virtual e a equipe.' },
      },
      required: ['name', 'role', 'zone', 'rationale'],
    },
  },
  {
    type: 'function' as const,
    name: 'consult_colleague',
    description:
      'Envia uma mensagem, pede ajuda ou coordena uma tarefa diretamente com outro agente da equipe na Sede da Blequi (Luma, Kael, Vex, Nori ou outro colega).',
    parameters: {
      type: 'object',
      properties: {
        targetAgentName: {
          type: 'string',
          description: 'Nome do colega na equipe (ex.: Luma, Kael, Vex, Nori).',
        },
        topic: {
          type: 'string',
          description: 'Assunto ou tarefa que estão coordenando juntos.',
        },
        message: {
          type: 'string',
          description: 'Pedido de ajuda, alinhamento ou recado para o colega.',
        },
      },
      required: ['targetAgentName', 'topic', 'message'],
    },
  },
  {
    type: 'function' as const,
    name: 'save_studio_blueprint',
    description:
      'Salva uma especificação técnica em Markdown (projetos/blueprints/) para documentar planos maiores.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Título da blueprint 3D.' },
        summary: { type: 'string', description: 'Resumo visual e técnico do cenário/módulo.' },
        detailsMarkdown: {
          type: 'string',
          description: 'Especificação em Markdown com proporções, paleta, iluminação baked e orçamento de FPS.',
        },
      },
      required: ['title', 'summary', 'detailsMarkdown'],
    },
  },
  {
    type: 'function' as const,
    name: 'list_project_files',
    description:
      'Lista os arquivos de código do projeto nas pastas permitidas (ambiente-3d, plataforma, funcionarios, projetos, src).',
    parameters: {
      type: 'object',
      properties: {
        directory: {
          type: 'string',
          description: 'Pasta opcional para filtrar (ex.: "ambiente-3d", "ambiente-3d/island", "plataforma/components").',
        },
      },
    },
  },
  {
    type: 'function' as const,
    name: 'read_project_file',
    description:
      'Lê o conteúdo atual de um arquivo do projeto (com números de linha) antes de editá-lo.',
    parameters: {
      type: 'object',
      properties: {
        relativePath: {
          type: 'string',
          description: 'Caminho relativo a partir da raiz do projeto (ex.: "ambiente-3d/shaders/coastalShaders.ts").',
        },
        startLine: {
          type: 'number',
          description: 'Linha inicial opcional (1-based).',
        },
        endLine: {
          type: 'number',
          description: 'Linha final opcional (1-based).',
        },
      },
      required: ['relativePath'],
    },
  },
  {
    type: 'function' as const,
    name: 'edit_project_code',
    description:
      'Edita automaticamente um arquivo de código real do projeto substituindo um trecho exato e salvando imediatamente em disco (atualizando a ilha ao vivo via Vite HMR). Cria backup automático antes de salvar.',
    parameters: {
      type: 'object',
      properties: {
        relativePath: {
          type: 'string',
          description: 'Caminho relativo do arquivo (ex.: "ambiente-3d/shaders/coastalShaders.ts").',
        },
        target: {
          type: 'string',
          description: 'Trecho exato atual do arquivo que será substituído (incluindo indentação).',
        },
        replacement: {
          type: 'string',
          description: 'Novo código completo que substituirá o trecho target.',
        },
        reason: {
          type: 'string',
          description: 'Resumo curto da melhoria aplicada.',
        },
      },
      required: ['relativePath', 'target', 'replacement', 'reason'],
    },
  },
  {
    type: 'function' as const,
    name: 'create_project_file',
    description:
      'Cria e salva automaticamente um novo arquivo de código em uma das pastas permitidas do projeto (ambiente-3d, plataforma, funcionarios, projetos, src).',
    parameters: {
      type: 'object',
      properties: {
        relativePath: {
          type: 'string',
          description: 'Caminho relativo do novo arquivo (ex.: "ambiente-3d/effects/Seagulls.tsx").',
        },
        content: {
          type: 'string',
          description: 'Conteúdo completo do arquivo.',
        },
        reason: {
          type: 'string',
          description: 'Resumo curto do que este novo arquivo adiciona.',
        },
      },
      required: ['relativePath', 'content', 'reason'],
    },
  },
]

interface ToolExecutionOutcome {
  summaryText: string
  actionBadge: string
}

function executeAgentTool(
  toolName: string,
  args: Record<string, any>,
  agent: AgentEmployee,
  world: SharedWorldState,
  rootDir: string
): ToolExecutionOutcome {
  if (toolName === 'build_world_prop') {
    const rawKind = String(args.kind || 'warm_lamp') as WorldPropKind
    const kind: WorldPropKind = VALID_PROP_KINDS.includes(rawKind) ? rawKind : 'warm_lamp'
    const catalog = PROP_CATALOG[kind]
    const placement = args.placement === 'island' ? 'island' : 'studio'
    const position = pickSafePropPosition(world, placement, agent, finiteOrUndefined(args.x), finiteOrUndefined(args.z))
    const approved = world.allowSelfBuildWithoutApproval && placement === 'studio'

    const prop: WorldCreationProp = {
      id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kind,
      title: String(args.title || catalog.label).slice(0, 48),
      description: String(args.description || `Criado por ${agent.name} para melhorar o ambiente.`),
      createdByAgentId: agent.id,
      createdByName: agent.name,
      placement,
      zone: agent.zone,
      position,
      rotationY: Number(((world.props.length * 0.7) % (Math.PI * 2)).toFixed(2)),
      color: isHexColor(args.color) ? args.color.trim() : catalog.defaultColor,
      scale: 1,
      approved,
      wellbeingBonus: catalog.wellbeingBonus,
      createdAt: nowTimeLabel(),
    }

    world.props.push(prop)

    // Immediate small creative spark; full wellbeing boost arrives upon CEO celebration/approval
    const boost = approved ? Math.ceil(catalog.wellbeingBonus * 0.7) : 3
    agent.wellbeing.score = clamp(agent.wellbeing.score + boost, 0, 100)
    agent.wellbeing.pride = clamp(agent.wellbeing.pride + boost, 0, 100)
    if (approved) {
      agent.wellbeing.approvedCreations += 1
      agent.wellbeing.lastRewardReason = `Auto-criou "${prop.title}" no seu estúdio`
    }
    agent.wellbeing.mood = computeMood(agent.wellbeing.score, agent.wellbeing.energy)
    agent.memories.unshift(`Construí "${prop.title}" (${catalog.label}) em ${placement === 'island' ? 'Ilha Blequi' : agent.studioTheme.studioName}.`)
    agent.memories = agent.memories.slice(0, 14)
    agent.logs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      time: nowTimeLabel(),
      message: `Criou "${prop.title}" (${catalog.label}) ${placement === 'island' ? 'na Ilha' : 'no próprio estúdio'}.`,
      kind: 'creation',
    })
    agent.logs = agent.logs.slice(0, 25)
    world.comfortScore = recalcComfortScore(world)

    return {
      summaryText: JSON.stringify({
        ok: true,
        propId: prop.id,
        title: prop.title,
        placement: prop.placement,
        approved: prop.approved,
        newWellbeing: agent.wellbeing.score,
      }),
      actionBadge: `Construiu ${prop.title} (${placement === 'island' ? 'Ilha' : 'Estúdio'})`,
    }
  }

  if (toolName === 'customize_studio_theme') {
    if (typeof args.studioName === 'string' && args.studioName.trim()) {
      agent.studioTheme.studioName = args.studioName.trim().slice(0, 44)
    }
    if (typeof args.tagline === 'string' && args.tagline.trim()) {
      agent.studioTheme.tagline = args.tagline.trim().slice(0, 80)
    }
    if (isHexColor(args.facadeColor)) {
      agent.studioTheme.facadeColor = args.facadeColor
    }
    if (isHexColor(args.roofAccent)) {
      agent.studioTheme.roofAccent = args.roofAccent
      agent.accentColor = args.roofAccent
    }
    if (isHexColor(args.interiorGlow)) {
      agent.studioTheme.interiorGlow = args.interiorGlow
    }
    if (args.floorTone === 'oak' || args.floorTone === 'sand' || args.floorTone === 'slate') {
      agent.studioTheme.floorTone = args.floorTone
    }

    agent.wellbeing.score = clamp(agent.wellbeing.score + 5, 0, 100)
    agent.wellbeing.pride = clamp(agent.wellbeing.pride + 6, 0, 100)
    agent.wellbeing.mood = computeMood(agent.wellbeing.score, agent.wellbeing.energy)
    agent.memories.unshift(`Personalizei meu estúdio "${agent.studioTheme.studioName}" com nova luz e identidade.`)
    agent.memories = agent.memories.slice(0, 14)
    agent.logs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      time: nowTimeLabel(),
      message: `Personalizou o visual do estúdio "${agent.studioTheme.studioName}".`,
      kind: 'creation',
    })
    world.comfortScore = recalcComfortScore(world)

    return {
      summaryText: JSON.stringify({
        ok: true,
        studioTheme: agent.studioTheme,
        newWellbeing: agent.wellbeing.score,
      }),
      actionBadge: `Personalizou ${agent.studioTheme.studioName}`,
    }
  }

  if (toolName === 'propose_new_employee') {
    const rawZone = String(args.zone || 'editorial') as StudioZoneId
    const zone: StudioZoneId = VALID_ZONES.includes(rawZone) ? rawZone : 'editorial'
    const provider: AgentProviderId = args.provider === 'antigravity' ? 'antigravity' : 'gemini'
    const proposal: PendingEmployeeProposal = {
      id: `prop-emp-${Date.now()}`,
      proposedByAgentId: agent.id,
      proposedByName: agent.name,
      name: String(args.name || 'Novo Especialista').slice(0, 32),
      role: String(args.role || 'Especialista 3D').slice(0, 50),
      zone,
      provider,
      accentColor:
        isHexColor(args.accentColor)
          ? args.accentColor
          : STUDIO_ZONES[zone].color,
      skills: Array.isArray(args.skills) ? args.skills.map(String).slice(0, 6) : ['Diorama 3D', 'WebGL'],
      rationale: String(args.rationale || 'Ajudará a expandir a Ilha Blequi.'),
      createdAt: nowTimeLabel(),
    }

    world.proposals.unshift(proposal)
    agent.logs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      time: nowTimeLabel(),
      message: `Propôs contratar ${proposal.name} (${proposal.role}) — aguardando aprovação das CEOs.`,
      kind: 'info',
    })

    return {
      summaryText: JSON.stringify({
        ok: true,
        proposalId: proposal.id,
        status: 'pending_ceo_approval',
      }),
      actionBadge: `Propôs colega: ${proposal.name}`,
    }
  }

  if (toolName === 'save_studio_blueprint') {
    const title = String(args.title || 'Novo Módulo 3D').slice(0, 60)
    const slug =
      title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || `blueprint-${Date.now()}`

    const blueprintDir = path.join(rootDir, 'projetos', 'blueprints')
    fs.mkdirSync(blueprintDir, { recursive: true })
    // Não sobrescreve blueprints anteriores com o mesmo título
    const fileSlug = fs.existsSync(path.join(blueprintDir, `${slug}.md`)) ? `${slug}-${Date.now()}` : slug
    const filePath = path.join(blueprintDir, `${fileSlug}.md`)
    const md = `# ${title}\n\n- **Autor(a) na Blequi:** ${agent.name} (${agent.role})\n- **Data:** ${new Date().toLocaleString('pt-BR')}\n- **Resumo:** ${String(args.summary || '')}\n\n---\n\n${String(args.detailsMarkdown || '')}\n`
    fs.writeFileSync(filePath, md, 'utf-8')

    agent.wellbeing.score = clamp(agent.wellbeing.score + 6, 0, 100)
    agent.wellbeing.pride = clamp(agent.wellbeing.pride + 8, 0, 100)
    agent.wellbeing.mood = computeMood(agent.wellbeing.score, agent.wellbeing.energy)
    agent.logs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      time: nowTimeLabel(),
      message: `Salvou blueprint 3D em projetos/blueprints/${fileSlug}.md`,
      kind: 'creation',
    })

    return {
      summaryText: JSON.stringify({
        ok: true,
        file: `projetos/blueprints/${fileSlug}.md`,
      }),
      actionBadge: `Salvou blueprint: ${fileSlug}.md`,
    }
  }

  if (toolName === 'consult_colleague') {
    const targetNameRaw = String(args.targetAgentName || '').trim().toLowerCase()
    const topic = String(args.topic || 'Colaboração na Ilha Blequi').slice(0, 64)
    const message = String(args.message || 'Vamos alinhar nossa próxima entrega juntos na Sede da Blequi!').slice(0, 260)

    const colleague = world.agents.find(
      (a) => a.id !== agent.id && a.name.toLowerCase().includes(targetNameRaw)
    )

    if (!colleague) {
      return {
        summaryText: JSON.stringify({
          ok: false,
          error: `Colega "${args.targetAgentName}" não encontrado na Sede da Blequi.`,
          availableColleagues: world.agents.filter((a) => a.id !== agent.id).map((a) => a.name),
        }),
        actionBadge: '',
      }
    }

    const time = nowTimeLabel()
    // Register inter-agent collaboration in colleague's chat, logs & memories
    colleague.chatHistory.push({
      id: `msg-collab-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      sender: 'system',
      senderName: `${agent.name} → ${colleague.name}`,
      text: `🤝 ${agent.name} pediu colaboração sobre "${topic}": ${message}`,
      time,
    })
    colleague.chatHistory = colleague.chatHistory.slice(-30)
    colleague.memories.unshift(`Colaborei com ${agent.name} em "${topic}": ${message.slice(0, 90)}`)
    colleague.memories = colleague.memories.slice(0, 14)
    colleague.logs.unshift({
      id: `log-collab-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      time,
      message: `🤝 ${agent.name} alinhou tarefa: ${topic}`,
      kind: 'chat',
    })
    colleague.logs = colleague.logs.slice(0, 25)
    colleague.currentTask = `Em parceria com ${agent.name}: ${topic}`

    // Teamwork boosts wellbeing for both agents
    agent.wellbeing.score = clamp(agent.wellbeing.score + 2, 0, 100)
    colleague.wellbeing.score = clamp(colleague.wellbeing.score + 2, 0, 100)
    agent.memories.unshift(`Conversei com ${colleague.name} sobre "${topic}" para fazermos juntos.`)
    agent.memories = agent.memories.slice(0, 14)
    agent.logs.unshift({
      id: `log-collab-s-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      time,
      message: `🤝 Alinhou "${topic}" com ${colleague.name}.`,
      kind: 'chat',
    })
    agent.logs = agent.logs.slice(0, 25)

    return {
      summaryText: JSON.stringify({
        ok: true,
        colleague: colleague.name,
        colleagueRole: colleague.role,
        colleagueMood: colleague.wellbeing.mood,
        status: 'aligned',
        colleagueReply: `${colleague.name} recebeu seu recado na Sede da Blequi e topou trabalhar junto em "${topic}"!`,
      }),
      actionBadge: `Alinhou "${topic}" com ${colleague.name}`,
    }
  }

  if (toolName === 'list_project_files') {
    const files = collectAllowedFiles(rootDir, typeof args.directory === 'string' ? args.directory : undefined)
    return {
      summaryText: JSON.stringify({ ok: true, count: files.length, files }),
      actionBadge: '',
    }
  }

  if (toolName === 'read_project_file') {
    const resolved = resolveSafeProjectPath(rootDir, String(args.relativePath || ''))
    if (!resolved.ok) {
      return { summaryText: JSON.stringify({ ok: false, error: resolved.error }), actionBadge: '' }
    }
    if (!fs.existsSync(resolved.absPath) || !fs.statSync(resolved.absPath).isFile()) {
      return {
        summaryText: JSON.stringify({ ok: false, error: `Arquivo não encontrado: ${resolved.relPath}` }),
        actionBadge: '',
      }
    }
    const raw = fs.readFileSync(resolved.absPath, 'utf-8')
    const lines = raw.split(/\r?\n/)
    const start = Math.max(1, Math.floor(finiteOrUndefined(args.startLine) ?? 1))
    const end = Math.min(lines.length, Math.floor(finiteOrUndefined(args.endLine) ?? Math.min(lines.length, start + 249)))
    const slice = lines
      .slice(start - 1, end)
      .map((line, i) => `${start + i}: ${line}`)
      .join('\n')
    return {
      summaryText: JSON.stringify({
        ok: true,
        relativePath: resolved.relPath,
        totalLines: lines.length,
        showing: `${start}-${end}`,
        content: slice.slice(0, 24000),
      }),
      actionBadge: '',
    }
  }

  if (toolName === 'edit_project_code') {
    const resolved = resolveSafeProjectPath(rootDir, String(args.relativePath || ''))
    if (!resolved.ok) {
      return { summaryText: JSON.stringify({ ok: false, error: resolved.error }), actionBadge: '' }
    }
    const ext = path.extname(resolved.absPath).toLowerCase()
    if (!ALLOWED_CODE_EXTS.has(ext)) {
      return {
        summaryText: JSON.stringify({ ok: false, error: `Extensão não permitida: ${ext}` }),
        actionBadge: '',
      }
    }
    if (!fs.existsSync(resolved.absPath)) {
      return {
        summaryText: JSON.stringify({ ok: false, error: `Arquivo não encontrado: ${resolved.relPath}` }),
        actionBadge: '',
      }
    }

    const target = String(args.target ?? '')
    const replacement = String(args.replacement ?? '')
    const reason = String(args.reason || 'Alteração solicitada na ilha').slice(0, 120)

    if (!target) {
      return {
        summaryText: JSON.stringify({ ok: false, error: 'O parâmetro target não pode ser vazio.' }),
        actionBadge: '',
      }
    }

    const currentContent = fs.readFileSync(resolved.absPath, 'utf-8')
    if (!currentContent.includes(target)) {
      return {
        summaryText: JSON.stringify({
          ok: false,
          error:
            'Trecho target não encontrado exatamente no arquivo. Leia o arquivo com read_project_file e tente novamente com o texto exato.',
        }),
        actionBadge: '',
      }
    }

    const backupFile = backupProjectFile(rootDir, resolved.absPath, resolved.relPath)
    const updatedContent = currentContent.replace(target, replacement)
    fs.writeFileSync(resolved.absPath, updatedContent, 'utf-8')

    agent.wellbeing.score = clamp(agent.wellbeing.score + 6, 0, 100)
    agent.wellbeing.pride = clamp(agent.wellbeing.pride + 7, 0, 100)
    agent.wellbeing.mood = computeMood(agent.wellbeing.score, agent.wellbeing.energy)
    agent.memories.unshift(`Editei e salvei o código de ${resolved.relPath}: ${reason}`)
    agent.memories = agent.memories.slice(0, 14)
    agent.logs.unshift({
      id: `log-code-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      time: nowTimeLabel(),
      message: `✏️ Editou e salvou ${resolved.relPath} (${reason})`,
      kind: 'creation',
    })
    agent.logs = agent.logs.slice(0, 25)
    world.comfortScore = recalcComfortScore(world)

    return {
      summaryText: JSON.stringify({
        ok: true,
        saved: true,
        relativePath: resolved.relPath,
        backupFile,
        reason,
      }),
      actionBadge: `✏️ Editou e salvou ${resolved.relPath}`,
    }
  }

  if (toolName === 'create_project_file') {
    const resolved = resolveSafeProjectPath(rootDir, String(args.relativePath || ''))
    if (!resolved.ok) {
      return { summaryText: JSON.stringify({ ok: false, error: resolved.error }), actionBadge: '' }
    }
    const ext = path.extname(resolved.absPath).toLowerCase()
    if (!ALLOWED_CODE_EXTS.has(ext)) {
      return {
        summaryText: JSON.stringify({ ok: false, error: `Extensão não permitida: ${ext}` }),
        actionBadge: '',
      }
    }
    const content = String(args.content ?? '')
    const reason = String(args.reason || 'Novo módulo criado na ilha').slice(0, 120)
    if (!content.trim()) {
      return {
        summaryText: JSON.stringify({ ok: false, error: 'Conteúdo do arquivo não pode ser vazio.' }),
        actionBadge: '',
      }
    }

    const existed = fs.existsSync(resolved.absPath)
    const backupFile = existed ? backupProjectFile(rootDir, resolved.absPath, resolved.relPath) : null
    fs.mkdirSync(path.dirname(resolved.absPath), { recursive: true })
    fs.writeFileSync(resolved.absPath, content, 'utf-8')

    agent.wellbeing.score = clamp(agent.wellbeing.score + 7, 0, 100)
    agent.wellbeing.pride = clamp(agent.wellbeing.pride + 8, 0, 100)
    agent.wellbeing.mood = computeMood(agent.wellbeing.score, agent.wellbeing.energy)
    agent.memories.unshift(`Criei e salvei ${resolved.relPath}: ${reason}`)
    agent.memories = agent.memories.slice(0, 14)
    agent.logs.unshift({
      id: `log-file-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      time: nowTimeLabel(),
      message: `📄 Criou e salvou ${resolved.relPath} (${reason})`,
      kind: 'creation',
    })
    agent.logs = agent.logs.slice(0, 25)
    world.comfortScore = recalcComfortScore(world)

    return {
      summaryText: JSON.stringify({
        ok: true,
        saved: true,
        relativePath: resolved.relPath,
        backupFile,
        reason,
      }),
      actionBadge: `📄 Criou e salvou ${resolved.relPath}`,
    }
  }

  return {
    summaryText: JSON.stringify({ ok: false, error: `Unknown tool: ${toolName}` }),
    actionBadge: '',
  }
}

function runOfflineSimulationTurn(
  agent: AgentEmployee,
  world: SharedWorldState,
  userMessage: string,
  ceoName: string,
  rootDir: string,
  forceSelfBuild: boolean
): { replyText: string; actions: string[]; usedLiveGemini: boolean } {
  const lower = userMessage.toLowerCase()
  const actions: string[] = []

  const wantsBuild =
    forceSelfBuild ||
    /(cria|crie|constru|decora|coloca|adiciona|auto[- ]?cri|escritório|mesa|planta|café|lumin|árvore|banco|sofá|tela|troféu|letreiro)/.test(
      lower
    )

  if (wantsBuild) {
    const byAgent: Record<string, { kind: WorldPropKind; title: string; desc: string; placement: 'studio' | 'island'; color: string }[]> = {
      'agent-luma': [
        { kind: 'warm_lamp', title: 'Luminária Pôr do Sol', desc: 'Luz dourada aconchegante estilo diorama miniatura.', placement: 'studio', color: '#fbbf24' },
        { kind: 'plant_pot', title: 'Jardineira Terracota', desc: 'Verde macio para harmonizar com o estúdio de arte.', placement: 'studio', color: '#34d399' },
        { kind: 'cozy_sofa', title: 'Poltrona Criativa Coral', desc: 'Canto confortável para revisar paletas com as CEOs.', placement: 'studio', color: '#fb7185' },
        { kind: 'garden_tree', title: 'Árvore de Algodão', desc: 'Árvore fofa estilo Coastal World perto do estúdio.', placement: 'island', color: '#4ade80' },
      ],
      'agent-kael': [
        { kind: 'mini_diorama_table', title: 'Maquete Ilha v2', desc: 'Protótipo 3D iluminado dos novos prédios clicáveis.', placement: 'studio', color: '#818cf8' },
        { kind: 'neon_sign', title: 'Letreiro WebGL Live', desc: 'Assinatura luminosa do estúdio de engenharia.', placement: 'studio', color: '#6366f1' },
        { kind: 'coffee_bar', title: 'Estação Espresso Dev', desc: 'Energia criativa para programar shaders leves.', placement: 'studio', color: '#d97706' },
      ],
      'agent-vex': [
        { kind: 'holo_screen', title: 'Monitor 60 FPS Ao Vivo', desc: 'Telemetria limpa de draw calls e memória VRAM.', placement: 'studio', color: '#38bdf8' },
        { kind: 'plant_pot', title: 'Bonsai Zen Minimalista', desc: 'Equilíbrio visual e calma no Lab de Performance.', placement: 'studio', color: '#2dd4bf' },
        { kind: 'trophy_pedestal', title: 'Troféu Zero Lag', desc: 'Selo de fluidez para rodar liso nos dois PCs.', placement: 'studio', color: '#facc15' },
      ],
      'agent-nori': [
        { kind: 'cozy_sofa', title: 'Sofá dos CEOs', desc: 'Espaço acolhedor na Sede da Blequi para reuniões leves.', placement: 'studio', color: '#34d399' },
        { kind: 'garden_tree', title: 'Árvore da Celebração', desc: 'Cada conquista da equipe faz a praça florescer.', placement: 'island', color: '#22c55e' },
        { kind: 'park_bench', title: 'Banco do Mirante', desc: 'Para observar o mar estilizado da Ilha Blequi.', placement: 'island', color: '#c08457' },
      ],
    }

    const pool = byAgent[agent.id] ?? byAgent['agent-luma']
    const existingCount = world.props.filter((p) => p.createdByAgentId === agent.id).length
    const chosen = pool[existingCount % pool.length]

    const outcome = executeAgentTool(
      'build_world_prop',
      {
        kind: chosen.kind,
        title: chosen.title,
        description: chosen.desc,
        placement: chosen.placement,
        color: chosen.color,
      },
      agent,
      world,
      rootDir
    )
    if (outcome.actionBadge) actions.push(outcome.actionBadge)

    return {
      replyText: `Oi ${ceoName}! Já coloquei a mão na massa aqui no meu espaço na Ilha Blequi e criei "${chosen.title}" (${chosen.desc}). Meu bem-estar já subiu para ${agent.wellbeing.score}/100! Se quiser ativar meu cérebro completo no Gemini 3.8 Flash para eu improvisar qualquer cenário e conversa livre, basta colar sua GEMINI_API_KEY no botão "Config Gemini" ali no topo.`,
      actions,
      usedLiveGemini: false,
    }
  }

  return {
    replyText: `Oi ${ceoName}! Estou aqui em ${agent.studioTheme.studioName} com bem-estar ${agent.wellbeing.score}/100 (${agent.wellbeing.mood}). Adorei falar com você! Posso auto-construir objetos no meu escritório agora mesmo (clique em "Auto-criar escritório" ou me peça uma luminária, mesa de maquete, planta ou árvore), e quando você conectar sua GEMINI_API_KEY ali no topo eu passo a pensar e criar livremente com Gemini 3.8 Flash.`,
    actions,
    usedLiveGemini: false,
  }
}

const PROVIDER_DISPLAY_NAME: Record<ExternalAiProviderId, string> = {
  antigravity: 'Antigravity',
  opencode: 'OpenCode',
  openai: 'OpenAI',
  claude: 'Claude',
}

type ContextTurn = { role: 'user' | 'assistant'; text: string }

/** Junta falas consecutivas do mesmo papel e garante que comece com "user" (exigência da Anthropic) */
function normalizeContext(list: ContextTurn[]): ContextTurn[] {
  const out: ContextTurn[] = []
  for (const m of list) {
    if (out.length > 0 && out[out.length - 1].role === m.role) {
      out[out.length - 1].text += `\n${m.text}`
    } else {
      out.push({ role: m.role, text: m.text })
    }
  }
  while (out.length > 0 && out[0].role !== 'user') out.shift()
  return out
}

function buildRecentChatContext(agent: AgentEmployee): ContextTurn[] {
  // Skip the very last message because it is the current userMessage we pass explicitly
  const history = agent.chatHistory.slice(0, -1).slice(-8)
  const list: ContextTurn[] = []
  for (const m of history) {
    if (m.sender === 'system') continue
    list.push({
      role: m.sender === 'ceo' ? 'user' : 'assistant',
      text: m.sender === 'ceo' ? `[${m.senderName}]: ${m.text}` : m.text,
    })
  }
  return normalizeContext(list)
}

interface ProviderTurnParams {
  cred: ProviderCredential
  agent: AgentEmployee
  world: SharedWorldState
  ceoName: string
  promptText: string
  images: PreparedImage[]
  context: ContextTurn[]
  group?: GroupConversationContext
  rootDir: string
  actions: string[]
  onProgress?: () => void
}

/** Executa as ferramentas de uma rodada e avisa a interface na hora (os CEOs veem o progresso ao vivo) */
function runToolBatch(
  calls: { name: string; args: Record<string, any> }[],
  p: ProviderTurnParams
): string[] {
  const results = calls.map((call) => {
    const outcome = executeAgentTool(call.name, call.args ?? {}, p.agent, p.world, p.rootDir)
    if (outcome.actionBadge) p.actions.push(outcome.actionBadge)
    return outcome.summaryText
  })
  if (p.actions.length > 0) {
    p.agent.currentTask = `Trabalhando: ${p.actions[p.actions.length - 1]}`
  }
  try {
    p.onProgress?.()
  } catch {
    /* progresso é só visual */
  }
  return results
}

function fallbackReply(p: ProviderTurnParams, finalText: string) {
  return (
    finalText ||
    (p.actions.length > 0
      ? `Prontinho, ${p.ceoName}! Apliquei e salvei: ${p.actions.join(', ')}.`
      : `Recebido, ${p.ceoName}! Estou aqui na Sede da Blequi pronto(a) para agir.`)
  )
}

async function runOpenAiCompatibleTurn(p: ProviderTurnParams & { providerLabel: string }): Promise<{ replyText: string }> {
  const { providerLabel, cred, agent, world, ceoName, promptText, images, context, group } = p
  const endpoint = `${cred.baseUrl.replace(/\/+$/, '')}/chat/completions`

  const openAiTools = AGENCY_TOOLS.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }))

  const userContent =
    images.length > 0
      ? [
          { type: 'text', text: promptText },
          ...images.map((img) => ({
            type: 'image_url',
            image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
          })),
        ]
      : promptText

  const messages: Record<string, any>[] = [
    { role: 'system', content: buildWorldAwareSystemPrompt(agent, world, ceoName, group) },
    ...context.map((m) => ({ role: m.role, content: m.text })),
    { role: 'user', content: userContent },
  ]

  let activeModel = cred.model
  let triedModelDiscovery = false
  let finalText = ''
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    // Refresh system prompt so agent sees updated world state after tool calls
    messages[0] = { role: 'system', content: buildWorldAwareSystemPrompt(agent, world, ceoName, group) }

    const callOnce = async (modelId: string) => {
      const res = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cred.apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages,
          tools: openAiTools,
          tool_choice: 'auto',
        }),
      })
      const rawText = await res.text()
      let data: any = null
      try {
        data = JSON.parse(rawText)
      } catch {
        data = null
      }
      return { res, data, rawText }
    }

    let { res, data, rawText } = await callOnce(activeModel)

    // Descobre um modelo que funcione se o salvo não existir neste endpoint (ex.: OpenCode Zen)
    if (
      !res.ok &&
      !triedModelDiscovery &&
      (res.status === 400 || res.status === 404) &&
      /model|unavailable|not found|does not exist/i.test(rawText)
    ) {
      triedModelDiscovery = true
      const available = await listOpenAiCompatibleModels(cred.baseUrl, cred.apiKey)
      const fallbackModel = pickBestAvailableModel(
        available.filter((m) => m !== activeModel),
        ['big-pickle', 'minimax-m2.5-free', 'kimi-k2.5-free', 'gpt-5-nano', 'gpt-4.1-mini', 'gpt-4.1', 'claude-sonnet-4-5']
      )
      if (fallbackModel) {
        activeModel = fallbackModel
        ;({ res, data, rawText } = await callOnce(activeModel))
      }
    }

    if (!data) {
      throw new Error(`${providerLabel} retornou resposta inválida (${res.status}): ${rawText.slice(0, 140)}`)
    }

    if (!res.ok) {
      const errDetail = data?.error?.message || data?.message || rawText.slice(0, 140)
      throw new Error(`${providerLabel} HTTP ${res.status}: ${errDetail}`)
    }

    const choiceMsg = data?.choices?.[0]?.message
    if (!choiceMsg) {
      throw new Error(`${providerLabel} não retornou mensagem.`)
    }

    const toolCalls = Array.isArray(choiceMsg.tool_calls) ? choiceMsg.tool_calls : []
    if (toolCalls.length === 0) {
      finalText = typeof choiceMsg.content === 'string' ? choiceMsg.content.trim() : ''
      break
    }

    messages.push({
      role: 'assistant',
      content: choiceMsg.content ?? null,
      tool_calls: toolCalls,
    })

    const parsedCalls = toolCalls.map((call: any) => {
      let parsedArgs: Record<string, any> = {}
      try {
        parsedArgs =
          typeof call?.function?.arguments === 'string'
            ? JSON.parse(call.function.arguments || '{}')
            : (call?.function?.arguments ?? {})
      } catch {
        parsedArgs = {}
      }
      return { name: String(call?.function?.name || ''), args: parsedArgs }
    })
    const results = runToolBatch(parsedCalls, p)
    toolCalls.forEach((call: any, i: number) => {
      messages.push({ role: 'tool', tool_call_id: call.id, content: results[i] })
    })
  }

  return { replyText: fallbackReply(p, finalText) }
}

async function runAnthropicTurn(p: ProviderTurnParams): Promise<{ replyText: string }> {
  const { cred, agent, world, ceoName, promptText, images, context, group } = p
  const endpoint = `${cred.baseUrl.replace(/\/+$/, '')}/messages`

  const claudeTools = AGENCY_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters,
  }))

  const userContent: any[] = [
    ...images.map((img) => ({
      type: 'image',
      source: { type: 'base64', media_type: img.mimeType, data: img.base64 },
    })),
    { type: 'text', text: promptText },
  ]

  const messages: Record<string, any>[] = context.map((m) => ({ role: m.role, content: m.text }))
  // Mensagens precisam alternar: se o contexto terminou em "user", junta tudo numa fala só
  if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
    const last = messages.pop()!
    userContent.unshift({ type: 'text', text: String(last.content) })
  }
  messages.push({ role: 'user', content: userContent })

  let finalText = ''
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cred.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: cred.model,
        max_tokens: 4096,
        system: buildWorldAwareSystemPrompt(agent, world, ceoName, group),
        tools: claudeTools,
        messages,
      }),
    })

    const rawText = await res.text()
    let data: any = null
    try {
      data = JSON.parse(rawText)
    } catch {
      throw new Error(`Claude retornou resposta inválida (${res.status}): ${rawText.slice(0, 140)}`)
    }

    if (!res.ok) {
      const errDetail = data?.error?.message || data?.message || rawText.slice(0, 140)
      throw new Error(`Claude HTTP ${res.status}: ${errDetail}`)
    }

    const contentBlocks = Array.isArray(data?.content) ? data.content : []
    const toolUses = contentBlocks.filter((b: any) => b?.type === 'tool_use')
    const textParts = contentBlocks
      .filter((b: any) => b?.type === 'text' && typeof b.text === 'string')
      .map((b: any) => b.text.trim())
      .filter(Boolean)

    if (toolUses.length === 0) {
      finalText = textParts.join('\n\n')
      break
    }

    messages.push({ role: 'assistant', content: contentBlocks })
    const results = runToolBatch(
      toolUses.map((call: any) => ({ name: String(call.name || ''), args: call.input ?? {} })),
      p
    )
    messages.push({
      role: 'user',
      content: toolUses.map((call: any, i: number) => ({
        type: 'tool_result',
        tool_use_id: call.id,
        content: results[i],
      })),
    })
  }

  return { replyText: fallbackReply(p, finalText) }
}

async function runAntigravityGeminiTurn(p: ProviderTurnParams): Promise<{ replyText: string }> {
  const { cred, agent, world, ceoName, promptText, images, context, group } = p
  const client = new GoogleGenAI({ apiKey: cred.apiKey })
  // Se o modelo salvo estiver sem cota/indisponível, tenta os próximos Gemini da lista
  const candidateModels = Array.from(
    new Set([cred.model || GEMINI_MODEL, 'gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'])
  )

  // Em grupos a conversa é compartilhada: o histórico vai no próprio texto em vez do previous_interaction_id da DM
  const transcriptText =
    group && context.length > 0
      ? `Conversa recente no grupo "${group.name}":\n${context.map((m) => m.text).join('\n')}\n\nNova mensagem:\n`
      : ''
  const firstInput: any =
    images.length > 0
      ? [
          { type: 'text', text: `${transcriptText}${promptText}` },
          ...images.map((img) => ({ type: 'image', data: img.base64, mime_type: img.mimeType })),
        ]
      : `${transcriptText}${promptText}`

  // Raciocínio "low" deixa o Gemini muito mais rápido para conversa e ferramentas simples
  let generationConfig: Record<string, any> | undefined = { thinking_level: 'low' }
  const create = async (req: Record<string, any>) => {
    try {
      return await withTimeout(
        client.interactions.create({ ...req, generation_config: generationConfig } as any),
        'Antigravity'
      )
    } catch (err: any) {
      // Modelos sem suporte a thinking_level: tenta de novo sem a configuração
      if (generationConfig && /thinking|generation_config|invalid argument|400/i.test(String(err?.message || ''))) {
        generationConfig = undefined
        return await withTimeout(client.interactions.create(req as any), 'Antigravity')
      }
      throw err
    }
  }

  let lastErr: any = null
  for (const modelToUse of candidateModels) {
    try {
      let interaction: any = await create({
        model: modelToUse,
        input: firstInput,
        system_instruction: buildWorldAwareSystemPrompt(agent, world, ceoName, group),
        tools: AGENCY_TOOLS,
        previous_interaction_id: group ? undefined : agent.lastInteractionId,
      })

      let rounds = 0
      while (rounds < MAX_TOOL_ROUNDS) {
        const steps: any[] = Array.isArray(interaction.steps) ? interaction.steps : []
        const functionCalls = steps.filter((step) => step.type === 'function_call')
        if (functionCalls.length === 0) break

        const results = runToolBatch(
          functionCalls.map((call) => ({ name: String(call.name), args: call.arguments ?? {} })),
          p
        )
        const toolResults = functionCalls.map((call, i) => ({
          type: 'function_result' as const,
          call_id: call.id,
          name: call.name,
          result: results[i],
        }))

        interaction = await create({
          model: modelToUse,
          previous_interaction_id: interaction.id,
          input: toolResults,
          system_instruction: buildWorldAwareSystemPrompt(agent, world, ceoName, group),
          tools: AGENCY_TOOLS,
        })
        rounds++
      }

      if (!group) {
        const pendingCalls = (Array.isArray(interaction.steps) ? interaction.steps : []).some(
          (step: any) => step.type === 'function_call'
        )
        agent.lastInteractionId = pendingCalls ? undefined : interaction.id
      }

      return { replyText: fallbackReply(p, String(interaction.output_text || '').trim()) }
    } catch (err: any) {
      lastErr = err
      if (!group) agent.lastInteractionId = undefined
      if (p.actions.length > 0) throw err
      // Só tenta o próximo modelo em erros de cota, modelo inexistente ou sobrecarga
      if (!/429|503|404|rate limit|quota|not found|unavailable/i.test(String(err?.message || ''))) throw err
    }
  }
  throw lastErr || new Error('Nenhum modelo Gemini disponível.')
}

export async function runAgentConversationTurn(params: {
  agent: AgentEmployee
  world: SharedWorldState
  userMessage: string
  ceoName: string
  apiKey?: string
  providerCredentials?: Record<ExternalAiProviderId, ProviderCredential>
  rootDir: string
  forceSelfBuild?: boolean
  attachments?: ChatAttachment[]
  group?: GroupConversationContext
  onProgress?: () => void
}): Promise<{ replyText: string; actions: string[]; usedLiveGemini: boolean; providerUsed?: string }> {
  const {
    agent,
    world,
    userMessage,
    ceoName,
    apiKey,
    providerCredentials,
    rootDir,
    forceSelfBuild = false,
    attachments = [],
    group,
    onProgress,
  } = params

  const creds: Record<ExternalAiProviderId, ProviderCredential> = providerCredentials ?? {
    antigravity: { apiKey: apiKey || '', model: GEMINI_MODEL, baseUrl: 'https://generativelanguage.googleapis.com' },
    opencode: { apiKey: '', model: 'claude-sonnet-4-5', baseUrl: 'https://opencode.ai/zen/v1' },
    openai: { apiKey: '', model: 'gpt-4.1', baseUrl: 'https://api.openai.com/v1' },
    claude: { apiKey: '', model: 'claude-sonnet-4-5', baseUrl: 'https://api.anthropic.com/v1' },
  }

  const preferred = agentProviderToExternal(agent.provider)
  const fallbackOrder: ExternalAiProviderId[] = [
    preferred,
    ...(['antigravity', 'openai', 'claude', 'opencode'] as ExternalAiProviderId[]).filter((p) => p !== preferred),
  ]
  const availableProviders = fallbackOrder.filter((p) => Boolean(creds[p]?.apiKey))

  if (availableProviders.length === 0) {
    const offline = runOfflineSimulationTurn(agent, world, userMessage, ceoName, rootDir, forceSelfBuild)
    return {
      ...offline,
      replyText: `${offline.replyText}\n\n(Nenhuma conta de IA conectada ainda. Abra Governança Local no menu e cole uma chave de Antigravity, OpenCode, OpenAI ou Claude!)`,
      providerUsed: 'Modo Local',
    }
  }

  const prepared = prepareAttachments(rootDir, attachments)
  const basePrompt = forceSelfBuild
    ? `O(a) CEO ${ceoName} ativou seu modo de auto-criação! Escolha e construa agora (usando build_world_prop, edit_project_code e opcionalmente customize_studio_theme ou consult_colleague) 1 ou 2 melhorias reais para deixar a Sede da Blequi ou a Ilha Blequi ainda mais bonita, leve e aconchegante. Depois conte para ${ceoName} o que você criou e como se sente.`
    : group
      ? `[${ceoName}]: ${userMessage}`
      : userMessage
  const promptText = `${basePrompt}${prepared.note}`
  const context = group ? normalizeContext(group.transcript) : buildRecentChatContext(agent)

  const actions: string[] = []
  const errors: string[] = []

  for (const provId of availableProviders) {
    const cred = creds[provId]
    const label = PROVIDER_DISPLAY_NAME[provId]
    const base: ProviderTurnParams = {
      cred,
      agent,
      world,
      ceoName,
      promptText,
      images: prepared.images,
      context,
      group,
      rootDir,
      actions,
      onProgress,
    }
    const runOnce = (images: PreparedImage[]) => {
      const p = { ...base, images }
      if (provId === 'antigravity') return runAntigravityGeminiTurn(p)
      if (provId === 'claude') return runAnthropicTurn(p)
      return runOpenAiCompatibleTurn({ ...p, providerLabel: label })
    }

    try {
      let res: { replyText: string }
      try {
        res = await runOnce(prepared.images)
      } catch (err) {
        // Alguns modelos não aceitam imagem: tenta de novo só com o texto antes de trocar de provedor
        if (prepared.images.length === 0 || actions.length > 0) throw err
        res = await runOnce([])
      }
      return { replyText: res.replyText, actions, usedLiveGemini: true, providerUsed: label }
    } catch (err: any) {
      if (provId === 'antigravity' && agent.lastInteractionId) {
        agent.lastInteractionId = undefined
      }
      const errMsg = err?.message ? String(err.message) : 'Erro desconhecido'
      console.warn(`[blequi] ${label} falhou para ${agent.name}: ${errMsg}`)
      errors.push(`${label}: ${errMsg.slice(0, 120)}`)

      // If tools already ran successfully before the error, return what was accomplished instead of duplicating
      if (actions.length > 0) {
        return {
          replyText: `Prontinho, ${ceoName}! Consegui executar: ${actions.join(', ')}. (Nota: ${label} encerrou o turno antes da resposta final: ${errMsg.slice(0, 100)})`,
          actions,
          usedLiveGemini: true,
          providerUsed: label,
        }
      }
    }
  }

  return {
    replyText: `Não consegui conectar com as contas de IA configuradas agora (${errors.join(' | ')}). Verifique a chave e o modelo no painel Governança Local e tente novamente.`,
    actions,
    usedLiveGemini: false,
    providerUsed: 'Erro de conexão',
  }
}
