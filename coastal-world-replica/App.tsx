import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { CoastalIslandScene, type DragInputRef } from './scene/CoastalIslandScene'
import { CoastalHud } from './ui/CoastalHud'
import { syncDesignSystemAvatarTokens, useReplicaStore } from './store'

export function App() {
  const paletteIndex = useReplicaStore((s) => s.paletteIndex)
  const phase = useReplicaStore((s) => s.phase)

  const dragRef = useRef<DragInputRef>({ active: false, dx: 0, dz: 0 })
  const [dragVisual, setDragVisual] = useState<{
    originX: number
    originY: number
    knobX: number
    knobY: number
  } | null>(null)

  useEffect(() => {
    syncDesignSystemAvatarTokens(paletteIndex)
  }, [paletteIndex])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== 'playing') return
    if (e.button !== 0) return
    dragRef.current = { active: true, dx: 0, dz: 0 }
    setDragVisual({
      originX: e.clientX,
      originY: e.clientY,
      knobX: 0,
      knobY: 0,
    })
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active || !dragVisual) return
    const rawX = e.clientX - dragVisual.originX
    const rawY = e.clientY - dragVisual.originY
    const maxR = 46
    const dist = Math.hypot(rawX, rawY)
    const clamped = Math.min(dist, maxR)
    const angle = Math.atan2(rawY, rawX)
    const kx = dist > 0 ? Math.cos(angle) * clamped : 0
    const ky = dist > 0 ? Math.sin(angle) * clamped : 0

    dragRef.current.dx = kx / maxR
    dragRef.current.dz = ky / maxR
    setDragVisual((prev) => (prev ? { ...prev, knobX: kx, knobY: ky } : null))
  }

  const handlePointerUp = () => {
    if (!dragRef.current.active) return
    dragRef.current = { active: false, dx: 0, dz: 0 }
    setDragVisual(null)
  }

  return (
    <>
      <div
        className={`cw-canvas-wrap ${dragVisual ? 'is-dragging' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <Canvas
          shadows
          dpr={[1, 1.75]}
          camera={{ fov: 44, near: 0.2, far: 300, position: [0, 5.2, 38.8] }}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
        >
          <CoastalIslandScene dragRef={dragRef} />
        </Canvas>
      </div>

      {/* Virtual Click-and-Drag Joystick Indicator */}
      {dragVisual && (
        <div
          className="cw-drag-ring"
          style={{ left: dragVisual.originX, top: dragVisual.originY }}
        >
          <div
            className="cw-drag-knob"
            style={{
              transform: `translate(${dragVisual.knobX}px, ${dragVisual.knobY}px)`,
            }}
          />
        </div>
      )}

      <CoastalHud />
    </>
  )
}
