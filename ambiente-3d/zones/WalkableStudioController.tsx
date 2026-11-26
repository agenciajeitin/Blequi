import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type {
  AgentEmployee,
  NearbyInteractable,
  PlayerAvatarConfig,
  StudioCameraMode,
  StudioZoneId,
  WorldCreationProp,
} from '@funcionarios/types'
import { studioPlayerLiveTransform } from '@plataforma/store/useAgencyStore'
import { CoastalCharacterMesh } from '../avatars/CoastalCharacterMesh'
import { studioAgentLivePositions } from '../avatars/StudioResidentAgent'
import { virtualJoystick } from '../island/PlayablePlayerController'

interface WalkableStudioControllerProps {
  zone: StudioZoneId
  roomSize: number
  cameraMode: StudioCameraMode
  isCustomizerOpen: boolean
  isPhoneOpen: boolean
  isModalOpen: boolean
  avatar: PlayerAvatarConfig
  studioAgents: AgentEmployee[]
  studioProps: WorldCreationProp[]
  onFirstMove: () => void
  onNearbyChange: (item: NearbyInteractable | null) => void
  onBroadcastMove: (pos: [number, number, number], rotY: number, isMoving: boolean) => void
}

/**
 * Gives EVERY Studio Interior the EXACT same Coastal World playable experience as the Island:
 * - WASD / Arrow Keys + Click & Drag Virtual Joystick movement
 * - Smooth 3rd-person Perspective follow camera (or optional Orbit overview mode)
 * - Live 3D Avatar Customizer 3/4 portrait close-up right inside the studio
 * - 60 FPS proximity detection for Resident AI Employees, Self-Built 3D Props, and Exit Doorway
 */
