import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Crown } from 'lucide-react'
import * as THREE from 'three'
import type { OnlineCeoPresence, StudioZoneId, WorldViewMode } from '@funcionarios/types'
import { DEFAULT_PLAYER_AVATAR, useAgencyStore } from '@plataforma/store/useAgencyStore'
import { CoastalCharacterMesh } from './CoastalCharacterMesh'

interface PartnerCeoWalkersProps {
  view: WorldViewMode
  activeZone?: StudioZoneId
}

const DEFAULT_ISLAND_POS: [number, number, number] = [1.8, 0.26, 22.8]
const DEFAULT_STUDIO_POS: [number, number, number] = [1.6, 0, 4.2]
const TELEPORT_SNAP_DIST_SQ = 10 * 10

function getFallbackPosition(view: WorldViewMode): [number, number, number] {
  return view === 'island' ? DEFAULT_ISLAND_POS : DEFAULT_STUDIO_POS
}

function PartnerCeoWalker({ ceo, view }: { ceo: OnlineCeoPresence; view: WorldViewMode }) {
  const rootRef = useRef<THREE.Group>(null)

  // Stable initial transform references so React re-renders from SSE never snap the lerped group
  const [spawnPos] = useState<[number, number, number]>(() => {
    const p = ceo.position ?? getFallbackPosition(view)
    return [p[0], p[1], p[2]]
  })
  const [spawnRot] = useState<[number, number, number]>(() => [0, ceo.rotationY ?? Math.PI, 0])

  const targetPosRef = useRef(new THREE.Vector3(spawnPos[0], spawnPos[1], spawnPos[2]))
  const targetRotRef = useRef(spawnRot[1])

  useEffect(() => {
    const p = ceo.position ?? getFallbackPosition(view)
    targetPosRef.current.set(p[0], p[1], p[2])
    targetRotRef.current = ceo.rotationY ?? Math.PI
  }, [ceo.position, ceo.rotationY, view])

  useFrame((_, delta) => {
    const group = rootRef.current
    if (!group) return

    const dt = Math.min(delta, 0.05)
    const targetPos = targetPosRef.current
    const distSq = group.position.distanceToSquared(targetPos)

    if (distSq > TELEPORT_SNAP_DIST_SQ) {
      group.position.copy(targetPos)
    } else {
      const posAlpha = 1 - Math.exp(-10 * dt)
      group.position.lerp(targetPos, posAlpha)
    }

    let rotDiff = targetRotRef.current - group.rotation.y
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2
    group.rotation.y += rotDiff * (1 - Math.exp(-12 * dt))
  })

  const appearance = ceo.avatar ?? DEFAULT_PLAYER_AVATAR
  const isMoving = Boolean(ceo.isMoving)
  const displayName = ceo.name?.trim() || 'Co-CEO'

  return (
    <group ref={rootRef} position={spawnPos} rotation={spawnRot}>
      <CoastalCharacterMesh
        appearance={appearance}
        isMoving={isMoving}
        pose={isMoving ? 'walk' : 'idle'}
        scale={1.0}
      />

      {/* Floating Coastal World White Badge with Golden Crown + Partner Co-CEO Name */}
      <Html
        position={[0, 2.38, 0]}
        center
        distanceFactor={view === 'island' ? 18 : undefined}
        zIndexRange={[10, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div className="flex items-center gap-1.5 rounded-full border-2 border-[#ffd15c] bg-white/95 px-2.5 py-0.5 whitespace-nowrap shadow-md">
          <Crown
            className="h-3.5 w-3.5 shrink-0 fill-[#ffd15c] text-[#d97706]"
            aria-hidden="true"
          />
          <span className="text-[11px] font-extrabold text-[#3b3777]">{displayName}</span>
          <span className="text-[10px] font-bold text-[#02c6a7]">· Co-CEO</span>
        </div>
      </Html>
    </group>
  )
}

/**
 * Renders the other online Co-CEO avatar(s) currently exploring the same scene
 * (Ilha Blequi or the same Private Studio), smoothly interpolated at 60 FPS across LAN/Tailscale SSE.
 */
export function PartnerCeoWalkers({ view, activeZone }: PartnerCeoWalkersProps) {
  const onlineCeos = useAgencyStore((s) => s.onlineCeos)
  const currentUser = useAgencyStore((s) => s.currentUser)

  const partnerCeos = useMemo(
    () =>
      onlineCeos.filter((ceo) => {
        if (ceo.ceoSlot === currentUser?.ceoSlot) return false
        if (ceo.activeView !== view) return false
        if (view === 'studio' && ceo.activeZone !== activeZone) return false
        return true
      }),
    [onlineCeos, currentUser?.ceoSlot, view, activeZone]
  )

  if (partnerCeos.length === 0) return null

  return (
    <group>
      {partnerCeos.map((ceo) => (
        <PartnerCeoWalker
          key={`${ceo.ceoSlot}-${view}-${activeZone ?? 'island'}`}
          ceo={ceo}
          view={view}
        />
      ))}
    </group>
  )
}
