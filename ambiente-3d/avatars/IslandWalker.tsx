import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { AgentEmployee, AgentMood, BodyAccessoryId, HeadAccessoryId, ShoeStyleId } from '@funcionarios/types'
import { CoastalCharacterMesh } from './CoastalCharacterMesh'
import { COASTAL_STUDIO_LOCATIONS } from '../island/CoastalStudios'

interface IslandWalkerProps {
  agent: AgentEmployee
  index: number
  isSelected: boolean
  showLabel?: boolean
  onSelect: () => void
}

const MOOD_EMOJI: Record<AgentMood, string> = {
  radiant: '✨',
  inspired: '🎨',
  focused: '⚡',
  cozy: '☀️',
  tired: '🌙',
}

/** Shared mutable positions of AI employees so the Player Controller can detect proximity at 60 FPS */
export const agentLivePositions: Record<string, { x: number; y: number; z: number }> = {}

function getEmployeeAppearance(agent: AgentEmployee, index: number): {
  colorIndex: number
  customBodyColor: string
  customLimbColor: string
  customAccentColor: string
  faceStyle: 'classic' | 'lashes'
  headAccessory: HeadAccessoryId
  bodyAccessory: BodyAccessoryId
  shoeStyle: ShoeStyleId
} {
  if (agent.id === 'agent-luma') {
    return {
      colorIndex: 0,
      customBodyColor: '#f2785c',
      customLimbColor: '#c95c48',
      customAccentColor: '#f6d35f',
      faceStyle: 'lashes',
      headAccessory: 'sunhat',
      bodyAccessory: 'backpack',
      shoeStyle: 'sandals',
    }
  }
  if (agent.id === 'agent-kael') {
    return {
      colorIndex: 2,
      customBodyColor: '#4c7be8',
      customLimbColor: '#3758b8',
      customAccentColor: '#02c6a7',
      faceStyle: 'classic',
      headAccessory: 'headphones',
      bodyAccessory: 'fannypack',
      shoeStyle: 'sneakers',
    }
  }
  if (agent.id === 'agent-vex') {
    return {
      colorIndex: 1,
      customBodyColor: '#22a6d4',
      customLimbColor: '#2f659c',
      customAccentColor: '#f6d35f',
      faceStyle: 'classic',
      headAccessory: 'visor',
      bodyAccessory: 'wings',
      shoeStyle: 'fast',
    }
  }
  if (agent.id === 'agent-nori') {
    return {
      colorIndex: 3,
      customBodyColor: '#00bcc7',
      customLimbColor: '#445fa8',
      customAccentColor: '#b79cf2',
      faceStyle: 'lashes',
      headAccessory: 'beanie',
      bodyAccessory: 'fannypack',
      shoeStyle: 'boots',
    }
  }
  const presets: HeadAccessoryId[] = ['beanie', 'headphones', 'visor', 'sunhat']
  return {
    colorIndex: index % 5,
    customBodyColor: agent.accentColor,
    customLimbColor: '#434b78',
    customAccentColor: '#02c6a7',
    faceStyle: index % 2 === 0 ? 'lashes' : 'classic',
    headAccessory: presets[index % presets.length],
    bodyAccessory: 'fannypack',
    shoeStyle: 'sneakers',
  }
}

/**
 * Living Coastal World capsule-bean AI employee strolling gracefully around Ilha Blequi's
 * waterfront promenade & town plaza, stopping warmly when selected or thinking.
 */