export function WalkableStudioController({
  zone,
  roomSize,
  cameraMode,
  isCustomizerOpen,
  isPhoneOpen,
  isModalOpen,
  avatar,
  studioAgents,
  studioProps,
  onFirstMove,
  onNearbyChange,
  onBroadcastMove,
}: WalkableStudioControllerProps) {
  const { camera } = useThree()
  const playerGroupRef = useRef<THREE.Group>(null)
  const [movingVisual, setMovingVisual] = useState(false)
  const movingRef = useRef(false)
  const keysRef = useRef<Record<string, boolean>>({})

  const desiredCamPos = useRef(new THREE.Vector3(0, 3.3, 9.8))
  const desiredLookAt = useRef(new THREE.Vector3(0, 1.4, 0))
  const currentLookAt = useRef(new THREE.Vector3(0, 1.4, 0))
  const nearbyTimerRef = useRef(0)
  const syncTimerRef = useRef(0)
  const lastNearbyIdRef = useRef<string | null>(null)
  const hasSnappedRef = useRef(false)

  const half = roomSize / 2
  const bound = Math.max(3.5, half - 1.15)
  const exitZ = half - 0.55

  // Spawn Co-CEO cleanly just inside the South Coastal Exit Archway facing inward (-Z)
  useEffect(() => {
    const spawnZ = Math.max(2.0, half - 2.15)
    studioPlayerLiveTransform.x = 0
    studioPlayerLiveTransform.y = 0
    studioPlayerLiveTransform.z = spawnZ
    studioPlayerLiveTransform.rotationY = Math.PI
    studioPlayerLiveTransform.isMoving = false
    hasSnappedRef.current = false
    lastNearbyIdRef.current = null
    onNearbyChange(null)
    if (playerGroupRef.current) {
      playerGroupRef.current.position.set(0, 0, spawnZ)
      playerGroupRef.current.rotation.y = Math.PI
    }
    onBroadcastMove([0, 0, spawnZ], Math.PI, false)
  }, [zone, half, onNearbyChange, onBroadcastMove])

  // Keyboard listener (WASD + Arrows)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      keysRef.current[e.code] = true
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false
    }
    const onBlur = () => {
      keysRef.current = {}
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)

    // 1. PLAYER MOVEMENT INSIDE STUDIO
    const canMove = !isCustomizerOpen && !isPhoneOpen && !isModalOpen && cameraMode === 'walk'
    let inputX = 0
    let inputZ = 0

    if (canMove) {
      const k = keysRef.current
      if (k.ArrowUp || k.KeyW) inputZ -= 1
      if (k.ArrowDown || k.KeyS) inputZ += 1
      if (k.ArrowLeft || k.KeyA) inputX -= 1
      if (k.ArrowRight || k.KeyD) inputX += 1

      if (virtualJoystick.active && (Math.abs(virtualJoystick.dx) > 0.08 || Math.abs(virtualJoystick.dy) > 0.08)) {
        inputX += virtualJoystick.dx
        inputZ += virtualJoystick.dy
      }
    }

    const mag = Math.hypot(inputX, inputZ)
    const isMovingNow = mag > 0.08

    if (isMovingNow) {
      onFirstMove()
      const speed = 5.6 * Math.min(1, mag)
      const dirX = inputX / mag
      const dirZ = inputZ / mag
      studioPlayerLiveTransform.x = THREE.MathUtils.clamp(
        studioPlayerLiveTransform.x + dirX * speed * dt,
        -bound,
        bound
      )
      studioPlayerLiveTransform.z = THREE.MathUtils.clamp(
        studioPlayerLiveTransform.z + dirZ * speed * dt,
        -bound,
        bound
      )

      const targetYaw = Math.atan2(dirX, dirZ)
      let diff = targetYaw - studioPlayerLiveTransform.rotationY
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      studioPlayerLiveTransform.rotationY += diff * Math.min(1, dt * 12)
    }

    const prevMoving = movingRef.current
    studioPlayerLiveTransform.isMoving = isMovingNow
    if (isMovingNow !== movingRef.current) {
      movingRef.current = isMovingNow
      setMovingVisual(isMovingNow)
    }

    // Throttled live sync for partner Co-CEO (~5Hz when moving, immediate stop frame)
    syncTimerRef.current += dt
    if ((isMovingNow && syncTimerRef.current >= 0.22) || (prevMoving && !isMovingNow)) {
      syncTimerRef.current = 0
      onBroadcastMove(
        [studioPlayerLiveTransform.x, 0, studioPlayerLiveTransform.z],
        studioPlayerLiveTransform.rotationY,
        isMovingNow
      )
    }

    if (playerGroupRef.current) {
      playerGroupRef.current.position.set(studioPlayerLiveTransform.x, 0, studioPlayerLiveTransform.z)
      const targetRot = isCustomizerOpen ? 0.28 : studioPlayerLiveTransform.rotationY
      let rDiff = targetRot - playerGroupRef.current.rotation.y
      while (rDiff > Math.PI) rDiff -= Math.PI * 2
      while (rDiff < -Math.PI) rDiff += Math.PI * 2
      playerGroupRef.current.rotation.y += rDiff * Math.min(1, dt * 10)
    }

    // 2. CAMERA FRAMING (3rd-Person Follow OR Customizer 3/4 Portrait; OrbitControls takes over in 'orbit')
    if (cameraMode === 'walk' || isCustomizerOpen) {
      const px = studioPlayerLiveTransform.x
      const pz = studioPlayerLiveTransform.z

      if (isCustomizerOpen) {
        desiredCamPos.current.set(px + 1.35, 1.55, pz + 3.45)
        desiredLookAt.current.set(px, 1.02, pz)
      } else {
        desiredCamPos.current.set(px * 0.85, 3.65, pz + 6.1)
        desiredLookAt.current.set(px * 0.9, 1.45, pz - 3.6)
      }

      if (!hasSnappedRef.current) {
        camera.position.copy(desiredCamPos.current)
        currentLookAt.current.copy(desiredLookAt.current)
        camera.lookAt(currentLookAt.current)
        hasSnappedRef.current = true
      } else {
        const lerpRate = Math.min(1, dt * (isCustomizerOpen ? 6.5 : 5.5))
        camera.position.lerp(desiredCamPos.current, lerpRate)
        currentLookAt.current.lerp(desiredLookAt.current, lerpRate)
        camera.lookAt(currentLookAt.current)
      }
    }

    // 3. PROXIMITY DETECTION (Resident Employees, AI Props, and Exit Archway)
    nearbyTimerRef.current += dt
    if (nearbyTimerRef.current >= 0.18) {
      nearbyTimerRef.current = 0
      const px = studioPlayerLiveTransform.x
      const pz = studioPlayerLiveTransform.z
      let closest: NearbyInteractable | null = null
      let bestDist = 3.2

      // Check Resident AI Employees
      for (const ag of studioAgents) {
        const lp = studioAgentLivePositions[ag.id]
        if (!lp) continue
        const d = Math.hypot(lp.x - px, lp.z - pz)
        if (d < bestDist) {
          bestDist = d
          closest = {
            kind: 'agent',
            id: ag.id,
            label: `Conversar com ${ag.name}`,
            sublabel: ag.role,
            accentColor: ag.accentColor,
            zone: ag.zone,
          }
        }
      }

      // Check Self-Built 3D Props inside Studio
      for (const prop of studioProps) {
        const d = Math.hypot(prop.position[0] - px, prop.position[2] - pz)
        if (d < 2.5 && d < bestDist) {
          bestDist = d
          closest = {
            kind: 'prop',
            id: prop.id,
            label: prop.approved ? prop.title : `Celebrar · ${prop.title}`,
            sublabel: `Criado por ${prop.createdByName}`,
            accentColor: prop.color,
            zone: prop.zone,
          }
        }
      }

      // Check South Coastal Exit Archway Door
      const distExit = Math.hypot(px - 0, pz - exitZ)
      if (distExit < 2.25 && (!closest || distExit < bestDist)) {
        closest = {
          kind: 'exit',
          id: 'studio-exit',
          label: 'Sair para a Ilha Blequi',
          sublabel: 'Voltar para o ar livre na ilha',
          accentColor: '#02c6a7',
          zone,
        }
      }

      const nextKey = closest ? `${closest.kind}:${closest.id}` : null
      if (nextKey !== lastNearbyIdRef.current) {
        lastNearbyIdRef.current = nextKey
        onNearbyChange(closest)
      }
    }
  })

  return (
    <group
      ref={playerGroupRef}
      position={[studioPlayerLiveTransform.x, 0, studioPlayerLiveTransform.z]}
      rotation={[0, studioPlayerLiveTransform.rotationY, 0]}
    >
      <CoastalCharacterMesh
        appearance={avatar}
        isMoving={movingVisual}
        pose={movingVisual ? 'walk' : 'idle'}
        scale={1.0}
      />
    </group>
  )
}
