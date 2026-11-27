import { useMemo } from 'react'
import type { AgentEmployee } from '@funcionarios/types'
import { COASTAL_AVATAR_PALETTES } from '@ambiente/shaders/coastalShaders'
import { getEmployeeAppearance } from '@ambiente/avatars/agentAppearance'
import { useAgencyStore } from '@plataforma/store/useAgencyStore'

interface AgentPortraitProps {
  agent: AgentEmployee
  size?: number
  /** Mostra a bolinha de status (verde = livre, amarelo = pensando) */
  showStatus?: boolean
}

/**
 * Foto de perfil do personagem do agente, desenhada em SVG com as mesmas
 * cores e acessórios do avatar 3D que caminha pela Sede da Blequi.
 */
export function AgentPortrait({ agent, size = 40, showStatus = false }: AgentPortraitProps) {
  const agents = useAgencyStore((s) => s.agents)
  const index = Math.max(0, agents.findIndex((a) => a.id === agent.id))
  const look = useMemo(() => getEmployeeAppearance(agent, index), [agent, index])
  const palette = COASTAL_AVATAR_PALETTES[look.colorIndex] ?? COASTAL_AVATAR_PALETTES[0]

  const body = look.customBodyColor || palette.body
  const limbs = look.customLimbColor || palette.limbs
  const accent = look.customAccentColor || palette.accent
  const face = palette.face

  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        role="img"
        aria-label={`Foto de ${agent.name}`}
        className="rounded-full"
      >
        <defs>
          <clipPath id={`portrait-clip-${agent.id}`}>
            <circle cx="50" cy="50" r="50" />
          </clipPath>
        </defs>
        <g clipPath={`url(#portrait-clip-${agent.id})`}>
          <rect width="100" height="100" fill={`${agent.accentColor}2e`} />
          {/* ombros */}
          <ellipse cx="50" cy="104" rx="38" ry="26" fill={limbs} />
          {/* cabeça arredondada no estilo dos personagens da ilha */}
          <circle cx="50" cy="52" r="31" fill={body} />
          {/* rosto */}
          <ellipse cx="50" cy="58" rx="21" ry="18" fill={face} />
          {/* bochechas */}
          <circle cx="36" cy="64" r="4" fill={palette.blush} opacity="0.55" />
          <circle cx="64" cy="64" r="4" fill={palette.blush} opacity="0.55" />
          {/* olhos */}
          <rect x="40" y="51" width="5.5" height="9" rx="2.75" fill="#241f46" />
          <rect x="54.5" y="51" width="5.5" height="9" rx="2.75" fill="#241f46" />
          {look.faceStyle === 'lashes' && (
            <g stroke="#241f46" strokeWidth="1.8" strokeLinecap="round">
              <line x1="40" y1="51" x2="37" y2="48.5" />
              <line x1="60" y1="51" x2="63" y2="48.5" />
            </g>
          )}
          {/* sorriso */}
          <path d="M44 66 Q50 71 56 66" stroke="#241f46" strokeWidth="2.4" fill="none" strokeLinecap="round" />

          {look.headAccessory === 'headphones' && (
            <g>
              <path d="M22 50 Q22 18 50 18 Q78 18 78 50" stroke={limbs} strokeWidth="6" fill="none" strokeLinecap="round" />
              <rect x="15" y="44" width="12" height="18" rx="6" fill={accent} />
              <rect x="73" y="44" width="12" height="18" rx="6" fill={accent} />
            </g>
          )}
          {look.headAccessory === 'beanie' && (
            <g>
              <path d="M19 42 Q19 14 50 14 Q81 14 81 42 Z" fill={accent} />
              <rect x="17" y="38" width="66" height="9" rx="4.5" fill={limbs} />
              <circle cx="50" cy="12" r="6" fill={accent} />
            </g>
          )}
          {look.headAccessory === 'sunhat' && (
            <g>
              <ellipse cx="50" cy="32" rx="46" ry="9" fill={accent} />
              <path d="M28 32 Q28 10 50 10 Q72 10 72 32 Z" fill={accent} />
              <rect x="28" y="26" width="44" height="5" fill={limbs} opacity="0.7" />
            </g>
          )}
          {look.headAccessory === 'visor' && (
            <g>
              <rect x="20" y="30" width="60" height="8" rx="4" fill={limbs} />
              <path d="M44 34 Q66 30 84 40 L80 44 Q64 38 44 40 Z" fill={accent} />
            </g>
          )}
          {look.headAccessory === 'crown' && (
            <path d="M30 30 L34 12 L42 24 L50 8 L58 24 L66 12 L70 30 Z" fill="#ffd15c" stroke="#d97706" strokeWidth="1.5" />
          )}
        </g>
      </svg>

      {showStatus && (
        <span
          className={`absolute right-0 bottom-0 rounded-full border-2 border-white ${
            agent.status === 'thinking' ? 'bg-[#f6b93b]' : agent.status === 'idle' ? 'bg-[#94a3b8]' : 'bg-[#02c6a7]'
          }`}
          style={{ width: Math.max(9, size * 0.26), height: Math.max(9, size * 0.26) }}
        />
      )}
    </span>
  )
}

/** Bolinha com a inicial do CEO na cor dele */
export function CeoBadge({ name, color, size = 28 }: { name: string; color: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-black text-white"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.42 }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  )
}
