import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, ViteDevServer } from 'vite'
import { createInitialWorldState } from '../funcionarios/roster'
import { AGENT_PROVIDERS, ROOM_SCALES, STUDIO_ZONES } from '../funcionarios/providers'
import {
  EXTERNAL_AI_PROVIDERS,
  EXTERNAL_AI_PROVIDER_MAP,
  type ExternalAiProviderId,
  type ExternalAiProviderStatus,
} from '../funcionarios/aiProvidersCatalog'
import type {
  AgentChatMessage,
  AgentEmployee,
  AgentProviderId,
  AgentStatus,
  CeoSlot,
  ChatAttachment,
  ChatGroup,
  RoomScaleId,
  SharedWorldState,
  StudioZoneId,
  WorldTimeOfDay,
  WorldViewMode,
} from '../funcionarios/types'
import {
  SEDE_ZONE,
  agentProviderToExternal,
  computeSedeDeskLayout,
  externalToAgentProvider,
  recommendedSedeScale,
  resolveCeoSlotFromName,
} from '../funcionarios/sede'
import { computeMood, recalcComfortScore, runAgentConversationTurn } from './geminiAgency'

function readDotEnv(rootDir: string): Record<string, string> {
  const envPath = path.join(rootDir, '.env')
  const out: Record<string, string> = {}
  if (!fs.existsSync(envPath)) return out
  const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    out[key] = val
  }
  return out
}

function getLocalSecretsPath(rootDir: string) {
  return path.join(rootDir, 'estado-mundo', 'ai-keys.local.json')
}

function readLocalSecrets(rootDir: string): Record<string, string> {
  const filePath = getLocalSecretsPath(rootDir)
  if (!fs.existsSync(filePath)) return {}
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, unknown>
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string') out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

/**
 * Grava chaves em estado-mundo/ai-keys.local.json (ignorado pelo Vite watch e pelo .gitignore)
 * para nunca reiniciar o servidor Vite nem recarregar a página ao trocar de IA!
 */
function writeLocalSecretKey(rootDir: string, key: string, value: string) {
  const filePath = getLocalSecretsPath(rootDir)
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const current = readLocalSecrets(rootDir)
  current[key] = value
  fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf-8')
}

export interface ProviderCredential {
  apiKey: string
  model: string
  baseUrl: string
}

function getRuntimeConfig(rootDir: string) {
  const dot = readDotEnv(rootDir)
  const local = readLocalSecrets(rootDir)
  const getVal = (key: string) => (local[key] || dot[key] || process.env[key] || '').trim()

  const geminiApiKey = getVal('GEMINI_API_KEY')
  const ceoCode = getVal('BLEQUI_CEO_CODE') || 'blequi-ceo'

  const providerCredentials = {} as Record<ExternalAiProviderId, ProviderCredential>
  const aiProviders: ExternalAiProviderStatus[] = EXTERNAL_AI_PROVIDERS.map((p) => {
    const keyVal = getVal(p.envApiKey)
    const modelVal = getVal(p.envModelKey) || p.defaultModel
    const baseUrlVal = (p.envBaseUrlKey ? getVal(p.envBaseUrlKey) : '') || p.defaultBaseUrl
    providerCredentials[p.id] = {
      apiKey: keyVal,
      model: modelVal,
      baseUrl: baseUrlVal,
    }
    return {
      id: p.id,
      configured: p.requiresApiKey ? Boolean(keyVal) : Boolean(baseUrlVal),
      model: modelVal,
      baseUrl: baseUrlVal,
    }
  })
  const anyAiConfigured = aiProviders.some((p) => p.configured)
  return { geminiApiKey, ceoCode, aiProviders, providerCredentials, anyAiConfigured }
}

function resolveCeoIdentity(rawLogin: string): { slot: 'ceo-1' | 'ceo-2'; name: string; role: string } | null {
  const normalized = rawLogin
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (normalized === 'raynocas' || normalized === 'ray') {
    return { slot: 'ceo-1', name: 'Raynocas', role: 'CEO · Ambientação & Estética' }
  }
  if (normalized === 'kafuzinho' || normalized === 'kafu' || normalized === 'kafuzin') {
    return { slot: 'ceo-2', name: 'Kafuzinho', role: 'CEO · Edifícios & Animações' }
  }
  return null
}

function getLocalNetworkUrls(port: number): string[] {
  const nets = os.networkInterfaces()
  const urls: string[] = []
  for (const entries of Object.values(nets)) {
    if (!entries) continue
    for (const net of entries) {
      if (net.family === 'IPv4' && !net.internal) {
        urls.push(`http://${net.address}:${port}`)
      }
    }
  }
  return urls
}

function nowTimeLabel() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, any>> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf-8').trim()
  if (!raw) return {}
  return JSON.parse(raw) as Record<string, any>
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

/**
 * Escrita atômica: grava num arquivo temporário e renomeia por cima.
 * Evita que um crash/queda de energia (ou o OneDrive travando o arquivo) deixe o JSON pela metade.
 */
function writeStateFileAtomic(stateFilePath: string, state: SharedWorldState) {
  fs.mkdirSync(path.dirname(stateFilePath), { recursive: true })
  const tmpPath = `${stateFilePath}.tmp`
  fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), 'utf-8')
  try {
    fs.renameSync(tmpPath, stateFilePath)
  } catch {
    // Windows/OneDrive pode bloquear o rename momentaneamente: cai para escrita direta
    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf-8')
    try {
      fs.unlinkSync(tmpPath)
    } catch {
      /* ignore */
    }
  }
}

/**
 * Toda a equipe trabalha na Sede da Blequi: garante que cada agente esteja lá,
 * que a sala seja grande o bastante e que cada um tenha sua própria mesa.
 */