export function IslandWalker({
  agent,
  index,
  isSelected,
  showLabel = true,
  onSelect,
}: IslandWalkerProps) {
  const rootRef = useRef<THREE.Group>(null)
  const alertRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)

  const appearance = useMemo(() => getEmployeeAppearance(agent, index), [agent, index])

  // Waypoints right on the y = 1.35 paved coastal plaza & in front of each employee's studio!
  const waypoints = useMemo(() => {
    const loc =
      agent.zone !== 'editorial' ? COASTAL_STUDIO_LOCATIONS[agent.zone] : COASTAL_STUDIO_LOCATIONS['b2b-lab']
    const [dx, , dz] = loc.teleportPoint
    const y = 1.35
    return [
      new THREE.Vector3(dx, y, dz),
      new THREE.Vector3(dx * 0.45, y, 7.6 + (index - 1.5) * 0.9),
      new THREE.Vector3((index % 2 === 0 ? -1 : 1) * 2.8, y, 3.6 + (index % 2) * 1.4),
      new THREE.Vector3(dx * 0.72, y, dz * 0.65 + 2.4),
    ]
  }, [agent.zone, index])

  const progressRef = useRef(index * 0.9)
  const posA = useMemo(() => new THREE.Vector3(), [])
  const posB = useMemo(() => new THREE.Vector3(), [])
  const isMoving = agent.status !== 'thinking' && !isSelected

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    const dt = Math.min(delta, 0.05)

    const speed = !isMoving
      ? 0
      : agent.wellbeing.mood === 'radiant'
        ? 0.24
        : agent.wellbeing.mood === 'tired'
          ? 0.12
          : 0.18

    progressRef.current = (progressRef.current + dt * speed) % waypoints.length
    const segIdx = Math.floor(progressRef.current)
    const nextIdx = (segIdx + 1) % waypoints.length
    const frac = progressRef.current - segIdx
    const smoothFrac = frac * frac * (3 - 2 * frac)

    posA.copy(waypoints[segIdx])
    posB.copy(waypoints[nextIdx])

    if (rootRef.current) {
      rootRef.current.position.lerpVectors(posA, posB, smoothFrac)
      agentLivePositions[agent.id] = {
        x: rootRef.current.position.x,
        y: rootRef.current.position.y,
        z: rootRef.current.position.z,
      }

      if (isMoving) {
        const dx = posB.x - posA.x
        const dz = posB.z - posA.z
        if (dx * dx + dz * dz > 0.002) {
          const targetYaw = Math.atan2(dx, dz)
          let diff = targetYaw - rootRef.current.rotation.y
          while (diff > Math.PI) diff -= Math.PI * 2
          while (diff < -Math.PI) diff += Math.PI * 2
          rootRef.current.rotation.y += diff * Math.min(1, dt * 6)
        }
      }
    }

    if (alertRef.current) {
      alertRef.current.position.y = 2.05 + Math.sin(t * 4 + index) * 0.09
    }
  })

  return (
    <group
      ref={rootRef}
      position={[waypoints[0].x, waypoints[0].y, waypoints[0].z]}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      {/* Crisp Coastal World Selection Halo */}
      {(isSelected || hovered) && (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.48, 0.64, 28]} />
          <meshBasicMaterial color={isSelected ? '#02c6a7' : '#ffffff'} transparent opacity={0.92} />
        </mesh>
      )}

      {/* 1:1 Coastal World Capsule Bean Avatar */}
      <CoastalCharacterMesh
        appearance={appearance}
        isMoving={isMoving}
        pose={isSelected ? 'wave' : isMoving ? 'walk' : 'idle'}
        scale={0.95}
      />

      {/* Signature Coastal World Floating Coral Exclamation / Chat Indicator (steps/121/media_0.png!) */}
      <group ref={alertRef} position={[0, 2.05, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.055, 0.2, 6, 10]} />
          <meshStandardMaterial
            color={agent.status === 'thinking' ? '#f6d35f' : '#f2676f'}
            emissive={agent.status === 'thinking' ? '#f6d35f' : '#f2676f'}
            emissiveIntensity={0.35}
          />
        </mesh>
        <mesh position={[0, -0.22, 0]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color={agent.status === 'thinking' ? '#f6d35f' : '#f2676f'} />
        </mesh>
      </group>

      {/* Crisp Coastal World White Pill Name Badge (shown cleanly on hover or selection) */}
      {showLabel && (isSelected || hovered) && (
        <Html position={[0, 2.55, 0]} center distanceFactor={18} zIndexRange={[10, 0]} style={{ pointerEvents: 'auto' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
            className={`flex items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 whitespace-nowrap shadow-md transition-all ${
              isSelected
                ? 'scale-110 border-[#02c6a7] bg-[#3b3777] text-white'
                : 'border-white bg-white/95 text-[#3b3777] hover:scale-105'
            }`}
          >
            <span className="text-[11px]">{MOOD_EMOJI[agent.wellbeing.mood]}</span>
            <span className="text-[11px] font-extrabold">{agent.name}</span>
            <span className="text-[10px] font-bold text-[#02c6a7]">{agent.wellbeing.score}%</span>
          </button>
        </Html>
      )}
    </group>
  )
}
