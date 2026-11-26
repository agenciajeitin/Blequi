import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { Group, Mesh } from 'three'
import type { AgentEmployee } from '@funcionarios/types'
import { AGENT_PROVIDERS } from '@funcionarios/providers'

interface AgentAvatarProps {
  agent: AgentEmployee
  isSelected: boolean
  onSelect: () => void
}

const STATUS_DOT_COLOR: Record<AgentEmployee['status'], string> = {
  working: '#10b981',
  thinking: '#f59e0b',
  reviewing: '#3b82f6',
  idle: '#94a3b8',
  vacant: '#475569',
}

export function AgentAvatar({ agent, isSelected, onSelect }: AgentAvatarProps) {
  const bodyRef = useRef<Group>(null)
  const leftHandRef = useRef<Mesh>(null)
  const rightHandRef = useRef<Mesh>(null)
  const orbRef = useRef<Mesh>(null)

  const provider = agent.provider ? AGENT_PROVIDERS[agent.provider] : null
  const badgeColor = provider ? provider.color : '#d98a4e'
  const badgeLabel = provider ? provider.badge : 'HUM'
  const isVacant = agent.status === 'vacant'

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (bodyRef.current) {
      const speed = agent.status === 'thinking' ? 3.5 : 1.8
      const amp = isVacant ? 0.02 : 0.025
      bodyRef.current.position.y = Math.sin(t * speed + agent.deskPosition[0]) * amp
    }

    if (!isVacant && (agent.status === 'working' || agent.status === 'reviewing')) {
      if (leftHandRef.current) {
        leftHandRef.current.position.y = 0.82 + Math.sin(t * 14) * 0.015
      }
      if (rightHandRef.current) {
        rightHandRef.current.position.y = 0.82 + Math.cos(t * 14) * 0.015
      }
    }

    if (orbRef.current) {
      orbRef.current.position.y = 1.76 + Math.sin(t * 2.6) * 0.06
      orbRef.current.rotation.y = t * 1.4
    }
  })

  return (
    <group
      position={agent.deskPosition}
      rotation={[0, agent.deskRotationY, 0]}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      <group ref={bodyRef} position={[0, 0, 0.44]}>
        <mesh position={[0, 0.84, 0]} castShadow={!isVacant}>
          <capsuleGeometry args={[0.17, 0.28, 8, 16]} />
          <meshStandardMaterial
            color={isVacant ? '#334155' : '#1e2638'}
            roughness={0.5}
            metalness={0.2}
            transparent={isVacant}
            opacity={isVacant ? 0.35 : 1}
            wireframe={isVacant}
          />
        </mesh>

        {!isVacant && (
          <mesh position={[0, 1.0, -0.02]}>
            <torusGeometry args={[0.14, 0.025, 10, 24]} />
            <meshStandardMaterial
              color={agent.accentColor}
              emissive={agent.accentColor}
              emissiveIntensity={0.8}
            />
          </mesh>
        )}

        <mesh position={[0, 1.24, 0]} castShadow={!isVacant}>
          <sphereGeometry args={[0.16, 20, 20]} />
          <meshStandardMaterial
            color={isVacant ? '#475569' : '#e2e8f0'}
            roughness={0.35}
            metalness={0.1}
            transparent={isVacant}
            opacity={isVacant ? 0.32 : 1}
            wireframe={isVacant}
          />
        </mesh>

        {!isVacant && agent.entityType === 'ai' && (
          <mesh position={[0, 1.25, -0.135]}>
            <boxGeometry args={[0.21, 0.065, 0.05]} />
            <meshStandardMaterial
              color={badgeColor}
              emissive={badgeColor}
              emissiveIntensity={1.4}
              toneMapped={false}
            />
          </mesh>
        )}

        {!isVacant && (
          <>
            <mesh ref={leftHandRef} position={[-0.17, 0.82, -0.45]} castShadow>
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
            </mesh>
            <mesh ref={rightHandRef} position={[0.17, 0.82, -0.45]} castShadow>
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
            </mesh>
          </>
        )}

        <mesh ref={orbRef} position={[0, 1.76, 0]}>
          <octahedronGeometry args={[0.085, 0]} />
          <meshStandardMaterial
            color={isVacant ? '#475569' : badgeColor}
            emissive={isVacant ? '#334155' : badgeColor}
            emissiveIntensity={isSelected ? 2.2 : isVacant ? 0.25 : 1.1}
            toneMapped={false}
          />
        </mesh>
      </group>

      <Html position={[0, 2.22, 0.2]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'auto' }}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          className={`group flex items-center gap-2 rounded-full border px-2.5 py-1 text-left backdrop-blur-md transition-all cursor-pointer whitespace-nowrap ${
            isSelected
              ? 'border-white/40 bg-zinc-900/95 shadow-lg shadow-black/60 scale-105'
              : 'border-white/10 bg-zinc-950/80 hover:border-white/25 hover:bg-zinc-900/90'
          }`}
        >
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{
              backgroundColor: STATUS_DOT_COLOR[agent.status],
              boxShadow: isVacant ? 'none' : `0 0 8px ${STATUS_DOT_COLOR[agent.status]}`,
            }}
          />
          <span className="text-[11px] font-medium text-zinc-100">{agent.name}</span>
          <span
            className="rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider"
            style={{
              backgroundColor: `${badgeColor}22`,
              color: badgeColor,
            }}
          >
            {badgeLabel}
          </span>
        </button>
      </Html>
    </group>
  )
}
