import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type {
  AgentEmployee,
  CoastalIntroStage,
  NearbyInteractable,
  PlayerAvatarConfig,
  WorldCreationProp,
} from '@funcionarios/types'
import { STUDIO_ZONES } from '@funcionarios/providers'
import { persistPlayerIslandPosition, playerLiveTransform } from '@plataforma/store/useAgencyStore'
import { coastalAudio } from '../audio/coastalAudio'
import { CoastalCharacterMesh } from '../avatars/CoastalCharacterMesh'
import { COASTAL_STUDIO_LOCATIONS } from './CoastalStudios'
import { resolveIslandCollisions } from './islandColliders'

/** Shared pointer joystick vector driven by CoastalWorldHud drag overlay */
export const virtualJoystick = {
  active: false,
  dx: 0, // -1..1 (right positive)
  dy: 0, // -1..1 (down positive -> forward is negative dy)
}

interface PlayablePlayerControllerProps {
  introStage: CoastalIntroStage
  isCustomizerOpen: boolean
  isPhoneOpen: boolean
  isModalOpen: boolean
  avatar: PlayerAvatarConfig
  agents: AgentEmployee[]
  islandProps: WorldCreationProp[]
  teleportTarget: [number, number, number] | null
  cameraResetTick: number
  onClearTeleport: () => void
  onFirstMove: () => void
  onNearbyChange: (item: NearbyInteractable | null) => void
  onPresenceStep: (pos: [number, number, number], rotY: number, isMoving: boolean) => void
}

/** Computes exact walkable surface elevation across Pier -> Harbor Steps -> Main Island Plaza -> East Beach */
function sampleIslandGroundY(x: number, z: number): number {
  // On the wooden harbor pier or lower timber quay
  if (z >= 15.8) return 0.26
  // Climbing the wide central concrete steps smoothly (z = 15.8 -> 13.5)
  if (z > 13.5 && Math.abs(x) < 2.9) {
    const t = THREE.MathUtils.clamp((15.8 - z) / 2.3, 0, 1)
    return THREE.MathUtils.lerp(0.26, 1.35, t)
  }
  // Eastern sandy beach slope
  if (x > 16.5 && z > 6.5) {
    const t = THREE.MathUtils.clamp((x - 16.5) / 5.5, 0, 1)
    return THREE.MathUtils.lerp(1.35, 0.55, t)
  }
  // Upper coastal town plaza & grass plateau
  return 1.35
}

/** Clamps player neatly inside walkable Pier + Coastal Island bounds so you never walk into deep water */
function clampWalkablePosition(nx: number, nz: number, curX: number, curZ: number): [number, number] {
  // On the wooden pier corridor (z > 15.6)
  if (nz > 15.6) {
    // Only allow entering the pier through the central stairs opening (|x| < 2.15)
    if (Math.abs(curX) <= 2.35 && curZ > 13.2) {
      return [THREE.MathUtils.clamp(nx, -1.85, 1.85), THREE.MathUtils.clamp(nz, 15.5, 25.4)]
    }
    return [curX, Math.min(curZ, 13.4)]
  }
  // Passing through the concrete stairs opening (13.4 <= z <= 15.6)
  if (nz > 13.4) {
    if (Math.abs(nx) <= 2.25) {
      return [nx, nz]
    }
    return [THREE.MathUtils.clamp(nx, -21.5, 21.5), 13.4]
  }
  // Main island rounded bounds
  const rx = THREE.MathUtils.clamp(nx, -21.5, 21.5)
  const rz = THREE.MathUtils.clamp(nz, -15.2, 13.4)
  return [rx, rz]
}

