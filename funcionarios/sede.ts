import type { AgentProviderId, CeoSlot, RoomScaleId } from './types'
import type { ExternalAiProviderId, ExternalAiProviderStatus } from './aiProvidersCatalog'
import { ROOM_SCALES, ROOM_SCALE_ORDER } from './providers'

/** Zona única onde toda a equipe trabalha junta */
export const SEDE_ZONE = 'b2b-lab' as const

/** Cor de cada CEO nos balões de conversa (DMs e grupos) */
export const CEO_CHAT_COLORS: Record<CeoSlot, { name: string; color: string; soft: string }> = {
  'ceo-1': { name: 'Raynocas', color: '#de6c80', soft: '#fde8ec' },
  'ceo-2': { name: 'Kafuzinho', color: '#3b82f6', soft: '#e6f0ff' },
}

/** Descobre o CEO de mensagens antigas que ainda não tinham `senderCeoSlot` */
export function resolveCeoSlotFromName(name?: string): CeoSlot | undefined {
  const n = String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
  if (n.startsWith('ray')) return 'ceo-1'
  if (n.startsWith('kafu')) return 'ceo-2'
  return undefined
}

/** Motor do agente (AgentProviderId) → conta de IA configurada no painel (ExternalAiProviderId) */
export function agentProviderToExternal(provider?: AgentProviderId): ExternalAiProviderId {
  if (provider === 'claude') return 'claude'
  if (provider === 'opencode') return 'opencode'
  if (provider === 'codex') return 'openai'
  return 'antigravity'
}

/** Conta de IA configurada → motor que o agente usa */
export function externalToAgentProvider(id: ExternalAiProviderId): AgentProviderId {
  if (id === 'claude') return 'claude'
  if (id === 'opencode') return 'opencode'
  if (id === 'openai') return 'codex'
  return 'antigravity'
}

/** Motores de agente que têm chave de API ativa no servidor */
export function getActiveAgentProviders(statuses?: ExternalAiProviderStatus[]): AgentProviderId[] {
  if (!statuses) return []
  return statuses.filter((s) => s.configured).map((s) => externalToAgentProvider(s.id))
}

/** Tamanho mínimo da sala da Sede para que cada agente tenha seu próprio espaço */
export function recommendedSedeScale(agentCount: number, current: RoomScaleId): RoomScaleId {
  const needed: RoomScaleId = agentCount > 14 ? 'giant' : 'large'
  const curIdx = ROOM_SCALE_ORDER.indexOf(current)
  const needIdx = ROOM_SCALE_ORDER.indexOf(needed)
  return curIdx >= needIdx ? current : needed
}

/** Ordem de visita que espalha n posições de um círculo: 0, n/2, n/4, 3n/4, ... */
function spreadOrder(n: number): number[] {
  const order: number[] = []
  const used = new Set<number>()
  for (let step = 1; order.length < n; step *= 2) {
    for (let k = 0; k < step && order.length < n; k++) {
      const idx = Math.floor(((2 * k + 1) * n) / (2 * step)) % n
      const base = Math.floor((k * n) / step) % n
      for (const candidate of [base, idx]) {
        if (!used.has(candidate) && order.length < n) {
          used.add(candidate)
          order.push(candidate)
        }
      }
    }
  }
  return order
}

export interface SedeDeskSlot {
  position: [number, number, number]
  rotationY: number
}

/**
 * Distribui as mesas da Sede em uma grade ao redor do lounge central,
 * longe da porta de saída e dos objetos já existentes, com cada mesa virada para o centro.
 */
export function computeSedeDeskLayout(
  count: number,
  roomScale: RoomScaleId,
  obstacles: [number, number][] = []
): SedeDeskSlot[] {
  const half = ROOM_SCALES[roomScale].size / 2
  const bound = half - 2.4
  const step = 4.5
  const coords: number[] = []
  for (let v = step / 2; v <= bound; v += step) {
    coords.push(v, -v)
  }

  const candidates: [number, number][] = []
  for (const x of coords) {
    for (const z of coords) {
      if (Math.abs(x) < 5.5 && Math.abs(z) < 5.5) continue // lounge central e peças de destaque
      if (z > half - 4.2 && Math.abs(x) < 4) continue // porta de saída / spawn do CEO
      if (obstacles.some(([ox, oz]) => (ox - x) ** 2 + (oz - z) ** 2 < 2.4 * 2.4)) continue
      candidates.push([x, z])
    }
  }

  // Agrupa em "anéis" pela distância ao centro e, dentro de cada anel, intercala os ângulos
  // (0°, 180°, 90°, 270°...) para a equipe ficar espalhada pela sala em vez de amontoada num lado
  const rings = new Map<number, [number, number][]>()
  for (const c of candidates) {
    const key = Math.round(Math.hypot(c[0], c[1]) * 10)
    rings.set(key, [...(rings.get(key) ?? []), c])
  }
  candidates.length = 0
  for (const key of [...rings.keys()].sort((a, b) => a - b)) {
    const ring = rings.get(key)!.sort((a, b) => Math.atan2(a[0], a[1]) - Math.atan2(b[0], b[1]))
    candidates.push(...spreadOrder(ring.length).map((i) => ring[i]))
  }

  const slots: SedeDeskSlot[] = []
  for (let i = 0; i < count; i++) {
    const c = candidates[i % Math.max(1, candidates.length)] ?? [0, -half / 2]
    // Se faltar espaço, empilha com um pequeno deslocamento em vez de sobrepor
    const overflow = candidates.length > 0 ? Math.floor(i / candidates.length) : 0
    const x = c[0] + overflow * 1.6
    const z = c[1]
    slots.push({
      position: [Number(x.toFixed(2)), 0, Number(z.toFixed(2))],
      rotationY: Number(Math.atan2(-x, -z).toFixed(3)),
    })
  }
  return slots
}
