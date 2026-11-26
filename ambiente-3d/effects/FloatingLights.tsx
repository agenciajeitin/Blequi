import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const LIGHT_COUNT = 8

/**
 * Floating Lights — bolinhas de luz decorativas flutuando sobre a ilha.
 * PRECISA ficar dentro do <Canvas> (usa useFrame).
 * Usa 1 InstancedMesh (1 draw call) e libera geometria/material no cleanup — padrão 60 FPS do Vex.
 */
export function FloatingLights() {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const seeds = useMemo(
    () =>
      Array.from({ length: LIGHT_COUNT }, () => ({
        x: (Math.random() - 0.5) * 40,
        baseY: 3 + Math.random() * 8,
        z: (Math.random() - 0.5) * 40,
        amp: 1.2 + Math.random() * 2,
        speed: 0.25 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
        scale: 0.1 + Math.random() * 0.3,
        hue: 0.55 + Math.random() * 0.1,
      })),
    []
  )

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 8, 8), [])
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85, toneMapped: false }),
    []
  )

  useEffect(() => {
    const mesh = meshRef.current
    if (mesh) {
      const color = new THREE.Color()
      seeds.forEach((s, i) => mesh.setColorAt(i, color.setHSL(s.hue, 0.8, 0.6)))
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [seeds, geometry, material])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return
    const t = clock.elapsedTime
    seeds.forEach((s, i) => {
      dummy.position.set(s.x, s.baseY + Math.sin(t * s.speed + s.phase) * s.amp, s.z)
      dummy.scale.setScalar(s.scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={meshRef} args={[geometry, material, LIGHT_COUNT]} frustumCulled={false} />
}
