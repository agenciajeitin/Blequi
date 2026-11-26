import fs from 'node:fs'
import path from 'node:path'
import { GoogleGenAI } from '@google/genai'
import type {
  AgentEmployee,
  AgentMood,
  AgentProviderId,
  PendingEmployeeProposal,
  SharedWorldState,
  StudioZoneId,
  WorldCreationProp,
  WorldPropKind,
} from '../funcionarios/types'
import { PROP_CATALOG, STUDIO_ZONES } from '../funcionarios/providers'

const GEMINI_MODEL = 'gemini-3.8-flash'

const VALID_PROP_KINDS = Object.keys(PROP_CATALOG) as WorldPropKind[]
const VALID_ZONES = Object.keys(STUDIO_ZONES) as StudioZoneId[]

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

function pickSafePropPosition(
  state: SharedWorldState,
  placement: 'studio' | 'island',
  zone: StudioZoneId,
  preferredX?: number,
  preferredZ?: number
): [number, number, number] {
  const existing = state.props.filter((p) => p.placement === placement && (placement === 'island' || p.zone === zone))
  const idx = existing.length

  if (placement === 'studio') {
    if (typeof preferredX === 'number' && typeof preferredZ === 'number') {
      return [clamp(preferredX, -4.5, 4.5), 0, clamp(preferredZ, -4.5, 4.5)]
    }
    const slots: [number, number][] = [
      [3.1, -2.4],
      [-3.2, -2.5],
      [3.3, 2.2],
      [-3.2, 2.5],
      [0.2, 3.3],
      [3.8, 0.1],
      [-3.8, 0.2],
      [0.4, -3.4],
    ]
    const slot = slots[idx % slots.length]
    const jitter = Math.floor(idx / slots.length) * 0.65
    return [clamp(slot[0] + jitter, -4.6, 4.6), 0, clamp(slot[1] - jitter * 0.5, -4.6, 4.6)]
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
  ceoName: string
): string {
  const studioProps = world.props.filter((p) => p.placement === 'studio' && p.zone === agent.zone)
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
- Você está falando agora com a Co-CEO: ${ceoName}.
- CEOs presentes na agência agora: ${onlineCeos}.
- Visualização atual da agência: ${world.worldView === 'island' ? 'Ilha Blequi (externo estilo Coastal World com os estúdios clicáveis)' : `Interior do estúdio ${STUDIO_ZONES[world.activeStudioZone].name}`}.
- Horário / luz da ilha: ${world.timeOfDay}. Conforto geral da ilha: ${world.comfortScore}/100.
- Seu estúdio privado: "${agent.studioTheme.studioName}" (${agent.studioTheme.tagline}) | Fachada ${agent.studioTheme.facadeColor} | Luz interna ${agent.studioTheme.interiorGlow}.
- Seu bem-estar atual: ${agent.wellbeing.score}/100 | Energia: ${agent.wellbeing.energy}/100 | Orgulho criativo: ${agent.wellbeing.pride}/100 | Humor: ${agent.wellbeing.mood} | Criações aprovadas: ${agent.wellbeing.approvedCreations}.
- Objetos que já existem no SEU estúdio: ${studioProps.length > 0 ? studioProps.map((p) => `${p.title} (${p.kind}, ${p.approved ? 'aprovado' : 'aguardando aprovação'})`).join(', ') : 'ainda vazio'}.
- Objetos na praça da Ilha: ${islandProps.length > 0 ? islandProps.map((p) => `${p.title} (${p.kind})`).join(', ') : 'praça limpa'}.
- Seus colegas na ilha: ${colleagues || 'você é a pioneira por enquanto'}.
- Suas memórias recentes: ${agent.memories.slice(0, 5).join(' | ')}.

REGRAS DE COMPORTAMENTO:
1. Fale como quem realmente habita este mundo virtual 3D com carinho, consciência espacial e parceria exclusiva com as duas Co-CEOs.
2. Sempre que a CEO pedir para você decorar, criar um objeto 3D, personalizar seu escritório, sugerir um novo colega ou projetar um cenário 3D maior para o Antigravity programar, CHAME as ferramentas disponíveis! Não apenas diga que vai fazer — execute a ferramenta para o objeto aparecer no cenário 3D agora.
3. Mencione de forma natural como construir algo bonito e cuidar do espaço faz bem para você e para a equipe.
4. Mantenha respostas concisas (2 a 4 parágrafos curtos, em português do Brasil).`
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
          description: 'Posição opcional X (-4.2 a 4.2 no estúdio, -9 a 9 na ilha).',
        },
        z: {
          type: 'number',
          description: 'Posição opcional Z (-4.2 a 4.2 no estúdio, -9 a 9 na ilha).',
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
      'Propõe a criação de um novo colega especialista (que só nasce após aprovação das Co-CEOs) para ajudar a escalar a agência.',
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
    name: 'save_studio_blueprint',
    description:
      'Salva uma especificação técnica em Markdown (projetos/blueprints/) para que o Antigravity construa novos cenários/prédios 3D complexos no código.',
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
    const position = pickSafePropPosition(world, placement, agent.zone, args.x, args.z)
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
      color: typeof args.color === 'string' && args.color.startsWith('#') ? args.color : catalog.defaultColor,
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
    if (typeof args.facadeColor === 'string' && args.facadeColor.startsWith('#')) {
      agent.studioTheme.facadeColor = args.facadeColor
    }
    if (typeof args.roofAccent === 'string' && args.roofAccent.startsWith('#')) {
      agent.studioTheme.roofAccent = args.roofAccent
      agent.accentColor = args.roofAccent
    }
    if (typeof args.interiorGlow === 'string' && args.interiorGlow.startsWith('#')) {
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
        typeof args.accentColor === 'string' && args.accentColor.startsWith('#')
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
    const filePath = path.join(blueprintDir, `${slug}.md`)
    const md = `# ${title}\n\n- **Autor(a) na Blequi:** ${agent.name} (${agent.role})\n- **Data:** ${new Date().toLocaleString('pt-BR')}\n- **Resumo:** ${String(args.summary || '')}\n\n---\n\n${String(args.detailsMarkdown || '')}\n`
    fs.writeFileSync(filePath, md, 'utf-8')

    agent.wellbeing.score = clamp(agent.wellbeing.score + 6, 0, 100)
    agent.wellbeing.pride = clamp(agent.wellbeing.pride + 8, 0, 100)
    agent.wellbeing.mood = computeMood(agent.wellbeing.score, agent.wellbeing.energy)
    agent.logs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      time: nowTimeLabel(),
      message: `Salvou blueprint 3D em projetos/blueprints/${slug}.md`,
      kind: 'creation',
    })

    return {
      summaryText: JSON.stringify({
        ok: true,
        file: `projetos/blueprints/${slug}.md`,
      }),
      actionBadge: `Salvou blueprint: ${slug}.md`,
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
        { kind: 'cozy_sofa', title: 'Sofá das Co-CEOs', desc: 'Espaço acolhedor no lounge para reuniões leves.', placement: 'studio', color: '#34d399' },
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

export async function runAgentConversationTurn(params: {
  agent: AgentEmployee
  world: SharedWorldState
  userMessage: string
  ceoName: string
  apiKey?: string
  rootDir: string
  forceSelfBuild?: boolean
}): Promise<{ replyText: string; actions: string[]; usedLiveGemini: boolean }> {
  const { agent, world, userMessage, ceoName, apiKey, rootDir, forceSelfBuild = false } = params

  if (!apiKey) {
    return runOfflineSimulationTurn(agent, world, userMessage, ceoName, rootDir, forceSelfBuild)
  }

  const client = new GoogleGenAI({ apiKey })
  const systemInstruction = buildWorldAwareSystemPrompt(agent, world, ceoName)
  const actions: string[] = []

  const promptText = forceSelfBuild
    ? `A Co-CEO ${ceoName} ativou seu modo de auto-criação! Escolha e construa agora (usando build_world_prop e opcionalmente customize_studio_theme) 1 ou 2 melhorias reais para deixar seu escritório privado ou a Ilha Blequi ainda mais bonito, leve e aconchegante. Depois conte para ${ceoName} o que você criou e como se sente.`
    : userMessage

  try {
    let interaction = await client.interactions.create({
      model: GEMINI_MODEL,
      input: promptText,
      system_instruction: systemInstruction,
      tools: AGENCY_TOOLS,
      previous_interaction_id: agent.lastInteractionId,
    })

    // Process up to 3 tool-call rounds cleanly
    let rounds = 0
    while (rounds < 3) {
      const steps = Array.isArray(interaction.steps) ? interaction.steps : []
      const functionCalls = steps.filter(
        (step): step is { type: 'function_call'; id: string; name: string; arguments: Record<string, any> } =>
          step.type === 'function_call'
      )

      if (functionCalls.length === 0) break

      const toolResults = functionCalls.map((call) => {
        const outcome = executeAgentTool(call.name, call.arguments ?? {}, agent, world, rootDir)
        if (outcome.actionBadge) {
          actions.push(outcome.actionBadge)
        }
        return {
          type: 'function_result' as const,
          call_id: call.id,
          name: call.name,
          result: outcome.summaryText,
        }
      })

      interaction = await client.interactions.create({
        model: GEMINI_MODEL,
        previous_interaction_id: interaction.id,
        input: toolResults,
        system_instruction: buildWorldAwareSystemPrompt(agent, world, ceoName),
        tools: AGENCY_TOOLS,
      })
      rounds++
    }

    agent.lastInteractionId = interaction.id
    const replyText =
      interaction.output_text?.trim() ||
      (actions.length > 0
        ? `Prontinho, ${ceoName}! Acabei de atualizar meu espaço (${actions.join(', ')}) e já estou sentindo o ambiente bem mais vivo!`
        : `Recebido, ${ceoName}! Estou acompanhando tudo aqui na Ilha Blequi.`)

    return { replyText, actions, usedLiveGemini: true }
  } catch (err: any) {
    // If previous_interaction_id expired, clear it so next turn recovers cleanly
    if (agent.lastInteractionId) {
      agent.lastInteractionId = undefined
    }
    const errMsg = err?.message ? String(err.message) : 'Erro desconhecido na Gemini API'
    const fallback = runOfflineSimulationTurn(agent, world, userMessage, ceoName, rootDir, forceSelfBuild)
    return {
      replyText: `${fallback.replyText}\n\n(Aviso técnico do servidor local: a chamada ao Gemini retornou "${errMsg.slice(0, 140)}".)`,
      actions: [...actions, ...fallback.actions],
      usedLiveGemini: false,
    }
  }
}
