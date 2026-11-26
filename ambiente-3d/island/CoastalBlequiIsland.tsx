import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type {
  AgentEmployee,
  CoastalIntroStage,
  NearbyInteractable,
  PlayerAvatarConfig,
  StudioZoneId,
  WorldCreationProp,
  WorldTimeOfDay,
} from '@funcionarios/types'
import {
  createCoastalOceanMaterial,
  createCoastalSkyMaterial,
  getSkyPalette,
} from '../shaders/coastalShaders'
import { PartnerCeoWalkers } from '../avatars/PartnerCeoWalkers'
import { WorldCreations } from '../props/WorldCreations'
import { CoastalWorldProps } from './CoastalWorldProps'
import { CoastalStudios } from './CoastalStudios'
import { CoastalBoatIntro } from './CoastalBoatIntro'
import { PlayablePlayerController } from './PlayablePlayerController'

interface CoastalBlequiIslandProps {
  agents: AgentEmployee[]
  propsList: WorldCreationProp[]
  timeOfDay: WorldTimeOfDay
  introStage: CoastalIntroStage
  isCustomizerOpen: boolean
  isPhoneOpen: boolean
  isModalOpen: boolean
  playerAvatar: PlayerAvatarConfig
  teleportTarget: [number, number, number] | null
  cameraResetTick: number
  onClearTeleport: () => void
  onFirstMove: () => void
  onNearbyChange: (item: NearbyInteractable | null) => void
  onPresenceStep: (pos: [number, number, number], rotY: number, isMoving: boolean) => void
  onSelectAgent: (agentId: string) => void
  onEnterStudio: (zone: StudioZoneId) => void
}

/**
 * Ilha Blequi exterior — reserved exclusively for the 2 Co-CEOs walking together,
 * while all AI specialists live & work inside their bespoke Coastal World studios.
 */
export function CoastalBlequiIsland({
  agents,
  propsList,
  timeOfDay,
  introStage,
  isCustomizerOpen,
  isPhoneOpen,
  isModalOpen,
  playerAvatar,
  teleportTarget,
  cameraResetTick,
  onClearTeleport,
  onFirstMove,
  onNearbyChange,
  onPresenceStep,
  onSelectAgent,
  onEnterStudio,
}: CoastalBlequiIslandProps) {
  const skyMat = useMemo(() => createCoastalSkyMaterial('daylight'), [])
  const oceanMat = useMemo(() => createCoastalOceanMaterial('daylight'), [])
  const oceanRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    const pal = getSkyPalette(timeOfDay)
    skyMat.uniforms.uZenith.value.copy(pal.zenith)
    skyMat.uniforms.uMid.value.copy(pal.mid)
    skyMat.uniforms.uHorizon.value.copy(pal.horizon)
    oceanMat.uniforms.uWaterDeep.value.copy(pal.waterDeep)
    oceanMat.uniforms.uWaterShallow.value.copy(pal.waterShallow)
    oceanMat.uniforms.uFoamColor.value.copy(pal.foamColor)
    oceanMat.uniforms.uHorizonColor.value.set(pal.fog)
  }, [timeOfDay, skyMat, oceanMat])

  useEffect(() => {
    return () => {
      skyMat.dispose()
      oceanMat.dispose()
    }
  }, [skyMat, oceanMat])

  useFrame(({ clock }) => {
    oceanMat.uniforms.uTime.value = clock.elapsedTime
  })

  const propCounts = useMemo(() => {
    const counts: Record<StudioZoneId, number> = {
      criacao: 0,
      engenharia: 0,
      'pixel-perfect': 0,
      'b2b-lab': 0,
      editorial: 0,
    }
    for (const p of propsList) {
      counts[p.zone] = (counts[p.zone] || 0) + 1
    }
    return counts
  }, [propsList])

  const islandProps = useMemo(
    () => propsList.filter((p) => p.placement === 'island'),
    [propsList]
  )

  return (
    <group>
      {/* 1:1 Coastal World Sky Gradient Dome */}
      <mesh material={skyMat}>
        <sphereGeometry args={[210, 28, 18]} />
      </mesh>

      {/* 1:1 Animated Stylized Turquoise Ocean with Shoreline Foam Outline */}
      <mesh ref={oceanRef} position={[0, -0.55, 10]} rotation={[-Math.PI / 2, 0, 0]} material={oceanMat}>
        <planeGeometry args={[380, 380, 64, 64]} />
      </mesh>

      {/* Complete Coastal World Island, Pier, Sailboats, Seawall, Lighthouses & Instanced Vegetation */}
      <CoastalWorldProps timeOfDay={timeOfDay} />

      {/* 4 Interactive Clickable Blequi Studios + Scenic Coastal Town Architecture */}
      <CoastalStudios
        agents={agents}
        propCounts={propCounts}
        timeOfDay={timeOfDay}
        showLabels={introStage === 'playing' && !isCustomizerOpen}
        onEnterStudio={onEnterStudio}
      />

      {/* Intro Yellow Motorboat & Distant Fishing Boat in the Foreground Bay */}
      <CoastalBoatIntro introStage={introStage} />

      {/* Dynamic 3D Props Built on the Island Plaza by Blequi AI Agents */}
      <group position={[0, 1.35, 3.4]}>
        <WorldCreations
          propsList={islandProps}
          onSelectProp={(prop) => onSelectAgent(prop.createdByAgentId)}
        />
      </group>

      {/* Partner Co-CEO (your friend!) walking live on the island with you */}
      {introStage === 'playing' && <PartnerCeoWalkers view="island" />}

      {/* Your Playable Co-CEO Character + 3rd-Person Follow / Boat Intro / Customizer Camera Rig */}
      <PlayablePlayerController
        introStage={introStage}
        isCustomizerOpen={isCustomizerOpen}
        isPhoneOpen={isPhoneOpen}
        isModalOpen={isModalOpen}
        avatar={playerAvatar}
        agents={agents}
        teleportTarget={teleportTarget}
        cameraResetTick={cameraResetTick}
        onClearTeleport={onClearTeleport}
        onFirstMove={onFirstMove}
        onNearbyChange={onNearbyChange}
        onPresenceStep={onPresenceStep}
      />
    </group>
  )
}
