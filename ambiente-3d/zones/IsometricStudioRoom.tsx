import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Grid } from '@react-three/drei'
import { ROOM_SCALES, STUDIO_ZONES } from '@funcionarios/providers'
import type { RoomScaleId } from '@funcionarios/types'
import { createStudioTextures } from '../textures/studioTextures'

interface IsometricStudioRoomProps {
  roomScale: RoomScaleId
  showFloorGrid: boolean
}

function createRoundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape()
  const x = -width / 2
  const y = -height / 2
  const r = Math.min(radius, width / 2, height / 2)

  shape.moveTo(x + r, y)
  shape.lineTo(x + width - r, y)
  shape.quadraticCurveTo(x + width, y, x + width, y + r)
  shape.lineTo(x + width, y + height - r)
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  shape.lineTo(x + r, y + height)
  shape.quadraticCurveTo(x, y + height, x, y + height - r)
  shape.lineTo(x, y + r)
  shape.quadraticCurveTo(x, y, x + r, y)
  return shape
}

/** Creates a rounded rectangle ShapeGeometry with normalized [0, 1] UVs */
function createNormalizedRoundedPlane(
  width: number,
  height: number,
  radius: number
): THREE.ShapeGeometry {
  const shape = createRoundedRectShape(width, height, radius)
  const geom = new THREE.ShapeGeometry(shape, 14)
  const pos = geom.attributes.position
  const uv = new Float32Array(pos.count * 2)

  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i)
    const py = pos.getY(i)
    uv[i * 2] = (px + width / 2) / width
    uv[i * 2 + 1] = (py + height / 2) / height
  }
  geom.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return geom
}

function RoundedWallScreen({
  width,
  height,
  position,
  rotation,
  texture,
}: {
  width: number
  height: number
  position: [number, number, number]
  rotation: [number, number, number]
  texture: THREE.CanvasTexture
}) {
  const { frameGeom, screenGeom, shadowGeom } = useMemo(() => {
    const outerShape = createRoundedRectShape(width + 0.16, height + 0.16, 0.24)
    const fGeom = new THREE.ExtrudeGeometry(outerShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.018,
      bevelSegments: 3,
      curveSegments: 14,
    })
    const sGeom = createNormalizedRoundedPlane(width, height, 0.18)
    const shGeom = createNormalizedRoundedPlane(width + 0.34, height + 0.34, 0.3)
    return { frameGeom: fGeom, screenGeom: sGeom, shadowGeom: shGeom }
  }, [width, height])

  useEffect(() => {
    return () => {
      frameGeom.dispose()
      screenGeom.dispose()
      shadowGeom.dispose()
    }
  }, [frameGeom, screenGeom, shadowGeom])

  return (
    <group position={position} rotation={rotation}>
      {/* Soft baked-feel wall shadow behind screen */}
      <mesh geometry={shadowGeom} position={[0, -0.04, -0.015]}>
        <meshBasicMaterial color="#101521" transparent opacity={0.22} depthWrite={false} />
      </mesh>

      {/* Matte-black rounded aluminum bezel */}
      <mesh geometry={frameGeom} castShadow receiveShadow>
        <meshStandardMaterial color="#171a22" roughness={0.38} metalness={0.55} />
      </mesh>

      {/* Crisp luminous screen surface */}
      <mesh geometry={screenGeom} position={[0, 0, 0.102]}>
        <meshStandardMaterial
          map={texture}
          emissiveMap={texture}
          emissive="#ffffff"
          emissiveIntensity={0.22}
          roughness={0.28}
          metalness={0.04}
        />
      </mesh>
    </group>
  )
}

function FramedArtwork({
  width,
  height,
  position,
  rotation,
  texture,
}: {
  width: number
  height: number
  position: [number, number, number]
  rotation: [number, number, number]
  texture: THREE.CanvasTexture
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Wall drop shadow */}
      <mesh position={[0, -0.03, -0.005]}>
        <planeGeometry args={[width + 0.14, height + 0.14]} />
        <meshBasicMaterial color="#101521" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      {/* Slim matte black frame */}
      <mesh castShadow receiveShadow position={[0, 0, 0.03]}>
        <boxGeometry args={[width + 0.1, height + 0.1, 0.06]} />
        <meshStandardMaterial color="#161922" roughness={0.42} metalness={0.45} />
      </mesh>
      {/* Art print canvas */}
      <mesh position={[0, 0, 0.063]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={texture} roughness={0.78} metalness={0.02} />
      </mesh>
    </group>
  )
}