function relayoutSede(state: SharedWorldState) {
  state.roomScale = recommendedSedeScale(state.agents.length, state.roomScale)
  const slots = computeSedeDeskLayout(state.agents.length, state.roomScale)
  state.agents.forEach((agent, i) => {
    agent.zone = SEDE_ZONE
    agent.deskPosition = slots[i].position
    agent.deskRotationY = slots[i].rotationY
  })
}

/** Garante campos obrigatórios em estados salvos por versões antigas do app */
function normalizeState(parsed: SharedWorldState): SharedWorldState {
  const initial = createInitialWorldState()
  const state: SharedWorldState = {
    ...initial,
    ...parsed,
    agents: Array.isArray(parsed.agents) ? parsed.agents : initial.agents,
    props: Array.isArray(parsed.props) ? parsed.props : initial.props,
    proposals: Array.isArray(parsed.proposals) ? parsed.proposals : [],
    onlineCeos: Array.isArray(parsed.onlineCeos) ? parsed.onlineCeos : [],
    groups: Array.isArray(parsed.groups) ? parsed.groups : [],
    activeStudioZone: parsed.activeStudioZone in STUDIO_ZONES ? parsed.activeStudioZone : initial.activeStudioZone,
    roomScale: parsed.roomScale in ROOM_SCALES ? parsed.roomScale : initial.roomScale,
  }
  // Objetos internos de estúdios antigos acompanham seus autores para a Sede
  for (const prop of state.props) {
    if (prop.placement === 'studio') prop.zone = SEDE_ZONE
  }
  relayoutSede(state)
  return state
}

function loadOrCreateState(stateFilePath: string): SharedWorldState {
  if (fs.existsSync(stateFilePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(stateFilePath, 'utf-8')) as SharedWorldState
      if (parsed && Array.isArray(parsed.agents)) {
        return normalizeState(parsed)
      }
    } catch {
      // segue para o backup abaixo
    }
    // Nunca apaga o progresso: guarda uma cópia do arquivo corrompido antes de recriar
    const backupPath = stateFilePath.replace(/\.json$/, `.corrompido-${Date.now()}.json`)
    try {
      fs.copyFileSync(stateFilePath, backupPath)
      console.warn(`[blequi] agency-state.json inválido; backup salvo em ${backupPath}`)
    } catch {
      /* ignore */
    }
  }
  const initial = createInitialWorldState()
  relayoutSede(initial)
  writeStateFileAtomic(stateFilePath, initial)
  return initial
}

function sanitizeEnvValue(value: string) {
  return value.replace(/[\r\n]/g, '').trim()
}

const VALID_AGENT_STATUSES: AgentStatus[] = ['working', 'thinking', 'reviewing', 'idle', 'vacant']

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024
const MAX_ATTACHMENTS_PER_MESSAGE = 6

function getUploadsDir(rootDir: string) {
  return path.join(rootDir, 'estado-mundo', 'uploads')
}

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
}

/** Valida anexos vindos do cliente: só aceita arquivos que realmente existem em estado-mundo/uploads */
function sanitizeAttachments(rootDir: string, raw: unknown): ChatAttachment[] {
  if (!Array.isArray(raw)) return []
  const dir = getUploadsDir(rootDir)
  const out: ChatAttachment[] = []
  for (const item of raw.slice(0, MAX_ATTACHMENTS_PER_MESSAGE)) {
    if (!item || typeof item !== 'object') continue
    const id = String((item as any).id || '')
    if (!/^[a-z0-9-]+\.[a-z0-9]{1,8}$|^[a-z0-9-]+$/i.test(id)) continue
    const filePath = path.join(dir, id)
    if (!fs.existsSync(filePath)) continue
    const mimeType = String((item as any).mimeType || 'application/octet-stream').slice(0, 100)
    out.push({
      id,
      kind: mimeType.startsWith('image/') ? 'image' : 'file',
      name: String((item as any).name || id).slice(0, 120),
      mimeType,
      size: fs.statSync(filePath).size,
      url: `/api/agency/uploads/${id}`,
    })
  }
  return out
}

function resolveCeoSlot(body: Record<string, any>, ceoName: string): CeoSlot | undefined {
  if (body.ceoSlot === 'ceo-1' || body.ceoSlot === 'ceo-2') return body.ceoSlot
  return resolveCeoSlotFromName(ceoName)
}

/** "@Vex", "Vex," ou "vex " contam como menção; "Vexado" não */
function mentionsName(lowerText: string, name: string): boolean {
  const target = name.toLowerCase()
  let from = 0
  while (true) {
    const idx = lowerText.indexOf(target, from)
    if (idx === -1) return false
    const before = idx === 0 ? '' : lowerText[idx - 1]
    const after = lowerText[idx + target.length] ?? ''
    const isLetter = (ch: string) => /\p{L}/u.test(ch)
    if ((!before || !isLetter(before)) && (!after || !isLetter(after))) return true
    from = idx + 1
  }
}

const GROUP_COLORS = ['#02c6a7', '#6366f1', '#f97316', '#0ea5e9', '#de6c80', '#eab308', '#10b981']

