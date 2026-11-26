import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei'
import { OrthographicCamera as ThreeOrthoCamera, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { ROOM_SCALES } from '@funcionarios/providers'
import type { RoomScaleId } from '@funcionarios/types'
import { useAgencyStore } from '@plataforma/store/useAgencyStore'
import { createCoastalSkyMaterial, getSkyPalette } from './shaders/coastalShaders'
import { FloatingLights } from './effects/FloatingLights'
import { CoastalBlequiIsland } from './island/CoastalBlequiIsland'
import { CoastalStudioInterior } from './zones/CoastalStudioInterior'
import { WalkableStudioController } from './zones/WalkableStudioController'
import { Workstation } from './workstations/Workstation'
import { StudioResidentAgent } from './avatars/StudioResidentAgent'
import { PartnerCeoWalkers } from './avatars/PartnerCeoWalkers'
import { WorldCreations } from './props/WorldCreations'

const ISO_DIRECTION = new Vector3(1, 0.78, 1).normalize()

function computeFitZoom(viewportW: number, viewportH: number, extentSize: number, wallHeight: number) {
  const usableW = viewportW - 64
  const usableH = viewportH - 150
  const projW = extentSize * 1.48 + 1.8
  const projH = extentSize * 0.92 + wallHeight * 1.05 + 1.4
  const zoomX = usableW / projW
  const zoomY = usableH / projH
  return Math.max(12, Math.min(82, Math.min(zoomX, zoomY) * 0.94))
}

/** Coastal World inspired adaptive FPS guardian keeping both Co-CEO PCs locked smoothly at 60 FPS */
function AdaptivePerformanceGuardian({ onFpsSample }: { onFpsSample: (fps: number) => void }) {
  const { gl } = useThree()
  const framesRef = useRef(0)
  const accTimeRef = useRef(0)
  const currentDprRef = useRef(Math.min(window.devicePixelRatio || 1, 1.35))

  useFrame((_, delta) => {
    framesRef.current += 1
    accTimeRef.current += delta
    if (accTimeRef.current >= 1.5) {
      const fps = Math.round(framesRef.current / accTimeRef.current)
      onFpsSample(Math.min(120, Math.max(1, fps)))
      const maxDpr = Math.min(window.devicePixelRatio || 1.25, 1.5)
      if (fps < 42 && currentDprRef.current > 0.85) {
        currentDprRef.current = Math.max(0.85, Number((currentDprRef.current - 0.15).toFixed(2)))
        gl.setPixelRatio(currentDprRef.current)
      } else if (fps >= 56 && currentDprRef.current < maxDpr) {
        currentDprRef.current = Math.min(maxDpr, Number((currentDprRef.current + 0.1).toFixed(2)))
        gl.setPixelRatio(currentDprRef.current)
      }
      framesRef.current = 0
      accTimeRef.current = 0
    }
  })

  return null
}

function StudioIsometricRig({
  roomScale,
  cameraResetTick,
  controlsRef,
}: {
  roomScale: RoomScaleId
  cameraResetTick: number
  controlsRef: React.RefObject<OrbitControlsImpl | null>
}) {
  const { camera, size } = useThree()

  useEffect(() => {
    const meta = ROOM_SCALES[roomScale]
    const distance = Math.max(46, meta.size * 2.15)
    const look = new Vector3(0, meta.wallHeight * 0.44, 0)
    const pos = ISO_DIRECTION.clone().multiplyScalar(distance).add(look)
    camera.position.copy(pos)
    if (camera instanceof ThreeOrthoCamera) {
      camera.zoom = computeFitZoom(size.width, size.height, meta.size, meta.wallHeight)
      camera.updateProjectionMatrix()
    }
    if (controlsRef.current) {
      controlsRef.current.target.copy(look)
      controlsRef.current.update()
    }
  }, [roomScale, cameraResetTick, size.width, size.height, camera, controlsRef])

  return null
}

function SceneContent({ onFpsSample }: { onFpsSample: (fps: number) => void }) {
  const worldView = useAgencyStore((s) => s.worldView)
  const activeStudioZone = useAgencyStore((s) => s.activeStudioZone)
  const studioCameraMode = useAgencyStore((s) => s.studioCameraMode)
  const timeOfDay = useAgencyStore((s) => s.timeOfDay)
  const roomScale = useAgencyStore((s) => s.roomScale)
  const showFloorGrid = useAgencyStore((s) => s.showFloorGrid)
  const introStage = useAgencyStore((s) => s.introStage)
  const isCustomizerOpen = useAgencyStore((s) => s.isCustomizerOpen)
  const isPhoneOpen = useAgencyStore((s) => s.isPhoneOpen)
  const isSettingsOpen = useAgencyStore((s) => s.isSettingsOpen)
  const isCreateModalOpen = useAgencyStore((s) => s.isCreateModalOpen)
  const isCeoLoginOpen = useAgencyStore((s) => s.isCeoLoginOpen)
  const isStudioPickerOpen = useAgencyStore((s) => s.isStudioPickerOpen)
  const playerAvatar = useAgencyStore((s) => s.playerAvatar)
  const teleportTarget = useAgencyStore((s) => s.teleportTarget)
  const cameraResetTick = useAgencyStore((s) => s.cameraResetTick)
  const agents = useAgencyStore((s) => s.agents)
  const props = useAgencyStore((s) => s.props)
  const selectedAgentId = useAgencyStore((s) => s.selectedAgentId)

  const selectAgent = useAgencyStore((s) => s.selectAgent)
  const enterStudioZone = useAgencyStore((s) => s.enterStudioZone)
  const returnToIsland = useAgencyStore((s) => s.returnToIsland)
  const clearTeleportTarget = useAgencyStore((s) => s.clearTeleportTarget)
  const markPlayerMoved = useAgencyStore((s) => s.markPlayerMoved)
  const setNearbyInteractable = useAgencyStore((s) => s.setNearbyInteractable)
  const broadcastCeoMove = useAgencyStore((s) => s.broadcastCeoMove)

  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const isIsland = worldView === 'island'
  const sky = getSkyPalette(timeOfDay)

  // Luminous Coastal Sky Dome shared with walkable Studio Interiors
  const studioSkyMat = useMemo(() => createCoastalSkyMaterial('daylight'), [])
  useEffect(() => {
    const pal = getSkyPalette(timeOfDay)
    studioSkyMat.uniforms.uZenith.value.copy(pal.zenith)
    studioSkyMat.uniforms.uMid.value.copy(pal.mid)
    studioSkyMat.uniforms.uHorizon.value.copy(pal.horizon)
  }, [timeOfDay, studioSkyMat])
  useEffect(() => () => studioSkyMat.dispose(), [studioSkyMat])

  const roomSize = ROOM_SCALES[roomScale].size
  const studioAgents = agents.filter((a) => a.zone === activeStudioZone)
  const studioProps = props.filter((p) => p.placement === 'studio' && p.zone === activeStudioZone)
  const studioOwner = studioAgents[0]

  const isModalOpen =
    isSettingsOpen ||
    isCreateModalOpen ||
    isCeoLoginOpen ||
    isStudioPickerOpen ||
    Boolean(selectedAgentId)
  const useWalkPerspectiveInStudio = studioCameraMode === 'walk' || isCustomizerOpen

  return (
    <>
      {isIsland ? (
        <>
          <PerspectiveCamera makeDefault fov={42} near={0.2} far={380} position={[-0.55, 2.05, 53.8]} />
          <color attach="background" args={[sky.fog]} />
          <fog attach="fog" args={[sky.fog, 46, 170]} />

          {/* Strictly 1 shadow-casting directionalLight (Vex 60 FPS standard) */}
          <ambientLight intensity={sky.ambientIntensity} color="#ffffff" />
          <hemisphereLight args={[sky.hemiSky, sky.hemiGround, sky.hemiIntensity]} />
          <directionalLight
            position={[28, 42, 26]}
            intensity={sky.sunIntensity}
            color={sky.sunColor}
            castShadow
            shadow-mapSize={[1536, 1536]}
            shadow-camera-left={-34}
            shadow-camera-right={34}
            shadow-camera-top={34}
            shadow-camera-bottom={-34}
            shadow-camera-near={2}
            shadow-camera-far={120}
            shadow-bias={-0.0004}
            shadow-normalBias={0.035}
          />
          <directionalLight position={[-24, 18, -16]} intensity={0.42} color="#bfe8ff" />

          {/* Luzes decorativas flutuando sobre a ilha (precisa estar dentro do Canvas) */}
          <FloatingLights />

          <CoastalBlequiIsland
            agents={agents}
            propsList={props}
            timeOfDay={timeOfDay}
            introStage={introStage}
            isCustomizerOpen={isCustomizerOpen}
            isPhoneOpen={isPhoneOpen}
            isModalOpen={isModalOpen}
            playerAvatar={playerAvatar}
            teleportTarget={teleportTarget}
            cameraResetTick={cameraResetTick}
            onClearTeleport={clearTeleportTarget}
            onFirstMove={markPlayerMoved}
            onNearbyChange={setNearbyInteractable}
            onPresenceStep={broadcastCeoMove}
            onSelectAgent={(id) => selectAgent(id)}
            onEnterStudio={(zone) => enterStudioZone(zone)}
          />
        </>
      ) : (
        <>
          {useWalkPerspectiveInStudio ? (
            <PerspectiveCamera makeDefault fov={42} near={0.2} far={260} position={[0, 3.4, roomSize / 2 + 4]} />
          ) : (
            <OrthographicCamera makeDefault position={[44, 34, 44]} zoom={28} near={-160} far={360} />
          )}

          <color attach="background" args={[sky.fog]} />

          {/* Bright Coastal Sky Backdrop visible over open balcony walls */}
          <mesh material={studioSkyMat}>
            <sphereGeometry args={[180, 24, 16]} />
          </mesh>

          <ambientLight intensity={0.62} color="#ffffff" />
          <hemisphereLight args={[sky.hemiSky, '#f0d8b8', 1.05]} />
          <directionalLight
            position={[18, 28, 16]}
            intensity={1.55}
            color="#fffdf4"
            castShadow
            shadow-mapSize={[1536, 1536]}
            shadow-camera-left={-22}
            shadow-camera-right={22}
            shadow-camera-top={22}
            shadow-camera-bottom={-22}
            shadow-camera-near={1}
            shadow-camera-far={95}
            shadow-bias={-0.0003}
            shadow-normalBias={0.03}
          />
          <directionalLight position={[-16, 14, 14]} intensity={0.45} color="#d4f0ff" />

          <group>
            {/* Bespoke Sunlit Coastal World Studio Architecture per Specialist */}
            <CoastalStudioInterior
              zone={activeStudioZone}
              roomScale={roomScale}
              showFloorGrid={showFloorGrid}
              studioTheme={studioOwner?.studioTheme}
              onExitToIsland={() => returnToIsland()}
            />

            {/* Pastel Workstations & Living Coastal World Resident AI Staff */}
            {studioAgents.map((agent, idx) => (
              <group key={agent.id}>
                <Workstation
                  position={agent.deskPosition}
                  rotationY={agent.deskRotationY}
                  accentColor={agent.accentColor}
                  status={agent.status}
                  isSelected={selectedAgentId === agent.id}
                  onSelect={() => selectAgent(agent.id)}
                />
                <StudioResidentAgent
                  agent={agent}
                  index={idx}
                  roomSize={roomSize}
                  isSelected={selectedAgentId === agent.id}
                  showLabel={!isCustomizerOpen}
                  onSelect={() => selectAgent(agent.id)}
                />
              </group>
            ))}

            {/* Modular 3D Props Self-Built by Resident Employees */}
            <WorldCreations
              propsList={studioProps}
              onSelectProp={(prop) => selectAgent(prop.createdByAgentId)}
            />

            {/* Partner Co-CEO walking inside the same studio in real time */}
            <PartnerCeoWalkers view="studio" activeZone={activeStudioZone} />

            {/* Playable Co-CEO Avatar + 3rd-Person Walk + Customizer + Proximity Controller */}
            <WalkableStudioController
              zone={activeStudioZone}
              roomSize={roomSize}
              cameraMode={studioCameraMode}
              isCustomizerOpen={isCustomizerOpen}
              isPhoneOpen={isPhoneOpen}
              isModalOpen={isModalOpen}
              avatar={playerAvatar}
              studioAgents={studioAgents}
              studioProps={studioProps}
              onFirstMove={markPlayerMoved}
              onNearbyChange={setNearbyInteractable}
              onBroadcastMove={broadcastCeoMove}
            />
          </group>

          {!useWalkPerspectiveInStudio && (
            <>
              <OrbitControls
                ref={controlsRef}
                makeDefault
                enableDamping
                dampingFactor={0.08}
                enablePan
                enableZoom
                minZoom={10}
                maxZoom={95}
                minAzimuthAngle={0.12}
                maxAzimuthAngle={Math.PI / 2 - 0.12}
                minPolarAngle={0.38}
                maxPolarAngle={Math.PI / 2 - 0.14}
              />
              <StudioIsometricRig
                roomScale={roomScale}
                cameraResetTick={cameraResetTick}
                controlsRef={controlsRef}
              />
            </>
          )}
        </>
      )}

      <AdaptivePerformanceGuardian onFpsSample={onFpsSample} />
    </>
  )
}

export function StudioScene() {
  const selectAgent = useAgencyStore((s) => s.selectAgent)
  const setLiveFps = useAgencyStore((s) => s.setLiveFps)

  return (
    <div className="h-full w-full">
      <Canvas
        shadows="percentage"
        dpr={[1, 1.35]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onPointerMissed={() => selectAgent(null)}
      >
        <SceneContent onFpsSample={setLiveFps} />
      </Canvas>
    </div>
  )
}