/**
 * Instanced ceiling track spotlights along both L-walls.
 * Scales seamlessly from compact (8 lights) to giant (24 lights) in only 3 draw calls.
 */
function CeilingTrackLights({
  roomSize,
  wallHeight,
}: {
  roomSize: number
  wallHeight: number
}) {
  const half = roomSize / 2
  const railY = wallHeight - 0.12
  const railOffset = 0.72
  const lightsPerWall = Math.max(4, Math.min(12, Math.round(roomSize / 3.2)))
  const totalLights = lightsPerWall * 2

  const stemRef = useRef<THREE.InstancedMesh>(null)
  const housingRef = useRef<THREE.InstancedMesh>(null)
  const lensRef = useRef<THREE.InstancedMesh>(null)

  useEffect(() => {
    if (!stemRef.current || !housingRef.current || !lensRef.current) return

    const dummy = new THREE.Object3D()
    let idx = 0

    // Lights along left wall (x = -half + railOffset, z from -half+1.2 to +half-1.2)
    for (let i = 0; i < lightsPerWall; i++) {
      const t = (i + 0.5) / lightsPerWall
      const z = -half + 1.1 + t * (roomSize - 2.2)
      const x = -half + railOffset

      // Vertical hanging rod
      dummy.position.set(x, railY - 0.19, z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      stemRef.current.setMatrixAt(idx, dummy.matrix)

      // Angled spotlight housing pointing subtly toward screen & room floor
      dummy.position.set(x + 0.04, railY - 0.44, z)
      dummy.rotation.set(0, 0, 0.28)
      dummy.updateMatrix()
      housingRef.current.setMatrixAt(idx, dummy.matrix)

      // Glowing bulb tucked inside mouth of spotlight can
      dummy.position.set(x + 0.08, railY - 0.55, z)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      lensRef.current.setMatrixAt(idx, dummy.matrix)

      idx++
    }

    // Lights along right wall (z = -half + railOffset, x from -half+1.2 to +half-1.2)
    for (let i = 0; i < lightsPerWall; i++) {
      const t = (i + 0.5) / lightsPerWall
      const x = -half + 1.1 + t * (roomSize - 2.2)
      const z = -half + railOffset

      dummy.position.set(x, railY - 0.19, z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      stemRef.current.setMatrixAt(idx, dummy.matrix)

      dummy.position.set(x, railY - 0.44, z + 0.04)
      dummy.rotation.set(-0.28, 0, 0)
      dummy.updateMatrix()
      housingRef.current.setMatrixAt(idx, dummy.matrix)

      dummy.position.set(x, railY - 0.55, z + 0.08)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      lensRef.current.setMatrixAt(idx, dummy.matrix)

      idx++
    }

    stemRef.current.instanceMatrix.needsUpdate = true
    housingRef.current.instanceMatrix.needsUpdate = true
    lensRef.current.instanceMatrix.needsUpdate = true
  }, [half, lightsPerWall, railY, roomSize])

  return (
    <group>
      {/* Left track rail */}
      <mesh position={[-half + railOffset, railY, 0]}>
        <boxGeometry args={[0.07, 0.06, roomSize - 0.4]} />
        <meshStandardMaterial color="#151923" roughness={0.35} metalness={0.7} />
      </mesh>
      {/* Right track rail */}
      <mesh position={[0, railY, -half + railOffset]}>
        <boxGeometry args={[roomSize - 0.4, 0.06, 0.07]} />
        <meshStandardMaterial color="#151923" roughness={0.35} metalness={0.7} />
      </mesh>

      {/* Secondary angled architectural strut rails matching print1 outer corners */}
      <mesh position={[-half + 1.55, railY + 0.02, half - 1.5]} rotation={[0, -0.45, 0]}>
        <boxGeometry args={[0.05, 0.04, 3.2]} />
        <meshStandardMaterial color="#151923" roughness={0.4} metalness={0.65} />
      </mesh>
      <mesh position={[half - 1.5, railY + 0.02, -half + 1.55]} rotation={[0, Math.PI / 2 + 0.45, 0]}>
        <boxGeometry args={[0.05, 0.04, 3.2]} />
        <meshStandardMaterial color="#151923" roughness={0.4} metalness={0.65} />
      </mesh>

      {/* Instanced spotlight stems */}
      <instancedMesh
        key={`stems-${totalLights}`}
        ref={stemRef}
        args={[undefined, undefined, totalLights]}
      >
        <cylinderGeometry args={[0.014, 0.014, 0.38, 8]} />
        <meshStandardMaterial color="#151822" roughness={0.35} metalness={0.75} />
      </instancedMesh>

      {/* Instanced spotlight cylindrical housings */}
      <instancedMesh
        key={`housings-${totalLights}`}
        ref={housingRef}
        args={[undefined, undefined, totalLights]}
      >
        <cylinderGeometry args={[0.085, 0.115, 0.28, 16]} />
        <meshStandardMaterial color="#141821" roughness={0.32} metalness={0.65} />
      </instancedMesh>

      {/* Instanced warm emissive spotlight bulbs */}
      <instancedMesh
        key={`lenses-${totalLights}`}
        ref={lensRef}
        args={[undefined, undefined, totalLights]}
      >
        <sphereGeometry args={[0.058, 10, 8]} />
        <meshBasicMaterial color="#fff4d4" />
      </instancedMesh>
    </group>
  )
}

/**
 * Subtle architectural acoustic wood slats placed along extended walls
 * when the room expands to Grande / Gigante scale, keeping the room cohesive.
 */
function ExpandedWingPanels({
  roomSize,
  wallHeight,
  screenEndOffset,
}: {
  roomSize: number
  wallHeight: number
  screenEndOffset: number
}) {
  const half = roomSize / 2
  const panelHeight = wallHeight * 0.68
  const startCoord = -half + screenEndOffset + 1.4
  const endCoord = half - 3.6
  const span = Math.max(0, endCoord - startCoord)
  const slatCount = roomSize >= 22 && span >= 3 ? Math.min(28, Math.floor(span / 0.55)) : 0

  const leftRef = useRef<THREE.InstancedMesh>(null)
  const rightRef = useRef<THREE.InstancedMesh>(null)

  useEffect(() => {
    if (slatCount <= 0) return
    const dummy = new THREE.Object3D()
    for (let i = 0; i < slatCount; i++) {
      const t = (i + 0.5) / slatCount
      const pos = startCoord + t * span

      if (leftRef.current) {
        dummy.position.set(-half + 0.04, wallHeight * 0.46, pos)
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        leftRef.current.setMatrixAt(i, dummy.matrix)
      }

      if (rightRef.current) {
        dummy.position.set(pos, wallHeight * 0.46, -half + 0.04)
        dummy.rotation.set(0, Math.PI / 2, 0)
        dummy.updateMatrix()
        rightRef.current.setMatrixAt(i, dummy.matrix)
      }
    }
    if (leftRef.current) leftRef.current.instanceMatrix.needsUpdate = true
    if (rightRef.current) rightRef.current.instanceMatrix.needsUpdate = true
  }, [half, slatCount, span, startCoord, wallHeight])

  if (slatCount <= 0) return null

  return (
    <group>
      <instancedMesh
        key={`slats-l-${slatCount}-${roomSize}`}
        ref={leftRef}
        args={[undefined, undefined, slatCount]}
        receiveShadow
      >
        <boxGeometry args={[0.05, panelHeight, 0.14]} />
        <meshStandardMaterial color="#8f5c35" roughness={0.65} metalness={0.05} />
      </instancedMesh>
      <instancedMesh
        key={`slats-r-${slatCount}-${roomSize}`}
        ref={rightRef}
        args={[undefined, undefined, slatCount]}
        receiveShadow
      >
        <boxGeometry args={[0.05, panelHeight, 0.14]} />
        <meshStandardMaterial color="#8f5c35" roughness={0.65} metalness={0.05} />
      </instancedMesh>
    </group>
  )
}

export function IsometricStudioRoom({
  roomScale,
  showFloorGrid,
}: IsometricStudioRoomProps) {
  const scaleMeta = ROOM_SCALES[roomScale]
  const roomSize = scaleMeta.size
  const wallHeight = scaleMeta.wallHeight
  const half = roomSize / 2
  const wallThick = 0.38

  const textures = useMemo(() => createStudioTextures(), [])

  // Keep wood plank width physically constant as the room scales from 12m to 42m
  useEffect(() => {
    const tiles = roomSize / 4.2
    textures.woodColor.repeat.set(tiles, tiles)
    textures.woodRoughness.repeat.set(tiles, tiles)
    textures.woodColor.needsUpdate = true
    textures.woodRoughness.needsUpdate = true
  }, [roomSize, textures])

  useEffect(() => {
    return () => textures.dispose()
  }, [textures])

  // Proportions matching print1's twin corner mega-screens + flanking framed artworks
  const screenW = Math.min(roomSize * 0.62, 11.4)
  const screenH = Math.min(wallHeight * 0.56, 4.15)
  const screenCenterY = wallHeight * 0.465
  const cornerGap = 0.36
  const screenCenterCoord = -half + cornerGap + screenW / 2
  const screenEndOffset = cornerGap + screenW

  const artW = Math.min(2.1, Math.max(1.55, roomSize * 0.14))
  const artH = artW * 1.18
  const artCoord = half - artW / 2 - Math.min(1.15, roomSize * 0.08)

  const zones = useMemo(() => Object.values(STUDIO_ZONES), [])

  return (
    <group>
      {/* Dark architectural diorama plinth underneath hardwood floor */}
      <mesh position={[0, -0.32, 0]} receiveShadow>
        <boxGeometry args={[roomSize + wallThick * 2 + 0.18, 0.34, roomSize + wallThick * 2 + 0.18]} />
        <meshStandardMaterial color="#1a1f2c" roughness={0.78} metalness={0.22} />
      </mesh>

      {/* Subtle dark trim edge sitting cleanly below wood top surface (zero Z-fighting) */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[roomSize + 0.18, 0.14, roomSize + 0.18]} />
        <meshStandardMaterial color="#252a38" roughness={0.65} metalness={0.25} />
      </mesh>

      {/* Warm honey-oak hardwood plank floor (top flush at y = 0) */}
      <mesh position={[0, -0.025, 0]} receiveShadow>
        <boxGeometry args={[roomSize, 0.05, roomSize]} />
        <meshStandardMaterial
          map={textures.woodColor}
          roughnessMap={textures.woodRoughness}
          roughness={0.54}
          metalness={0.04}
        />
      </mesh>

      {/* Back-Left Wall (x = -half) */}
      <mesh
        position={[-half - wallThick / 2, wallHeight / 2 - 0.04, -wallThick / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[wallThick, wallHeight + 0.08, roomSize + wallThick]} />
        <meshStandardMaterial
          map={textures.wallPlaster}
          color="#d2d7e2"
          roughness={0.86}
          metalness={0.02}
        />
      </mesh>

      {/* Back-Right Wall (z = -half) */}
      <mesh
        position={[0, wallHeight / 2 - 0.04, -half - wallThick / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[roomSize, wallHeight + 0.08, wallThick]} />
        <meshStandardMaterial
          map={textures.wallPlaster}
          color="#c5cbd8"
          roughness={0.86}
          metalness={0.02}
        />
      </mesh>

      {/* Recessed architectural baseboards where walls meet the oak floor */}
      <mesh position={[-half + 0.015, 0.055, 0]}>
        <boxGeometry args={[0.03, 0.11, roomSize]} />
        <meshStandardMaterial color="#353b4a" roughness={0.65} metalness={0.18} />
      </mesh>
      <mesh position={[0, 0.055, -half + 0.015]}>
        <boxGeometry args={[roomSize, 0.11, 0.03]} />
        <meshStandardMaterial color="#353b4a" roughness={0.65} metalness={0.18} />
      </mesh>

      {/* Baked-feel soft contact ambient occlusion strips along wall-floor crease */}
      <mesh position={[-half + 0.32, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.64, roomSize]} />
        <meshBasicMaterial color="#2a1608" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.004, -half + 0.32]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roomSize, 0.64]} />
        <meshBasicMaterial color="#2a1608" transparent opacity={0.16} depthWrite={false} />
      </mesh>

      {/* Subtle inner vertical corner crease accent */}
      <mesh position={[-half + 0.012, wallHeight / 2, -half + 0.012]}>
        <boxGeometry args={[0.024, wallHeight, 0.024]} />
        <meshStandardMaterial color="#878e9e" roughness={0.95} />
      </mesh>

      {/* Dark architectural ceiling overhang / soffit capping both walls (matches print1 top dark fascia) */}
      <mesh position={[-half + 0.42, wallHeight + 0.14, -wallThick / 2]} castShadow>
        <boxGeometry args={[1.65, 0.28, roomSize + wallThick + 0.04]} />
        <meshStandardMaterial color="#1b2130" roughness={0.78} metalness={0.22} />
      </mesh>
      <mesh position={[0.42, wallHeight + 0.14, -half + 0.42]} castShadow>
        <boxGeometry args={[roomSize - 0.84, 0.28, 1.65]} />
        <meshStandardMaterial color="#1b2130" roughness={0.78} metalness={0.22} />
      </mesh>

      {/* Instanced track lighting rails & hanging spotlights */}
      <CeilingTrackLights roomSize={roomSize} wallHeight={wallHeight} />

      {/* Twin Corner Mega-Screens (Left Wall + Right Wall) */}
      <RoundedWallScreen
        width={screenW}
        height={screenH}
        position={[-half + 0.02, screenCenterY, screenCenterCoord]}
        rotation={[0, Math.PI / 2, 0]}
        texture={textures.leftScreen}
      />
      <RoundedWallScreen
        width={screenW}
        height={screenH}
        position={[screenCenterCoord, screenCenterY, -half + 0.02]}
        rotation={[0, 0, 0]}
        texture={textures.rightScreen}
      />

      {/* Acoustic wood-slat panels automatically fill extended wall wings on large/giant rooms */}
      <ExpandedWingPanels
        roomSize={roomSize}
        wallHeight={wallHeight}
        screenEndOffset={screenEndOffset}
      />

      {/* Twin Flanking Framed Artworks (Left Wall + Right Wall) */}
      <FramedArtwork
        width={artW}
        height={artH}
        position={[-half + 0.015, screenCenterY - 0.18, artCoord]}
        rotation={[0, Math.PI / 2, 0]}
        texture={textures.leftArt}
      />
      <FramedArtwork
        width={artW}
        height={artH}
        position={[artCoord, screenCenterY - 0.18, -half + 0.015]}
        rotation={[0, 0, 0]}
        texture={textures.rightArt}
      />

      {/* Optional Architectural Modular Floor Grid & Expandable Environment Sectors */}
      {showFloorGrid && (
        <group position={[0, 0.008, 0]}>
          <Grid
            args={[roomSize - 0.4, roomSize - 0.4]}
            cellSize={1.5}
            cellThickness={0.55}
            cellColor="#3d2715"
            sectionSize={6}
            sectionThickness={1.1}
            sectionColor="#1f2937"
            fadeDistance={roomSize * 2.2}
            fadeStrength={0.6}
          />
          {zones.map((zone) => {
            const cx = zone.normalizedCenter[0] * roomSize
            const cz = zone.normalizedCenter[1] * roomSize
            const zw = zone.normalizedSize[0] * roomSize
            const zd = zone.normalizedSize[1] * roomSize
            return (
              <group key={zone.id} position={[cx, 0.005, cz]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[zw, zd]} />
                  <meshBasicMaterial
                    color={zone.color}
                    transparent
                    opacity={0.1}
                    depthWrite={false}
                  />
                </mesh>
                {/* Thin border highlight along front edge */}
                <mesh position={[0, 0.004, zd / 2]}>
                  <boxGeometry args={[zw, 0.008, 0.045]} />
                  <meshBasicMaterial color={zone.color} transparent opacity={0.65} />
                </mesh>
              </group>
            )
          })}
        </group>
      )}
    </group>
  )
}
