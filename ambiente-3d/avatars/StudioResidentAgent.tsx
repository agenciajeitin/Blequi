import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { AgentEmployee, AgentMood } from '@funcionarios/types'
import { studioPlayerLiveTransform } from '@plataforma/store/useAgencyStore'
import { CoastalCharacterMesh } from './CoastalCharacterMesh'
import { getEmployeeAppearance } from './agentAppearance'

interface StudioResidentAgentProps {
  agent: AgentEmployee
  index: number
  roomSize: number
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

const WAVE_ENTER_DIST_SQ = 3.2 * 3.2
const WAVE_EXIT_DIST_SQ = 3.35 * 3.35

/** Shared mutable positions of studio resident AI employees for zero-rerender 60 FPS proximity checks */
export const studioAgentLivePositions: Record<string, { x: number; y: number; z: number }> = {}

/**
 * Living Coastal World AI employee strolling gently around their private studio
 * (workstation area -> center showcase -> lounge corner -> creative side),
 * pausing and turning to wave warmly whenever selected or approached by a Co-CEO.
 */
export function StudioResidentAgent({
  agent,
  index,
  roomSize,
  isSelected,
  showLabel = true,
  onSelect,
}: StudioResidentAgentProps) {
  const rootRef = useRef<THREE.Group>(null)
  const alertRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const [isNearPlayer, setIsNearPlayer] = useState(false)
  const nearPlayerRef = useRef(false)

  const appearance = useMemo(() => getEmployeeAppearance(agent, index), [agent, index])

  // Cozy inner stroll loop bounded strictly within [-roomSize * 0.34, roomSize * 0.34]
  const waypoints = useMemo(() => {
    const bound = Math.max(1.8, roomSize * 0.34)
    const clamp = (v: number) => THREE.MathUtils.clamp(v, -bound, bound)

    const [deskX, , deskZ] = agent.deskPosition
    const towardCenterX = deskX >= 0 ? -1 : 1
    const towardCenterZ = deskZ >= 0 ? -1 : 1
    const loungeReach = Math.min(bound * 0.82, 4.8)
    const sideOffset = ((index % 3) - 1) * 0.55

    // 1. Workstation area (offset cleanly clear of the desk & chair)
    const wpWork = new THREE.Vector3(
      clamp(deskX + towardCenterX * 1.15),
      0,
      clamp(deskZ + towardCenterZ * 1.2)
    )
    // 2. Center showcase
    const wpCenter = new THREE.Vector3(
      clamp((index % 2 === 0 ? 0.55 : -0.55) + sideOffset * 0.5),
      0,
      clamp((index % 2 === 0 ? -0.35 : 0.45) + sideOffset * 0.35)
    )
    // 3. Cozy lounge corner (opposite quadrant from desk)
    const wpLounge = new THREE.Vector3(
      clamp(towardCenterX * loungeReach + sideOffset * 0.4),
      0,
      clamp(towardCenterZ * (loungeReach * 0.85))
    )
    // 4. Studio gallery / side return point
    const wpGallery = new THREE.Vector3(
      clamp(towardCenterX * (loungeReach * 0.62) - sideOffset * 0.45),
      0,
      clamp(deskZ * 0.55 + (index % 2 === 0 ? 0.65 : -0.65))
    )

    return [wpWork, wpCenter, wpLounge, wpGallery]
  }, [agent.deskPosition, index, roomSize])

  const startWaypointIndex = index % 4
  const progressRef = useRef(startWaypointIndex)
  const [spawnPos] = useState<[number, number, number]>(() => {
    const start = waypoints[startWaypointIndex]
    return [start.x, start.y, start.z]
  })

  // Reusable vectors for zero per-frame allocations
  const posA = useMemo(() => new THREE.Vector3(), [])
  const posB = useMemo(() => new THREE.Vector3(), [])
  const targetPos = useMemo(() => new THREE.Vector3(), [])

  // Register live position on mount and clean up on unmount
  useEffect(() => {
    studioAgentLivePositions[agent.id] = { x: spawnPos[0], y: spawnPos[1], z: spawnPos[2] }
    return () => {
      delete studioAgentLivePositions[agent.id]
    }
  }, [agent.id, spawnPos])

  // Keep cursor tidy if unmounted while hovered
  useEffect(() => {
    if (!hovered) return
    const prev = document.body.style.cursor
    document.body.style.cursor = 'pointer'
    return () => {
      document.body.style.cursor = prev
    }
  }, [hovered])

  const shouldWalk = agent.status !== 'thinking' && !isSelected && !isNearPlayer
  const pose = isSelected || isNearPlayer ? 'wave' : shouldWalk ? 'walk' : 'idle'

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    const dt = Math.min(delta, 0.05)
    const group = rootRef.current

    if (group) {
      // Check Co-CEO proximity in studio without allocating objects
      const dxPlayer = studioPlayerLiveTransform.x - group.position.x
      const dzPlayer = studioPlayerLiveTransform.z - group.position.z
      const playerDistSq = dxPlayer * dxPlayer + dzPlayer * dzPlayer

      const nextNear = nearPlayerRef.current
        ? playerDistSq <= WAVE_EXIT_DIST_SQ
        : playerDistSq <= WAVE_ENTER_DIST_SQ

      if (nextNear !== nearPlayerRef.current) {
        nearPlayerRef.current = nextNear
        setIsNearPlayer(nextNear)
      }

      const canWalkNow = agent.status !== 'thinking' && !isSelected && !nextNear
      const speed = !canWalkNow
        ? 0
        : agent.wellbeing.mood === 'radiant'
          ? 0.2
          : agent.wellbeing.mood === 'tired'
            ? 0.1
            : 0.15

      progressRef.current = (progressRef.current + dt * speed) % waypoints.length
      const segIdx = Math.floor(progressRef.current)
      const nextIdx = (segIdx + 1) % waypoints.length
      const frac = progressRef.current - segIdx
      const smoothFrac = frac * frac * (3 - 2 * frac)

      posA.copy(waypoints[segIdx])
      posB.copy(waypoints[nextIdx])
      targetPos.lerpVectors(posA, posB, smoothFrac)

      const posAlpha = 1 - Math.exp(-8 * dt)
      group.position.lerp(targetPos, posAlpha)

      // Update shared 60 FPS proximity map in place
      const live = studioAgentLivePositions[agent.id]
      if (live) {
        live.x = group.position.x
        live.y = group.position.y
        live.z = group.position.z
      } else {
        studioAgentLivePositions[agent.id] = {
          x: group.position.x,
          y: group.position.y,
          z: group.position.z,
        }
      }

      // Turn warmly toward Co-CEO when selected or nearby; otherwise face stroll direction
      if (isSelected || nextNear) {
        if (playerDistSq > 0.002) {
          const targetYaw = Math.atan2(dxPlayer, dzPlayer)
          let diff = targetYaw - group.rotation.y
          while (diff > Math.PI) diff -= Math.PI * 2
          while (diff < -Math.PI) diff += Math.PI * 2
          group.rotation.y += diff * (1 - Math.exp(-8 * dt))
        }
      } else if (canWalkNow) {
        const moveDx = posB.x - posA.x
        const moveDz = posB.z - posA.z
        if (moveDx * moveDx + moveDz * moveDz > 0.002) {
          const targetYaw = Math.atan2(moveDx, moveDz)
          let diff = targetYaw - group.rotation.y
          while (diff > Math.PI) diff -= Math.PI * 2
          while (diff < -Math.PI) diff += Math.PI * 2
          group.rotation.y += diff * (1 - Math.exp(-6 * dt))
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
      position={spawnPos}
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
      {/* Crisp Coastal World Selection / Proximity Halo */}
      {(isSelected || hovered || isNearPlayer) && (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.48, 0.64, 28]} />
          <meshBasicMaterial
            color={isSelected ? '#02c6a7' : '#ffffff'}
            transparent
            opacity={isSelected || hovered ? 0.92 : 0.65}
          />
        </mesh>
      )}

      {/* 1:1 Coastal World Capsule Bean Avatar */}
      <CoastalCharacterMesh
        appearance={appearance}
        isMoving={shouldWalk}
        pose={pose}
        scale={0.95}
      />

      {/* Signature Coastal World Floating Coral Exclamation / Thinking Indicator */}
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

      {/* Crisp Coastal World White Pill Name Badge (shown on hover or selection) */}
      {showLabel && (isSelected || hovered) && (
        <Html position={[0, 2.55, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'auto' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 whitespace-nowrap shadow-md transition-all ${
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
