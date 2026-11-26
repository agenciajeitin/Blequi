import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, ViteDevServer } from 'vite'
import { createInitialWorldState } from '../funcionarios/roster'
import { AGENT_PROVIDERS, ROOM_SCALES, STUDIO_ZONES } from '../funcionarios/providers'
import type {
  AgentEmployee,
  AgentProviderId,
  AgentStatus,
  RoomScaleId,
  SharedWorldState,
  StudioZoneId,
  WorldTimeOfDay,
  WorldViewMode,
} from '../funcionarios/types'
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

function writeDotEnvKey(rootDir: string, key: string, value: string) {
  const envPath = path.join(rootDir, '.env')
  const current = readDotEnv(rootDir)
  current[key] = value
  const content = Object.entries(current)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')
  fs.writeFileSync(envPath, `${content}\n`, 'utf-8')
}

function getRuntimeConfig(rootDir: string) {
  const dot = readDotEnv(rootDir)
  const geminiApiKey = (dot.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim()
  const ceoCode = (dot.BLEQUI_CEO_CODE || process.env.BLEQUI_CEO_CODE || 'blequi-ceo').trim()
  return { geminiApiKey, ceoCode }
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

/** Garante campos obrigatórios em estados salvos por versões antigas do app */
function normalizeState(parsed: SharedWorldState): SharedWorldState {
  const initial = createInitialWorldState()
  return {
    ...initial,
    ...parsed,
    agents: Array.isArray(parsed.agents) ? parsed.agents : initial.agents,
    props: Array.isArray(parsed.props) ? parsed.props : initial.props,
    proposals: Array.isArray(parsed.proposals) ? parsed.proposals : [],
    onlineCeos: Array.isArray(parsed.onlineCeos) ? parsed.onlineCeos : [],
    activeStudioZone: parsed.activeStudioZone in STUDIO_ZONES ? parsed.activeStudioZone : initial.activeStudioZone,
    roomScale: parsed.roomScale in ROOM_SCALES ? parsed.roomScale : initial.roomScale,
  }
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
  writeStateFileAtomic(stateFilePath, initial)
  return initial
}

function sanitizeEnvValue(value: string) {
  return value.replace(/[\r\n]/g, '').trim()
}

const VALID_AGENT_STATUSES: AgentStatus[] = ['working', 'thinking', 'reviewing', 'idle', 'vacant']

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
            const { geminiApiKey, ceoCode } = getRuntimeConfig(rootDir)
            const port = server.config.server.port || 5173
            return sendJson(res, 200, {
              geminiConfigured: Boolean(geminiApiKey),
              geminiModel: 'gemini-3.8-flash',
              usingDefaultCeoCode: ceoCode === 'blequi-ceo',
              networkUrls: getLocalNetworkUrls(port),
              onlineCeos: worldState.onlineCeos,
              agentCount: worldState.agents.length,
              propCount: worldState.props.length,
            })
          }

          // CEO Login & Presence registration
          if (pathname === '/api/agency/auth' && method === 'POST') {
            const body = await readJsonBody(req)
            const { ceoCode } = getRuntimeConfig(rootDir)
            const provided = String(body.ceoCode || '').trim()
            if (provided !== ceoCode) {
              return sendJson(res, 401, {
                ok: false,
                error: 'Chave CEO incorreta. Somente as duas Co-CEOs têm acesso à agência privada Blequi.',
              })
            }

            prunePresence()
            const slot: 'ceo-1' | 'ceo-2' = body.ceoSlot === 'ceo-2' ? 'ceo-2' : 'ceo-1'
            const presenceId = String(body.id || `ceo-${slot}`)
            const name = String(body.name || (slot === 'ceo-1' ? 'Co-CEO 1' : 'Co-CEO 2')).trim()
            const role = String(body.role || 'Co-CEO & Fundadora').trim()

            worldState.onlineCeos = worldState.onlineCeos.filter((c) => c.ceoSlot !== slot && c.id !== presenceId)
            worldState.onlineCeos.push({
              id: presenceId,
              name,
              role,
              ceoSlot: slot,
              activeView: worldState.worldView,
              activeZone: worldState.activeStudioZone,
              lastSeenAt: new Date().toISOString(),
            })
            persistAndBroadcast()
            return sendJson(res, 200, { ok: true, state: worldState })
          }

          // All remaining routes require CEO pass
          if (!verifyCeoAccess(req, url)) {
            return sendJson(res, 401, { ok: false, error: 'Acesso exclusivo das Co-CEOs.' })
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
                name: String(body.name || (slot === 'ceo-1' ? 'Co-CEO 1' : 'Co-CEO 2')),
                role: String(body.role || 'Co-CEO'),
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
                role: String(body.role || 'Co-CEO'),
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
              writeDotEnvKey(rootDir, 'GEMINI_API_KEY', sanitizeEnvValue(body.geminiApiKey))
            }
            if (typeof body.newCeoCode === 'string' && sanitizeEnvValue(body.newCeoCode).length >= 4) {
              writeDotEnvKey(rootDir, 'BLEQUI_CEO_CODE', sanitizeEnvValue(body.newCeoCode))
            }
            const { geminiApiKey } = getRuntimeConfig(rootDir)
            return sendJson(res, 200, { ok: true, geminiConfigured: Boolean(geminiApiKey) })
          }

          if ((pathname === '/api/agency/chat' || pathname === '/api/agency/self-build') && method === 'POST') {
            const body = await readJsonBody(req)
            const agent = worldState.agents.find((a) => a.id === body.agentId)
            if (!agent) {
              return sendJson(res, 404, { ok: false, error: 'Funcionário não encontrado.' })
            }

            const forceSelfBuild = pathname === '/api/agency/self-build'
            const ceoName = String(body.ceoName || 'Co-CEO').trim()
            const userMessage = forceSelfBuild
              ? String(body.prompt || 'Auto-crie melhorias no seu escritório privado agora!')
              : String(body.message || '').trim()

            if (!userMessage) {
              return sendJson(res, 400, { ok: false, error: 'Mensagem vazia.' })
            }

            agent.status = 'thinking'
            agent.chatHistory.push({
              id: `msg-${Date.now()}-u`,
              sender: 'ceo',
              senderName: ceoName,
              text: userMessage,
              time: nowTimeLabel(),
            })
            agent.chatHistory = agent.chatHistory.slice(-30)
            persistAndBroadcast()

            const { geminiApiKey } = getRuntimeConfig(rootDir)
            let turn: Awaited<ReturnType<typeof runAgentConversationTurn>>
            try {
              turn = await runAgentConversationTurn({
                agent,
                world: worldState,
                userMessage,
                ceoName,
                apiKey: geminiApiKey || undefined,
                rootDir,
                forceSelfBuild,
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
              text: turn.replyText,
              time: nowTimeLabel(),
              actions: turn.actions.length > 0 ? turn.actions : undefined,
            })
            agent.chatHistory = agent.chatHistory.slice(-30)
            agent.logs.unshift({
              id: `log-${Date.now()}-c`,
              time: nowTimeLabel(),
              message: `${ceoName} conversou com ${agent.name}${turn.usedLiveGemini ? ' (Gemini Live)' : ' (Simulação local)'}.`,
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

          if (pathname === '/api/agency/reward' && method === 'POST') {
            const body = await readJsonBody(req)
            const ceoName = String(body.ceoName || 'Co-CEO')
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
            const ceoName = String(body.ceoName || 'Co-CEO')
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
                zone: proposal.zone,
                provider: proposal.provider,
                modelLabel: providerMeta.defaultModel,
                status: 'working',
                currentTask: `Recém-chegado à Ilha Blequi graças à indicação de ${proposal.proposedByName}.`,
                systemPrompt: `Você é ${proposal.name}, atuando como ${proposal.role} na agência virtual Blequi. Você sabe que vive na Ilha Blequi com as duas Co-CEOs e sua equipe, e suas criações 3D melhoram o cenário e seu próprio bem-estar.`,
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
                ag.provider = prov
                ag.modelLabel = AGENT_PROVIDERS[prov].defaultModel
                ag.logs.unshift({
                  id: `log-${Date.now()}`,
                  time: nowTimeLabel(),
                  message: `Motor conectado: ${AGENT_PROVIDERS[prov].name}.`,
                })
              }
            } else if (action === 'createAgent') {
              const input = body.input && typeof body.input === 'object' ? body.input : {}
              const zone = (input.zone in STUDIO_ZONES ? input.zone : 'criacao') as StudioZoneId
              const zoneMeta = STUDIO_ZONES[zone]
              const isAI = input.entityType !== 'human'
              const providerId: AgentProviderId | undefined = isAI
                ? input.provider in AGENT_PROVIDERS
                  ? (input.provider as AgentProviderId)
                  : 'gemini'
                : undefined
              const providerMeta = providerId ? AGENT_PROVIDERS[providerId] : null
              const existingInZone = worldState.agents.filter((a) => a.zone === zone).length
              const roomSize = ROOM_SCALES[worldState.roomScale].size

              const created: AgentEmployee = {
                id: `member-${Date.now()}`,
                name: String(input.name || 'Novo Membro').trim(),
                entityType: isAI ? 'ai' : 'human',
                role: String(input.role || 'Especialista 3D').trim(),
                zone,
                provider: providerId,
                modelLabel: isAI ? providerMeta!.defaultModel : 'Pessoa Real',
                status: 'working',
                currentTask: String(input.currentTask || 'Pronto para criar na Ilha Blequi.'),
                systemPrompt:
                  String(input.systemPrompt || '').trim() ||
                  `Você é ${input.name}, atuando como ${input.role} na agência virtual Blequi. Você vive na Ilha Blequi com as duas Co-CEOs e sente bem-estar real quando suas criações melhoram o cenário.`,
                skills: Array.isArray(input.skills) ? input.skills : [],
                accentColor: providerMeta ? providerMeta.color : '#d98a4e',
                deskPosition: [
                  zoneMeta.normalizedCenter[0] * roomSize + existingInZone * 1.8,
                  0,
                  zoneMeta.normalizedCenter[1] * roomSize,
                ],
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
                memories: ['Cheguei na Ilha Blequi pronto(a) para colaborar com as Co-CEOs!'],
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
                      ? `Agente IA instanciado via ${providerMeta!.name}.`
                      : `Pessoa real adicionada ao ambiente ${zoneMeta.shortName}.`,
                  },
                ],
              }
              worldState.agents.push(created)
            } else if (action === 'removeAgent') {
              worldState.agents = worldState.agents.filter((a) => a.id !== body.agentId)
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