export function PlayablePlayerController({
  introStage,
  isCustomizerOpen,
  isPhoneOpen,
  isModalOpen,
  avatar,
  agents,
  islandProps,
  teleportTarget,
  cameraResetTick,
  onClearTeleport,
  onFirstMove,
  onNearbyChange,
  onPresenceStep,
}: PlayablePlayerControllerProps) {
  const { camera } = useThree()
  const playerGroupRef = useRef<THREE.Group>(null)
  const [movingVisual, setMovingVisual] = useState(false)
  const movingRef = useRef(false)
  const keysRef = useRef<Record<string, boolean>>({})

  // Smooth camera vectors (reused to avoid per-frame allocations)
  const desiredCamPos = useRef(new THREE.Vector3(0.4, 2.3, 51.8))
  const desiredLookAt = useRef(new THREE.Vector3(0.5, 1.8, 30.0))
  const currentLookAt = useRef(new THREE.Vector3(0.5, 1.8, 30.0))
  const nearbyTimerRef = useRef(0)
  const presenceTimerRef = useRef(0)
  const persistTimerRef = useRef(0)
  const bumpCooldownRef = useRef(0)
  const lastNearbyIdRef = useRef<string | null>(null)
  const hasSnappedIntroRef = useRef(false)

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

  // Handle Map Teleportation
  useEffect(() => {
    if (!teleportTarget) return
    const [tx, , tz] = teleportTarget
    playerLiveTransform.x = tx
    playerLiveTransform.z = tz
    playerLiveTransform.y = sampleIslandGroundY(tx, tz)
    playerLiveTransform.rotationY = Math.PI
    persistPlayerIslandPosition(
      playerLiveTransform.x,
      playerLiveTransform.y,
      playerLiveTransform.z,
      playerLiveTransform.rotationY
    )
    if (playerGroupRef.current) {
      playerGroupRef.current.position.set(playerLiveTransform.x, playerLiveTransform.y, playerLiveTransform.z)
      playerGroupRef.current.rotation.y = playerLiveTransform.rotationY
    }
    onClearTeleport()
  }, [teleportTarget, onClearTeleport])

  // Reset player smoothly back to Pier Spawn ONLY when explicitly requested via cameraResetTick
  useEffect(() => {
    if (cameraResetTick === 0) return
    playerLiveTransform.x = 0
    playerLiveTransform.z = 22.8
    playerLiveTransform.y = 0.26
    playerLiveTransform.rotationY = Math.PI
    persistPlayerIslandPosition(0, 0.26, 22.8, Math.PI)
    if (playerGroupRef.current) {
      playerGroupRef.current.position.set(0, 0.26, 22.8)
      playerGroupRef.current.rotation.y = Math.PI
    }
  }, [cameraResetTick])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)

    // 1. INTRO BOAT CAMERA (exact framing of steps/38/media_0.png & steps/49/media_0.png!)
    if (introStage === 'boat') {
      desiredCamPos.current.set(-0.55, 2.05, 53.8)
      desiredLookAt.current.set(0.55, 2.15, 32.0)
      if (!hasSnappedIntroRef.current) {
        camera.position.copy(desiredCamPos.current)
        currentLookAt.current.copy(desiredLookAt.current)
        camera.lookAt(currentLookAt.current)
        hasSnappedIntroRef.current = true
      } else {
        camera.position.lerp(desiredCamPos.current, Math.min(1, dt * 3.5))
        currentLookAt.current.lerp(desiredLookAt.current, Math.min(1, dt * 3.5))
        camera.lookAt(currentLookAt.current)
      }
      return
    }

    if (introStage === 'welcome') {
      // Closer warm dialog shot focused on Nori on the boat bow (1:1 steps/49/media_0.png!)
      desiredCamPos.current.set(1.2, 2.45, 49.4)
      desiredLookAt.current.set(1.35, 1.95, 41.5)
      camera.position.lerp(desiredCamPos.current, Math.min(1, dt * 3.8))
      currentLookAt.current.lerp(desiredLookAt.current, Math.min(1, dt * 3.8))
      camera.lookAt(currentLookAt.current)
      return
    }

    // 2. PLAYER MOVEMENT (WASD / Arrow Keys + Click-and-Drag Virtual Joystick)
    const canMove = !isCustomizerOpen && !isPhoneOpen && !isModalOpen
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

    if (bumpCooldownRef.current > 0) {
      bumpCooldownRef.current = Math.max(0, bumpCooldownRef.current - dt)
    }

    if (isMovingNow) {
      onFirstMove()
      const speed = 7.2 * Math.min(1, mag)
      const dirX = inputX / mag
      const dirZ = inputZ / mag
      const nextX = playerLiveTransform.x + dirX * speed * dt
      const nextZ = playerLiveTransform.z + dirZ * speed * dt
      const [clampedX, clampedZ] = clampWalkablePosition(
        nextX,
        nextZ,
        playerLiveTransform.x,
        playerLiveTransform.z
      )
      const resolved = resolveIslandCollisions(clampedX, clampedZ, 0.46, islandProps)
      const [cx, cz] = clampWalkablePosition(
        resolved.x,
        resolved.z,
        playerLiveTransform.x,
        playerLiveTransform.z
      )

      if (resolved.collided && bumpCooldownRef.current <= 0) {
        bumpCooldownRef.current = 0.42
        coastalAudio.playPop(190, 0.04)
      }

      playerLiveTransform.x = cx
      playerLiveTransform.z = cz
      playerLiveTransform.y = THREE.MathUtils.lerp(
        playerLiveTransform.y,
        sampleIslandGroundY(cx, cz),
        Math.min(1, dt * 14)
      )

      const targetYaw = Math.atan2(dirX, dirZ)
      let diff = targetYaw - playerLiveTransform.rotationY
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      playerLiveTransform.rotationY += diff * Math.min(1, dt * 12)

      persistTimerRef.current += dt
      if (persistTimerRef.current >= 1.2) {
        persistTimerRef.current = 0
        persistPlayerIslandPosition(
          playerLiveTransform.x,
          playerLiveTransform.y,
          playerLiveTransform.z,
          playerLiveTransform.rotationY
        )
      }
    }

    playerLiveTransform.isMoving = isMovingNow
    if (isMovingNow !== movingRef.current) {
      movingRef.current = isMovingNow
      setMovingVisual(isMovingNow)
      if (!isMovingNow) {
        persistPlayerIslandPosition(
          playerLiveTransform.x,
          playerLiveTransform.y,
          playerLiveTransform.z,
          playerLiveTransform.rotationY
        )
      }
      onPresenceStep(
        [playerLiveTransform.x, playerLiveTransform.y, playerLiveTransform.z],
        playerLiveTransform.rotationY,
        isMovingNow
      )
    }

    // Broadcast live Co-CEO footsteps smoothly to partner Co-CEO (~4Hz while moving)
    presenceTimerRef.current += dt
    if (isMovingNow && presenceTimerRef.current >= 0.24) {
      presenceTimerRef.current = 0
      onPresenceStep(
        [playerLiveTransform.x, playerLiveTransform.y, playerLiveTransform.z],
        playerLiveTransform.rotationY,
        true
      )
    }

    if (playerGroupRef.current) {
      playerGroupRef.current.position.set(playerLiveTransform.x, playerLiveTransform.y, playerLiveTransform.z)
      // When customizer opens, gently turn player toward camera so you see the face & accessories clearly!
      const targetRot = isCustomizerOpen ? 0.25 : playerLiveTransform.rotationY
      let rDiff = targetRot - playerGroupRef.current.rotation.y
      while (rDiff > Math.PI) rDiff -= Math.PI * 2
      while (rDiff < -Math.PI) rDiff += Math.PI * 2
      playerGroupRef.current.rotation.y += rDiff * Math.min(1, dt * 10)
    }

    // 3. CAMERA FRAMING (3rd-Person Pier/Island Follow OR 1:1 Customizer Close-Up Portrait!)
    const px = playerLiveTransform.x
    const py = playerLiveTransform.y
    const pz = playerLiveTransform.z

    if (isCustomizerOpen) {
      // Exact 3/4 portrait close-up matching steps/86/media_0.png!
      desiredCamPos.current.set(px + 1.35, py + 1.55, pz + 3.45)
      desiredLookAt.current.set(px, py + 1.02, pz)
    } else {
      // Iconic 3rd-person low-angle coastal follow camera matching steps/62/media_0.png!
      desiredCamPos.current.set(px * 0.96, py + 3.15, pz + 6.4)
      desiredLookAt.current.set(px, py + 1.65, pz - 5.5)
    }

    const camLerp = Math.min(1, dt * (isCustomizerOpen ? 6.5 : 5.2))
    camera.position.lerp(desiredCamPos.current, camLerp)
    currentLookAt.current.lerp(desiredLookAt.current, camLerp)
    camera.lookAt(currentLookAt.current)

    // 4. PROXIMITY DETECTION FOR THE 4 CLICKABLE STUDIOS (AI staff now live inside their studios!)
    nearbyTimerRef.current += dt
    if (nearbyTimerRef.current >= 0.18) {
      nearbyTimerRef.current = 0
      let closest: NearbyInteractable | null = null
      let bestDist = 5.4

      for (const loc of Object.values(COASTAL_STUDIO_LOCATIONS)) {
        const d = Math.hypot(loc.doorPoint[0] - px, loc.doorPoint[2] - pz)
        if (d < bestDist) {
          bestDist = d
          const meta = STUDIO_ZONES[loc.zoneId]
          const residents = agents.filter((a) => a.zone === loc.zoneId)
          const owner = residents[0]
          const residentLabel =
            residents.length > 0
              ? `${residents.map((r) => r.name).join(', ')} lá dentro — clique para entrar`
              : meta.subtitle
          closest = {
            kind: 'studio',
            id: loc.zoneId,
            label: `Entrar · ${loc.zoneId === 'b2b-lab' ? meta.name : owner?.studioTheme.studioName || meta.shortName}`,
            sublabel: residentLabel,
            accentColor: loc.badgeColor,
            zone: loc.zoneId,
          }
        }
      }

      const nextKey = closest ? `${closest.kind}:${closest.id}` : null
      if (nextKey !== lastNearbyIdRef.current) {
        lastNearbyIdRef.current = nextKey
        onNearbyChange(closest)
      }
    }
  })

  // Hide pier player while still riding the intro boat
  if (introStage !== 'playing') return null

  return (
    <group
      ref={playerGroupRef}
      position={[playerLiveTransform.x, playerLiveTransform.y, playerLiveTransform.z]}
      rotation={[0, playerLiveTransform.rotationY, 0]}
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