export function blequiAgencyServerPlugin(): Plugin {
  return {
    name: 'blequi-local-agency-server',
    configureServer(server: ViteDevServer) {
      const rootDir = server.config.root
      const stateFilePath = path.join(rootDir, 'estado-mundo', 'agency-state.json')
      let worldState: SharedWorldState = loadOrCreateState(stateFilePath)
      const sseClients = new Set<ServerResponse>()

      const persistAndBroadcast = () => {
        worldState.version = (worldState.version || 0) + 1
        worldState.updatedAt = new Date().toISOString()
        worldState.comfortScore = recalcComfortScore(worldState)
        writeStateFileAtomic(stateFilePath, worldState)
        broadcast(`event: state\ndata: ${JSON.stringify(worldState)}\n\n`)
      }

      const broadcast = (payload: string) => {
        for (const client of sseClients) {
          if (client.destroyed || client.writableEnded) {
            sseClients.delete(client)
            continue
          }
          try {
            client.write(payload)
          } catch {
            sseClients.delete(client)
          }
        }
      }

      const verifyCeoAccess = (req: IncomingMessage, url: URL): boolean => {
        const { ceoCode } = getRuntimeConfig(rootDir)
        const headerCode = String(req.headers['x-blequi-ceo-code'] || '').trim()
        const queryCode = String(url.searchParams.get('code') || '').trim()
        return headerCode === ceoCode || queryCode === ceoCode
      }

      // Prune stale CEO presence older than 90s
      const prunePresence = () => {
        const cutoff = Date.now() - 90_000
        worldState.onlineCeos = worldState.onlineCeos.filter(
          (c) => new Date(c.lastSeenAt).getTime() > cutoff
        )
      }

      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/agency')) {
          return next()
        }

        const url = new URL(req.url, 'http://localhost:5173')
        const pathname = url.pathname
        const method = (req.method || 'GET').toUpperCase()

        try {
          // Public metadata for entry screen (never leaks secrets)
          if (pathname === '/api/agency/meta' && method === 'GET') {
            prunePresence()
            const { ceoCode, aiProviders, anyAiConfigured } = getRuntimeConfig(rootDir)
            const port = server.config.server.port || 5173
            const agyStatus = aiProviders.find((p) => p.id === 'antigravity')
            return sendJson(res, 200, {
              geminiConfigured: anyAiConfigured,
              geminiModel: agyStatus?.model || 'gemini-3.8-flash',
              usingDefaultCeoCode: ceoCode === 'blequi-ceo',
              networkUrls: getLocalNetworkUrls(port),
              onlineCeos: worldState.onlineCeos,
              agentCount: worldState.agents.length,
              propCount: worldState.props.length,
              aiProviders,
            })
          }

          // CEO Login & Presence registration (exclusively Raynocas & Kafuzinho)
          if (pathname === '/api/agency/auth' && method === 'POST') {
            const body = await readJsonBody(req)
            const { ceoCode } = getRuntimeConfig(rootDir)
            const provided = String(body.ceoCode || '').trim()
            if (provided !== ceoCode) {
              return sendJson(res, 401, {
                ok: false,
                error: 'Senha incorreta. Acesso exclusivo dos CEOs Raynocas e Kafuzinho.',
              })
            }

            const identity = resolveCeoIdentity(String(body.name || ''))
            if (!identity) {
              return sendJson(res, 401, {
                ok: false,
                error: 'Login não reconhecido. Apenas os CEOs Raynocas e Kafuzinho podem entrar.',
              })
            }

            prunePresence()
            const presenceId = `ceo-${identity.slot}`

            worldState.onlineCeos = worldState.onlineCeos.filter(
              (c) => c.ceoSlot !== identity.slot && c.id !== presenceId
            )
            worldState.onlineCeos.push({
              id: presenceId,
              name: identity.name,
              role: identity.role,
              ceoSlot: identity.slot,
              activeView: worldState.worldView,
              activeZone: worldState.activeStudioZone,
              lastSeenAt: new Date().toISOString(),
            })
            persistAndBroadcast()
            return sendJson(res, 200, {
              ok: true,
              ceo: identity,
              state: worldState,
            })
          }

          // All remaining routes require CEO pass
          if (!verifyCeoAccess(req, url)) {
            return sendJson(res, 401, { ok: false, error: 'Acesso exclusivo dos CEOs.' })
          }

          if (pathname === '/api/agency/state' && method === 'GET') {
            prunePresence()
            return sendJson(res, 200, { ok: true, state: worldState })
          }

          if (pathname === '/api/agency/events' && method === 'GET') {
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/event-stream')
            res.setHeader('Cache-Control', 'no-cache')
            res.setHeader('Connection', 'keep-alive')
            res.flushHeaders?.()

            sseClients.add(res)
            res.write(`event: state\ndata: ${JSON.stringify(worldState)}\n\n`)

            const keepAlive = setInterval(() => {
              try {
                res.write(': ping\n\n')
              } catch {
                clearInterval(keepAlive)
                sseClients.delete(res)
              }
            }, 25_000)

            req.on('close', () => {
              clearInterval(keepAlive)
              sseClients.delete(res)
            })
            return
          }

          if (pathname === '/api/agency/ceo-move' && method === 'POST') {
            const body = await readJsonBody(req)
            const slot: 'ceo-1' | 'ceo-2' = body.ceoSlot === 'ceo-2' ? 'ceo-2' : 'ceo-1'
            let entry = worldState.onlineCeos.find((c) => c.ceoSlot === slot)
            if (!entry) {
              entry = {
                id: String(body.id || `ceo-${slot}`),
                name: String(body.name || (slot === 'ceo-1' ? 'Raynocas' : 'Kafuzinho')),
                role: String(body.role || 'CEO'),
                ceoSlot: slot,
                activeView: body.activeView === 'studio' ? 'studio' : 'island',
                activeZone: (body.activeZone as StudioZoneId) || null,
                lastSeenAt: new Date().toISOString(),
              }
              worldState.onlineCeos.push(entry)
            }
            if (Array.isArray(body.position) && body.position.length === 3) {
              entry.position = [Number(body.position[0]) || 0, Number(body.position[1]) || 0, Number(body.position[2]) || 0]
            }
            if (typeof body.rotationY === 'number') entry.rotationY = body.rotationY
            if (typeof body.isMoving === 'boolean') entry.isMoving = body.isMoving
            if (body.avatar && typeof body.avatar === 'object') entry.avatar = body.avatar
            if (body.activeView === 'studio' || body.activeView === 'island') entry.activeView = body.activeView
            if (body.activeZone && body.activeZone in STUDIO_ZONES) entry.activeZone = body.activeZone as StudioZoneId
            if (body.name) entry.name = String(body.name)
            entry.lastSeenAt = new Date().toISOString()

            // Ultra-fast in-memory SSE broadcast (zero disk I/O lag for smooth 2-Co-CEO walking!)
            broadcast(`event: ceo-move\ndata: ${JSON.stringify(worldState.onlineCeos)}\n\n`)
            return sendJson(res, 200, { ok: true })
          }

          if (pathname === '/api/agency/presence' && method === 'POST') {
            const body = await readJsonBody(req)
            prunePresence()
            const slot: 'ceo-1' | 'ceo-2' = body.ceoSlot === 'ceo-2' ? 'ceo-2' : 'ceo-1'
            const existing = worldState.onlineCeos.find((c) => c.ceoSlot === slot)
            const pos =
              Array.isArray(body.position) && body.position.length === 3
                ? ([Number(body.position[0]) || 0, Number(body.position[1]) || 0, Number(body.position[2]) || 0] as [
                    number,
                    number,
                    number,
                  ])
                : undefined
            const rotY = typeof body.rotationY === 'number' ? body.rotationY : undefined
            const isMoving = typeof body.isMoving === 'boolean' ? body.isMoving : undefined
            const avatar = body.avatar && typeof body.avatar === 'object' ? body.avatar : undefined

            if (existing) {
              existing.activeView = (body.activeView as WorldViewMode) || existing.activeView
              existing.activeZone = (body.activeZone as StudioZoneId) || existing.activeZone
              if (pos) existing.position = pos
              if (rotY !== undefined) existing.rotationY = rotY
              if (isMoving !== undefined) existing.isMoving = isMoving
              if (avatar) existing.avatar = avatar
              existing.lastSeenAt = new Date().toISOString()
              if (body.name) existing.name = String(body.name)
            } else if (body.name) {
              worldState.onlineCeos.push({
                id: String(body.id || `ceo-${slot}`),
                name: String(body.name),
                role: String(body.role || 'CEO'),
                ceoSlot: slot,
                activeView: (body.activeView as WorldViewMode) || 'island',
                activeZone: (body.activeZone as StudioZoneId) || null,
                position: pos,
                rotationY: rotY,
                isMoving,
                avatar,
                lastSeenAt: new Date().toISOString(),
              })
            }

            // Broadcast lightweight live Co-CEO movement frame without disk I/O
            broadcast(`event: ceo-move\ndata: ${JSON.stringify(worldState.onlineCeos)}\n\n`)
            return sendJson(res, 200, { ok: true, onlineCeos: worldState.onlineCeos })
          }

          if (pathname === '/api/agency/config-key' && method === 'POST') {
            const body = await readJsonBody(req)
            if (typeof body.geminiApiKey === 'string' && sanitizeEnvValue(body.geminiApiKey)) {
              writeLocalSecretKey(rootDir, 'GEMINI_API_KEY', sanitizeEnvValue(body.geminiApiKey))
            }
            if (typeof body.providerId === 'string' && body.providerId in EXTERNAL_AI_PROVIDER_MAP) {
              const meta = EXTERNAL_AI_PROVIDER_MAP[body.providerId as ExternalAiProviderId]
              if (typeof body.apiKey === 'string' && sanitizeEnvValue(body.apiKey)) {
                writeLocalSecretKey(rootDir, meta.envApiKey, sanitizeEnvValue(body.apiKey))
              }
              if (typeof body.model === 'string' && sanitizeEnvValue(body.model)) {
                writeLocalSecretKey(rootDir, meta.envModelKey, sanitizeEnvValue(body.model))
              }
              if (
                meta.envBaseUrlKey &&
                typeof body.baseUrl === 'string' &&
                sanitizeEnvValue(body.baseUrl)
              ) {
                writeLocalSecretKey(rootDir, meta.envBaseUrlKey, sanitizeEnvValue(body.baseUrl))
              }
            }
            if (typeof body.newCeoCode === 'string' && sanitizeEnvValue(body.newCeoCode).length >= 4) {
              writeLocalSecretKey(rootDir, 'BLEQUI_CEO_CODE', sanitizeEnvValue(body.newCeoCode))
            }
            const { anyAiConfigured, aiProviders } = getRuntimeConfig(rootDir)
            return sendJson(res, 200, {
              ok: true,
              geminiConfigured: anyAiConfigured,
              aiProviders,
            })
          }

          if (pathname === '/api/agency/upload' && method === 'POST') {
            const declared = Number(req.headers['content-length'] || 0)
            if (declared > MAX_UPLOAD_BYTES * 1.4 + 4096) {
              return sendJson(res, 413, { ok: false, error: 'Arquivo grande demais (máx. 15 MB).' })
            }
            const body = await readJsonBody(req)
            const rawName = String(body.name || 'arquivo').replace(/[\\/\0]/g, '_').slice(0, 120)
            const mimeType = String(body.mimeType || 'application/octet-stream').slice(0, 100)
            const data = Buffer.from(String(body.dataBase64 || ''), 'base64')
            if (data.length === 0) {
              return sendJson(res, 400, { ok: false, error: 'Arquivo vazio.' })
            }
            if (data.length > MAX_UPLOAD_BYTES) {
              return sendJson(res, 413, { ok: false, error: 'Arquivo grande demais (máx. 15 MB).' })
            }
            const extMatch = /\.([a-z0-9]{1,8})$/i.exec(rawName)
            const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : ''
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
            const dir = getUploadsDir(rootDir)
            fs.mkdirSync(dir, { recursive: true })
            fs.writeFileSync(path.join(dir, id), data)
            const attachment: ChatAttachment = {
              id,
              kind: mimeType.startsWith('image/') ? 'image' : 'file',
              name: rawName,
              mimeType,
              size: data.length,
              url: `/api/agency/uploads/${id}`,
            }
            return sendJson(res, 200, { ok: true, attachment })
          }

          if (pathname.startsWith('/api/agency/uploads/') && method === 'GET') {
            const id = decodeURIComponent(pathname.slice('/api/agency/uploads/'.length))
            if (!/^[a-z0-9-]+(\.[a-z0-9]{1,8})?$/i.test(id)) {
              return sendJson(res, 400, { ok: false, error: 'Arquivo inválido.' })
            }
            const filePath = path.join(getUploadsDir(rootDir), id)
            if (!fs.existsSync(filePath)) {
              return sendJson(res, 404, { ok: false, error: 'Arquivo não encontrado.' })
            }
            const ext = path.extname(id).toLowerCase()
            const mime = MIME_BY_EXT[ext] || 'application/octet-stream'
            const inline = mime.startsWith('image/') || mime.startsWith('application/pdf') || mime.startsWith('text/')
            res.statusCode = 200
            res.setHeader('Content-Type', mime)
            res.setHeader('X-Content-Type-Options', 'nosniff')
            res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'")
            res.setHeader('Cache-Control', 'private, max-age=86400')
            if (!inline || ext === '.svg') {
              res.setHeader('Content-Disposition', `attachment; filename="${id}"`)
            }
            fs.createReadStream(filePath).pipe(res)
            return
          }

          if ((pathname === '/api/agency/chat' || pathname === '/api/agency/self-build') && method === 'POST') {
            const body = await readJsonBody(req)
            const agent = worldState.agents.find((a) => a.id === body.agentId)
            if (!agent) {
              return sendJson(res, 404, { ok: false, error: 'Funcionário não encontrado.' })
            }

            const forceSelfBuild = pathname === '/api/agency/self-build'
            const ceoName = String(body.ceoName || 'CEO').trim()
            const ceoSlot = resolveCeoSlot(body, ceoName)
            const attachments = forceSelfBuild ? [] : sanitizeAttachments(rootDir, body.attachments)
            const userMessage = forceSelfBuild
              ? String(body.prompt || 'Auto-crie melhorias no seu escritório privado agora!')
              : String(body.message || '').trim()

            if (!userMessage && attachments.length === 0) {
              return sendJson(res, 400, { ok: false, error: 'Mensagem vazia.' })
            }

            agent.status = 'thinking'
            agent.chatHistory.push({
              id: `msg-${Date.now()}-u`,
              sender: 'ceo',
              senderName: ceoName,
              senderCeoSlot: ceoSlot,
              text: userMessage,
              time: nowTimeLabel(),
              attachments: attachments.length > 0 ? attachments : undefined,
            })
            agent.chatHistory = agent.chatHistory.slice(-30)
            persistAndBroadcast()

            const { providerCredentials } = getRuntimeConfig(rootDir)
            let turn: Awaited<ReturnType<typeof runAgentConversationTurn>>
            try {
              turn = await runAgentConversationTurn({
                agent,
                world: worldState,
                userMessage: userMessage || '(enviou anexos sem texto)',
                ceoName,
                attachments,
                providerCredentials,
                rootDir,
                forceSelfBuild,
                onProgress: persistAndBroadcast,
              })
            } catch (err: any) {
              // Nunca deixar o funcionário preso em "thinking" se algo explodir no meio do turno
              agent.status = 'working'
              persistAndBroadcast()
              throw err
            }

            agent.status = 'working'
            agent.currentTask =
              turn.actions.length > 0
                ? turn.actions[turn.actions.length - 1]
                : `Em sintonia com ${ceoName} na Ilha Blequi.`
            agent.chatHistory.push({
              id: `msg-${Date.now()}-a`,
              sender: 'agent',
              senderName: agent.name,
              senderAgentId: agent.id,
              text: turn.replyText,
              time: nowTimeLabel(),
              actions: turn.actions.length > 0 ? turn.actions : undefined,
            })
            agent.chatHistory = agent.chatHistory.slice(-30)
            agent.logs.unshift({
              id: `log-${Date.now()}-c`,
              time: nowTimeLabel(),
              message: `${ceoName} conversou com ${agent.name} (${turn.providerUsed || (turn.usedLiveGemini ? 'Antigravity' : 'Modo Local')}).`,
              kind: 'chat',
            })
            agent.logs = agent.logs.slice(0, 25)
            persistAndBroadcast()

            return sendJson(res, 200, {
              ok: true,
              replyText: turn.replyText,
              actions: turn.actions,
              usedLiveGemini: turn.usedLiveGemini,
              state: worldState,
            })
          }

          if (pathname === '/api/agency/groups' && method === 'POST') {
            const body = await readJsonBody(req)
            const action = String(body.action || '')
            const ceoName = String(body.ceoName || 'CEO').trim()
            const validIds = new Set(worldState.agents.map((a) => a.id))
            const cleanMembers = (raw: unknown) =>
              Array.isArray(raw) ? [...new Set(raw.map(String).filter((id) => validIds.has(id)))] : []

            const announceMembership = (group: ChatGroup, memberIds: string[]) => {
              for (const id of memberIds) {
                const ag = worldState.agents.find((a) => a.id === id)
                if (!ag) continue
                ag.memories.unshift(`Agora faço parte da equipe "${group.category}" (grupo ${group.name}).`)
                ag.memories = ag.memories.slice(0, 14)
                ag.logs.unshift({
                  id: `log-team-${Date.now()}-${id}`,
                  time: nowTimeLabel(),
                  message: `Entrou na equipe "${group.category}".`,
                  kind: 'info',
                })
                ag.logs = ag.logs.slice(0, 25)
              }
            }

            if (action === 'create') {
              const name = String(body.name || '').trim().slice(0, 60)
              if (!name) return sendJson(res, 400, { ok: false, error: 'Dê um nome ao grupo.' })
              const members = cleanMembers(body.memberAgentIds)
              const group: ChatGroup = {
                id: `group-${Date.now()}`,
                name,
                category: String(body.category || '').trim().slice(0, 60) || name,
                color: GROUP_COLORS[worldState.groups.length % GROUP_COLORS.length],
                memberAgentIds: members,
                createdBy: ceoName,
                createdAt: nowTimeLabel(),
                messages: [
                  {
                    id: `gmsg-${Date.now()}-sys`,
                    sender: 'system',
                    senderName: 'Blequi',
                    text: `${ceoName} criou o grupo "${name}".`,
                    time: nowTimeLabel(),
                  },
                ],
              }
              worldState.groups.push(group)
              announceMembership(group, members)
              persistAndBroadcast()
              return sendJson(res, 200, { ok: true, groupId: group.id, state: worldState })
            }

            const group = worldState.groups.find((g) => g.id === body.groupId)
            if (!group) return sendJson(res, 404, { ok: false, error: 'Grupo não encontrado.' })

            if (action === 'update') {
              if (typeof body.name === 'string' && body.name.trim()) group.name = body.name.trim().slice(0, 60)
              if (typeof body.category === 'string') group.category = body.category.trim().slice(0, 60) || group.name
              if (Array.isArray(body.memberAgentIds)) {
                const members = cleanMembers(body.memberAgentIds)
                const added = members.filter((id) => !group.memberAgentIds.includes(id))
                group.memberAgentIds = members
                announceMembership(group, added)
              }
              group.messages.push({
                id: `gmsg-${Date.now()}-sys`,
                sender: 'system',
                senderName: 'Blequi',
                text: `${ceoName} atualizou o grupo.`,
                time: nowTimeLabel(),
              })
            } else if (action === 'delete') {
              worldState.groups = worldState.groups.filter((g) => g.id !== group.id)
            } else {
              return sendJson(res, 400, { ok: false, error: 'Ação de grupo inválida.' })
            }
            persistAndBroadcast()
            return sendJson(res, 200, { ok: true, state: worldState })
          }

          if (pathname === '/api/agency/group-message' && method === 'POST') {
            const body = await readJsonBody(req)
            const group = worldState.groups.find((g) => g.id === body.groupId)
            if (!group) return sendJson(res, 404, { ok: false, error: 'Grupo não encontrado.' })

            const ceoName = String(body.ceoName || 'CEO').trim()
            const ceoSlot = resolveCeoSlot(body, ceoName)
            const attachments = sanitizeAttachments(rootDir, body.attachments)
            const text = String(body.message || '').trim()
            if (!text && attachments.length === 0) {
              return sendJson(res, 400, { ok: false, error: 'Mensagem vazia.' })
            }

            group.messages.push({
              id: `gmsg-${Date.now()}-u`,
              sender: 'ceo',
              senderName: ceoName,
              senderCeoSlot: ceoSlot,
              text,
              time: nowTimeLabel(),
              attachments: attachments.length > 0 ? attachments : undefined,
            })
            group.messages = group.messages.slice(-80)

            // Se o CEO citar alguém pelo nome (ex.: "@Vex" ou "Vex, ..."), só quem foi citado responde
            const members = worldState.agents.filter((a) => group.memberAgentIds.includes(a.id) && a.entityType === 'ai')
            const lower = text.toLowerCase()
            const mentioned = members.filter((a) => mentionsName(lower, a.name))
            const responders = mentioned.length > 0 ? mentioned : members
            for (const ag of responders) ag.status = 'thinking'
            persistAndBroadcast()

            // Responde na hora; as respostas dos agentes chegam em paralelo pelo SSE
            sendJson(res, 200, { ok: true, responders: responders.map((a) => a.id), state: worldState })

            const { providerCredentials } = getRuntimeConfig(rootDir)
            const userMessage = text || '(enviou anexos sem texto)'
            await Promise.all(
              responders.map(async (agent) => {
                const transcript = group.messages
                  .slice(-14, -1)
                  .filter((m) => m.sender !== 'system')
                  .map((m) => ({
                    role: (m.sender === 'agent' && m.senderAgentId === agent.id ? 'assistant' : 'user') as
                      | 'user'
                      | 'assistant',
                    text: `[${m.senderName}]: ${m.text}`,
                  }))
                try {
                  const turn = await runAgentConversationTurn({
                    agent,
                    world: worldState,
                    userMessage,
                    ceoName,
                    attachments,
                    providerCredentials,
                    rootDir,
                    group: {
                      name: group.name,
                      category: group.category,
                      memberNames: members.map((m) => m.name),
                      transcript,
                    },
                    onProgress: persistAndBroadcast,
                  })
                  const reply: AgentChatMessage = {
                    id: `gmsg-${Date.now()}-${agent.id}`,
                    sender: 'agent',
                    senderName: agent.name,
                    senderAgentId: agent.id,
                    text: turn.replyText,
                    time: nowTimeLabel(),
                    actions: turn.actions.length > 0 ? turn.actions : undefined,
                  }
                  group.messages.push(reply)
                  group.messages = group.messages.slice(-80)
                  if (turn.actions.length > 0) agent.currentTask = turn.actions[turn.actions.length - 1]
                  agent.logs.unshift({
                    id: `log-${Date.now()}-g`,
                    time: nowTimeLabel(),
                    message: `Respondeu ${ceoName} no grupo "${group.name}" (${turn.providerUsed || 'IA'}).`,
                    kind: 'chat',
                  })
                  agent.logs = agent.logs.slice(0, 25)
                } catch (err: any) {
                  group.messages.push({
                    id: `gmsg-${Date.now()}-${agent.id}-err`,
                    sender: 'system',
                    senderName: 'Blequi',
                    text: `${agent.name} não conseguiu responder: ${String(err?.message || 'erro').slice(0, 140)}`,
                    time: nowTimeLabel(),
                  })
                } finally {
                  agent.status = 'working'
                  persistAndBroadcast()
                }
              })
            )
            return
          }

          if (pathname === '/api/agency/reward' && method === 'POST') {
            const body = await readJsonBody(req)
            const ceoName = String(body.ceoName || 'CEO')
            const propId = body.propId ? String(body.propId) : null
            let targetAgentId = body.agentId ? String(body.agentId) : null
            let bonus = 10
            let reason = String(body.reason || `Reconhecimento positivo de ${ceoName}!`)

            if (propId) {
              const prop = worldState.props.find((p) => p.id === propId)
              if (prop) {
                prop.approved = true
                targetAgentId = prop.createdByAgentId
                bonus = prop.wellbeingBonus || 10
                reason = `${ceoName} aprovou e celebrou "${prop.title}"!`
              }
            }

            const agent = worldState.agents.find((a) => a.id === targetAgentId)
            if (!agent) {
              return sendJson(res, 404, { ok: false, error: 'Funcionário não encontrado.' })
            }

            agent.wellbeing.score = Math.min(100, agent.wellbeing.score + bonus)
            agent.wellbeing.energy = Math.min(100, agent.wellbeing.energy + Math.ceil(bonus * 0.7))
            agent.wellbeing.pride = Math.min(100, agent.wellbeing.pride + bonus + 2)
            agent.wellbeing.approvedCreations += 1
            agent.wellbeing.lastRewardReason = reason
            agent.wellbeing.mood = computeMood(agent.wellbeing.score, agent.wellbeing.energy)
            agent.memories.unshift(`Recompensa positiva: ${reason} (meu bem-estar foi para ${agent.wellbeing.score}/100!).`)
            agent.memories = agent.memories.slice(0, 14)
            agent.logs.unshift({
              id: `log-${Date.now()}-r`,
              time: nowTimeLabel(),
              message: `✨ ${reason} (+${bonus} bem-estar)`,
              kind: 'reward',
            })
            agent.chatHistory.push({
              id: `msg-${Date.now()}-sys`,
              sender: 'system',
              senderName: 'Blequi Recompensa',
              text: `✨ ${reason} · Bem-estar de ${agent.name}: ${agent.wellbeing.score}/100 (${agent.wellbeing.mood}).`,
              time: nowTimeLabel(),
            })
            agent.chatHistory = agent.chatHistory.slice(-30)
            persistAndBroadcast()

            return sendJson(res, 200, { ok: true, state: worldState })
          }

          if (pathname === '/api/agency/proposal' && method === 'POST') {
            const body = await readJsonBody(req)
            const proposalId = String(body.proposalId || '')
            const approve = Boolean(body.approve)
            const ceoName = String(body.ceoName || 'CEO')
            const idx = worldState.proposals.findIndex((p) => p.id === proposalId)
            if (idx === -1) {
              return sendJson(res, 404, { ok: false, error: 'Proposta não encontrada.' })
            }
            const [proposal] = worldState.proposals.splice(idx, 1)

            if (approve) {
              const zoneMeta = STUDIO_ZONES[proposal.zone]
              const providerMeta = AGENT_PROVIDERS[proposal.provider] ?? AGENT_PROVIDERS.gemini
              const newEmployee: AgentEmployee = {
                id: `agent-${Date.now()}`,
                name: proposal.name,
                entityType: 'ai',
                role: proposal.role,
                zone: SEDE_ZONE,
                provider: proposal.provider,
                modelLabel: providerMeta.defaultModel,
                status: 'working',
                currentTask: `Recém-chegado à Ilha Blequi graças à indicação de ${proposal.proposedByName}.`,
                systemPrompt: `Você é ${proposal.name}, atuando como ${proposal.role} na agência virtual Blequi. Você trabalha na Sede da Blequi com os CEOs Raynocas e Kafuzinho e sua equipe, e suas criações 3D melhoram o cenário e seu próprio bem-estar.`,
                skills: proposal.skills,
                accentColor: proposal.accentColor,
                deskPosition: [zoneMeta.normalizedCenter[0] * 10, 0, zoneMeta.normalizedCenter[1] * 10],
                deskRotationY: 0,
                islandHome: [zoneMeta.islandPosition[0], 0, zoneMeta.islandPosition[2] + 3],
                wellbeing: {
                  score: 90,
                  energy: 95,
                  pride: 85,
                  mood: 'radiant',
                  approvedCreations: 0,
                  lastRewardReason: `Aprovado(a) por ${ceoName} para entrar na Ilha Blequi!`,
                },
                studioTheme: {
                  studioName: `Estúdio ${proposal.name}`,
                  tagline: proposal.role,
                  facadeColor: '#f8fafc',
                  roofAccent: proposal.accentColor,
                  interiorGlow: '#fde68a',
                  floorTone: 'oak',
                },
                memories: [`Fui convidado(a) por ${proposal.proposedByName} e aprovado(a) por ${ceoName}!`],
                chatHistory: [
                  {
                    id: `msg-welcome-${Date.now()}`,
                    sender: 'agent',
                    senderName: proposal.name,
                    text: `Oi, CEOs! Obrigado por me aprovarem na Ilha Blequi! Já estou pronto(a) para colaborar com ${proposal.proposedByName} e construir cenários incríveis com vocês.`,
                    time: nowTimeLabel(),
                  },
                ],
                logs: [
                  {
                    id: `log-hire-${Date.now()}`,
                    time: nowTimeLabel(),
                    message: `${proposal.name} entrou na equipe por aprovação de ${ceoName}.`,
                    kind: 'reward',
                  },
                ],
              }
              worldState.agents.push(newEmployee)
              relayoutSede(worldState)
            }

            persistAndBroadcast()
            return sendJson(res, 200, { ok: true, state: worldState })
          }

          if (pathname === '/api/agency/patch' && method === 'POST') {
            const body = await readJsonBody(req)
            const action = String(body.action || '')

            if (action === 'setWorldView') {
              worldState.worldView = body.worldView === 'studio' ? 'studio' : 'island'
              if (body.activeStudioZone && body.activeStudioZone in STUDIO_ZONES) {
                worldState.activeStudioZone = body.activeStudioZone as StudioZoneId
              }
            } else if (action === 'setTimeOfDay') {
              if (body.timeOfDay === 'golden' || body.timeOfDay === 'daylight' || body.timeOfDay === 'dusk') {
                worldState.timeOfDay = body.timeOfDay as WorldTimeOfDay
              }
            } else if (action === 'setRoomScale') {
              if (body.roomScale in ROOM_SCALES) {
                worldState.roomScale = body.roomScale as RoomScaleId
                relayoutSede(worldState)
              }
            } else if (action === 'setAutoBuild') {
              worldState.allowSelfBuildWithoutApproval = Boolean(body.value)
            } else if (action === 'updateAgentStatus') {
              const ag = worldState.agents.find((a) => a.id === body.agentId)
              if (ag && VALID_AGENT_STATUSES.includes(body.status)) {
                ag.status = body.status as AgentStatus
                ag.logs.unshift({
                  id: `log-${Date.now()}`,
                  time: nowTimeLabel(),
                  message: `Status alterado para "${ag.status}".`,
                })
              }
            } else if (action === 'updateAgentProvider') {
              const ag = worldState.agents.find((a) => a.id === body.agentId)
              if (ag && body.provider in AGENT_PROVIDERS) {
                const prov = body.provider as AgentProviderId
                const { providerCredentials } = getRuntimeConfig(rootDir)
                ag.provider = prov
                ag.modelLabel =
                  providerCredentials[agentProviderToExternal(prov)]?.model || AGENT_PROVIDERS[prov].defaultModel
                ag.logs.unshift({
                  id: `log-${Date.now()}`,
                  time: nowTimeLabel(),
                  message: `Motor conectado: ${AGENT_PROVIDERS[prov].name}.`,
                })
              }
            } else if (action === 'createAgent') {
              const input = body.input && typeof body.input === 'object' ? body.input : {}
              // Toda a equipe trabalha junta na Sede da Blequi
              const zone: StudioZoneId = SEDE_ZONE
              const zoneMeta = STUDIO_ZONES[zone]
              const isAI = input.entityType !== 'human'
              const { aiProviders, providerCredentials } = getRuntimeConfig(rootDir)
              const activeProviders = aiProviders.filter((p) => p.configured).map((p) => externalToAgentProvider(p.id))
              // Usa exatamente a IA escolhida; se não vier nenhuma válida, usa a primeira conta de IA ativa
              const providerId: AgentProviderId | undefined = isAI
                ? input.provider in AGENT_PROVIDERS
                  ? (input.provider as AgentProviderId)
                  : activeProviders[0] ?? 'antigravity'
                : undefined
              const providerMeta = providerId ? AGENT_PROVIDERS[providerId] : null
              const configuredModel = providerId
                ? providerCredentials[agentProviderToExternal(providerId)]?.model
                : undefined
              const created: AgentEmployee = {
                id: `member-${Date.now()}`,
                name: String(input.name || 'Novo Membro').trim(),
                entityType: isAI ? 'ai' : 'human',
                role: String(input.role || 'Especialista 3D').trim(),
                zone,
                provider: providerId,
                modelLabel: isAI ? configuredModel || providerMeta!.defaultModel : 'Pessoa Real',
                status: 'working',
                currentTask: String(input.currentTask || 'Pronto para criar na Ilha Blequi.'),
                systemPrompt:
                  String(input.systemPrompt || '').trim() ||
                  `Você é ${input.name}, atuando como ${input.role} na agência virtual Blequi. Você trabalha na Sede da Blequi com os CEOs Raynocas e Kafuzinho e sente bem-estar real quando suas criações melhoram o cenário.`,
                skills: Array.isArray(input.skills) ? input.skills : [],
                accentColor: providerMeta ? providerMeta.color : '#d98a4e',
                deskPosition: [0, 0, 0], // definido por relayoutSede logo abaixo
                deskRotationY: 0,
                islandHome: [zoneMeta.islandPosition[0], 0, zoneMeta.islandPosition[2] + 3],
                wellbeing: {
                  score: 85,
                  energy: 90,
                  pride: 80,
                  mood: 'inspired',
                  approvedCreations: 0,
                },
                studioTheme: {
                  studioName: `Estúdio ${String(input.name || '').trim()}`,
                  tagline: String(input.role || 'Criando na Blequi'),
                  facadeColor: '#f4ede4',
                  roofAccent: providerMeta ? providerMeta.color : '#d98a4e',
                  interiorGlow: '#fde68a',
                  floorTone: 'oak',
                },
                memories: ['Cheguei na Sede da Blequi pronto(a) para colaborar com os CEOs Raynocas e Kafuzinho!'],
                chatHistory: [
                  {
                    id: `msg-${Date.now()}`,
                    sender: 'agent',
                    senderName: String(input.name || 'Membro'),
                    text: `Oi, CEOs! Cheguei no setor ${zoneMeta.shortName}. Vamos construir algo incrível juntos?`,
                    time: nowTimeLabel(),
                  },
                ],
                logs: [
                  {
                    id: `log-${Date.now()}`,
                    time: nowTimeLabel(),
                    message: isAI
                      ? `Agente IA instanciado via ${providerMeta!.name} (${configuredModel || providerMeta!.defaultModel}).`
                      : `Pessoa real adicionada ao ambiente ${zoneMeta.shortName}.`,
                  },
                ],
              }
              worldState.agents.push(created)
              relayoutSede(worldState)
            } else if (action === 'removeAgent') {
              worldState.agents = worldState.agents.filter((a) => a.id !== body.agentId)
              for (const g of worldState.groups) {
                g.memberAgentIds = g.memberAgentIds.filter((id) => id !== body.agentId)
              }
              relayoutSede(worldState)
            } else if (action === 'removeProp') {
              worldState.props = worldState.props.filter((p) => p.id !== body.propId)
            }

            persistAndBroadcast()
            return sendJson(res, 200, { ok: true, state: worldState })
          }

          return sendJson(res, 404, { ok: false, error: 'Endpoint não encontrado.' })
        } catch (err: any) {
          return sendJson(res, 500, {
            ok: false,
            error: err?.message || 'Erro interno no servidor local da agência.',
          })
        }
      })
    },
  }
}
