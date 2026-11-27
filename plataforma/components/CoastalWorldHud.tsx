import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Building2,
  ClipboardList,
  Compass,
  DoorOpen,
  Eye,
  Footprints,
  Grid3x3,
  Heart,
  MapPin,
  Menu,
  MessageCircle,
  Shirt,
  Smile,
  Sparkles,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { ROOM_SCALES, ROOM_SCALE_ORDER, STUDIO_ZONES } from '@funcionarios/providers'
import { useAgencyStore } from '@plataforma/store/useAgencyStore'
import { COASTAL_AVATAR_PALETTES } from '@ambiente/shaders/coastalShaders'
import { virtualJoystick } from '@ambiente/island/PlayablePlayerController'
import { coastalAudio } from '@ambiente/audio/coastalAudio'

interface DragVisual {
  originX: number
  originY: number
  curX: number
  curY: number
}

export function CoastalWorldHud() {
  const worldView = useAgencyStore((s) => s.worldView)
  const activeStudioZone = useAgencyStore((s) => s.activeStudioZone)
  const studioCameraMode = useAgencyStore((s) => s.studioCameraMode)
  const roomScale = useAgencyStore((s) => s.roomScale)
  const showFloorGrid = useAgencyStore((s) => s.showFloorGrid)
  const comfortScore = useAgencyStore((s) => s.comfortScore)
  const playerAvatar = useAgencyStore((s) => s.playerAvatar)
  const soundEnabled = useAgencyStore((s) => s.soundEnabled)
  const hasMovedPlayer = useAgencyStore((s) => s.hasMovedPlayer)
  const nearbyInteractable = useAgencyStore((s) => s.nearbyInteractable)
  const isPhoneOpen = useAgencyStore((s) => s.isPhoneOpen)
  const isMenuOpen = useAgencyStore((s) => s.isMenuOpen)
  const isCustomizerOpen = useAgencyStore((s) => s.isCustomizerOpen)
  const selectedAgentId = useAgencyStore((s) => s.selectedAgentId)
  const proposalsCount = useAgencyStore((s) => s.proposals.length)
  const propsList = useAgencyStore((s) => s.props)

  const setCustomizerOpen = useAgencyStore((s) => s.setCustomizerOpen)
  const toggleSound = useAgencyStore((s) => s.toggleSound)
  const setMenuOpen = useAgencyStore((s) => s.setMenuOpen)
  const setPhoneOpen = useAgencyStore((s) => s.setPhoneOpen)
  const returnToIsland = useAgencyStore((s) => s.returnToIsland)
  const setStudioCameraMode = useAgencyStore((s) => s.setStudioCameraMode)
  const setRoomScale = useAgencyStore((s) => s.setRoomScale)
  const toggleFloorGrid = useAgencyStore((s) => s.toggleFloorGrid)
  const resetCamera = useAgencyStore((s) => s.resetCamera)
  const selectAgent = useAgencyStore((s) => s.selectAgent)
  const enterStudioZone = useAgencyStore((s) => s.enterStudioZone)
  const rewardAgentOrProp = useAgencyStore((s) => s.rewardAgentOrProp)

  const [dragVisual, setDragVisual] = useState<DragVisual | null>(null)
  const dragOriginRef = useRef<{ x: number; y: number; active: boolean } | null>(null)

  const isWalkableActive =
    (worldView === 'island' || (worldView === 'studio' && studioCameraMode === 'walk')) &&
    !isPhoneOpen &&
    !isMenuOpen &&
    !isCustomizerOpen

  // Keep Web Audio synced with sound toggle
  useEffect(() => {
    coastalAudio.setEnabled(soundEnabled)
  }, [soundEnabled])

  // Global click-and-drag virtual joystick listener (works identically on Island AND inside walkable Studios!)
  useEffect(() => {
    if (!isWalkableActive) {
      virtualJoystick.active = false
      virtualJoystick.dx = 0
      virtualJoystick.dy = 0
      setDragVisual(null)
      return
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      const target = e.target as HTMLElement | null
      if (!target || target.tagName !== 'CANVAS') return
      dragOriginRef.current = { x: e.clientX, y: e.clientY, active: false }
    }

    const onPointerMove = (e: PointerEvent) => {
      const origin = dragOriginRef.current
      if (!origin) return
      const dx = e.clientX - origin.x
      const dy = e.clientY - origin.y
      const dist = Math.hypot(dx, dy)
      if (!origin.active && dist >= 10) {
        origin.active = true
      }
      if (origin.active) {
        const maxRadius = 64
        const clamped = Math.min(dist, maxRadius)
        const angle = Math.atan2(dy, dx)
        const normX = (Math.cos(angle) * clamped) / maxRadius
        const normY = (Math.sin(angle) * clamped) / maxRadius
        virtualJoystick.active = true
        virtualJoystick.dx = normX
        virtualJoystick.dy = normY
        setDragVisual({
          originX: origin.x,
          originY: origin.y,
          curX: origin.x + Math.cos(angle) * clamped,
          curY: origin.y + Math.sin(angle) * clamped,
        })
      }
    }

    const onPointerUp = () => {
      dragOriginRef.current = null
      virtualJoystick.active = false
      virtualJoystick.dx = 0
      virtualJoystick.dy = 0
      setDragVisual(null)
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      virtualJoystick.active = false
      virtualJoystick.dx = 0
      virtualJoystick.dy = 0
    }
  }, [isWalkableActive])

  // Hide main HUD while live 3D Customizer is focused on the character
  if (isCustomizerOpen) return null

  const palette = COASTAL_AVATAR_PALETTES[playerAvatar.colorIndex] ?? COASTAL_AVATAR_PALETTES[4]
  const activeZoneMeta = STUDIO_ZONES[activeStudioZone]

  return (
    <>
      {/* 1. TOP-LEFT: 1:1 COASTAL WORLD STACKED WHITE WORDMARK (steps/113/media_0.png) */}
      <div className="pointer-events-none fixed top-5 left-6 z-20 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            coastalAudio.playPop(580, 0.06)
            if (worldView === 'studio') {
              returnToIsland()
            } else {
              resetCamera()
            }
          }}
          title={worldView === 'studio' ? 'Voltar para a Ilha Blequi' : 'Voltar ao Píer Inicial'}
          className="cw-wordmark pointer-events-auto flex flex-col items-start text-left leading-[0.86] text-white transition-transform hover:scale-105"
        >
          <span className="text-[15px] tracking-[0.06em]">ILHA</span>
          <span className="text-[28px] tracking-[-0.01em]">BLEQUI</span>
        </button>

        {/* When inside a Private Studio Interior, show clean bright Coastal World navigation pill */}
        {worldView === 'studio' && (
          <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-full border-2 border-white bg-white/92 px-2 py-1.5 shadow-[0_12px_30px_rgba(32,58,104,0.18)] backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                coastalAudio.playPop(520, 0.06)
                returnToIsland()
              }}
              className="flex items-center gap-1.5 rounded-full bg-[#02c6a7] px-3.5 py-1.5 text-xs font-extrabold text-white transition-transform hover:scale-105"
            >
              <Compass className="h-3.5 w-3.5" />
              Voltar à Ilha
            </button>

            <span className="px-2 text-xs font-extrabold text-[#3b3777] flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-[#f2676f]" />
              {activeZoneMeta.shortName}
            </span>

            <div className="h-4 w-px bg-[#e2e8f0]" />

            {/* Walk (3rd-Person Coastal World) <-> Overhead Orbit Camera Toggle */}
            <div className="flex items-center gap-0.5 rounded-full bg-[#eef3fa] p-0.5">
              <button
                type="button"
                onClick={() => {
                  coastalAudio.playPop(600, 0.06)
                  setStudioCameraMode('walk')
                }}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold transition-all ${
                  studioCameraMode === 'walk'
                    ? 'bg-[#3b3777] text-white shadow-sm'
                    : 'text-[#6c6996] hover:text-[#3b3777]'
                }`}
                title="Caminhar em 3ª pessoa dentro do estúdio"
              >
                <Footprints className="h-3 w-3" />
                Andar
              </button>
              <button
                type="button"
                onClick={() => {
                  coastalAudio.playPop(600, 0.06)
                  setStudioCameraMode('orbit')
                }}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold transition-all ${
                  studioCameraMode === 'orbit'
                    ? 'bg-[#3b3777] text-white shadow-sm'
                    : 'text-[#6c6996] hover:text-[#3b3777]'
                }`}
                title="Vista aérea isométrica com órbita"
              >
                <Eye className="h-3 w-3" />
                Aérea
              </button>
            </div>

            <div className="h-4 w-px bg-[#e2e8f0]" />

            <div className="flex items-center gap-0.5">
              {ROOM_SCALE_ORDER.map((scaleId) => {
                const meta = ROOM_SCALES[scaleId]
                const active = roomScale === scaleId
                return (
                  <button
                    key={scaleId}
                    type="button"
                    onClick={() => setRoomScale(scaleId)}
                    className={`rounded-full px-2 py-1 text-[11px] font-extrabold transition-colors ${
                      active ? 'bg-[#3b3777] text-white' : 'text-[#6c6996] hover:bg-[#eef2f8]'
                    }`}
                  >
                    {meta.size}m
                  </button>
                )
              })}
              <button
                type="button"
                onClick={toggleFloorGrid}
                title="Grade modular"
                className={`rounded-full p-1.5 transition-colors ${
                  showFloorGrid ? 'bg-[#02c6a7]/20 text-[#02c6a7]' : 'text-[#6c6996] hover:bg-[#eef2f8]'
                }`}
              >
                <Grid3x3 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. TOP-RIGHT: EXACT 3 COASTAL WORLD BORDERED CIRCLE BUTTONS (Avatar, Sound, Menu) */}
      <div className="pointer-events-auto fixed top-5 right-6 z-20 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => {
            coastalAudio.playPop(620, 0.06)
            setCustomizerOpen(true)
          }}
          aria-label="Personalizar seu avatar CEO"
          title="Personalizar Avatar"
          className="cw-circle-btn"
        >
          <Smile className="h-6 w-6 stroke-[2.5]" />
        </button>

        <button
          type="button"
          onClick={() => toggleSound()}
          aria-label={soundEnabled ? 'Desativar som' : 'Ativar som ambiente'}
          title={soundEnabled ? 'Som ligado' : 'Ligar som ambiente'}
          className="cw-circle-btn"
        >
          {soundEnabled ? (
            <Volume2 className="h-5 w-5 stroke-[2.6]" />
          ) : (
            <VolumeX className="h-5 w-5 stroke-[2.6]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            coastalAudio.playPop(540, 0.06)
            setMenuOpen(!isMenuOpen)
          }}
          aria-label="Abrir menu Blequi"
          title="Menu & Configurações"
          className="cw-circle-btn"
        >
          <Menu className="h-6 w-6 stroke-[2.6]" />
          {proposalsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#f2676f] text-[10px] font-black text-white shadow-md">
              {proposalsCount}
            </span>
          )}
        </button>
      </div>

      {/* 3. CLICK & DRAG VIRTUAL JOYSTICK VISUAL FEEDBACK */}
      {dragVisual && (
        <div className="pointer-events-none fixed inset-0 z-10">
          <div
            className="absolute h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white/75 bg-white/15 backdrop-blur-[2px]"
            style={{ left: dragVisual.originX, top: dragVisual.originY }}
          />
          <div
            className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow-lg"
            style={{ left: dragVisual.curX, top: dragVisual.curY }}
          />
        </div>
      )}

      {/* 4. BOTTOM-CENTER: 1:1 COASTAL WORLD WALKING TUTORIAL OR PROXIMITY INTERACTION PROMPT (ISLAND + STUDIOS!) */}
      {!isPhoneOpen && !selectedAgentId && (worldView === 'island' || studioCameraMode === 'walk') && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-20 flex flex-col items-center justify-center px-4">
          {nearbyInteractable ? (
            <button
              type="button"
              onClick={() => {
                coastalAudio.playChime()
                if (nearbyInteractable.kind === 'agent') {
                  selectAgent(nearbyInteractable.id)
                } else if (nearbyInteractable.kind === 'studio' && nearbyInteractable.zone) {
                  enterStudioZone(nearbyInteractable.zone)
                } else if (nearbyInteractable.kind === 'exit') {
                  returnToIsland()
                } else if (nearbyInteractable.kind === 'prop') {
                  const found = propsList.find((p) => p.id === nearbyInteractable.id)
                  if (found && !found.approved) {
                    rewardAgentOrProp({ propId: found.id })
                  } else if (found) {
                    selectAgent(found.createdByAgentId)
                  }
                }
              }}
              className="cw-pop-in cw-cta cw-cta-white pointer-events-auto"
            >
              <span className="cw-cta-inner flex items-center gap-3 px-5 py-2.5 text-sm font-extrabold text-[#3b3777]">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: nearbyInteractable.accentColor }}
                >
                  {nearbyInteractable.kind === 'agent' ? (
                    <MessageCircle className="h-4 w-4" />
                  ) : nearbyInteractable.kind === 'exit' ? (
                    <DoorOpen className="h-4 w-4" />
                  ) : nearbyInteractable.kind === 'prop' ? (
                    <Sparkles className="h-4 w-4" />
                  ) : (
                    <Building2 className="h-4 w-4" />
                  )}
                </span>
                <span className="text-left">
                  <span className="block leading-tight">{nearbyInteractable.label}</span>
                  <span className="block text-[11px] font-bold text-[#02c6a7]">
                    {nearbyInteractable.sublabel}
                  </span>
                </span>
              </span>
            </button>
          ) : (
            !hasMovedPlayer && (
              <div className="flex flex-col items-center gap-2">
                {/* 4 Pulsing White Arrow Keycaps (1:1 steps/62/media_0.png!) */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="cw-keycap flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#3b3777] shadow-[0_4px_12px_rgba(32,56,100,0.2)]">
                    <ArrowUp className="h-4 w-4 stroke-[3]" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="cw-keycap flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#3b3777] shadow-[0_4px_12px_rgba(32,56,100,0.2)]"
                      style={{ animationDelay: '0.2s' }}
                    >
                      <ArrowLeft className="h-4 w-4 stroke-[3]" />
                    </div>
                    <div
                      className="cw-keycap flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#3b3777] shadow-[0_4px_12px_rgba(32,56,100,0.2)]"
                      style={{ animationDelay: '0.35s' }}
                    >
                      <ArrowDown className="h-4 w-4 stroke-[3]" />
                    </div>
                    <div
                      className="cw-keycap flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#3b3777] shadow-[0_4px_12px_rgba(32,56,100,0.2)]"
                      style={{ animationDelay: '0.5s' }}
                    >
                      <ArrowRight className="h-4 w-4 stroke-[3]" />
                    </div>
                  </div>
                </div>

                {/* Exact Coastal World White Pill Tutorial Caption */}
                <div className="rounded-full bg-white px-5 py-1.5 text-[14px] font-extrabold text-[#3b3777] shadow-[0_8px_22px_rgba(30,58,104,0.18)]">
                  use as setas ou{' '}
                  <strong className="font-extrabold text-[#f2676f]">clique e arraste para andar</strong>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* 5. BOTTOM-RIGHT: 1:1 COASTAL WORLD CURVED WHITE CORNER + TILTED MINI SMARTPHONE DOCK */}
      {!isPhoneOpen && !selectedAgentId && (
        <div className="pointer-events-none fixed right-0 bottom-0 z-20">
          {/* Organic curved white bottom-right backdrop matching steps/113/media_0.png! */}
          <div className="h-24 w-44 rounded-tl-[56px] bg-white shadow-[-8px_-8px_28px_rgba(34,64,112,0.14)]" />

          {/* Tilted Interactive Mini Smartphone */}
          <button
            type="button"
            onClick={() => {
              coastalAudio.playPop(660, 0.08)
              setPhoneOpen(true, 'messages')
            }}
            aria-label="Abrir celular da Ilha Blequi"
            className="pointer-events-auto group absolute right-6 bottom-4 origin-bottom-right -rotate-6 transition-all duration-300 hover:-translate-y-3 hover:rotate-0 hover:scale-105"
          >
            <div
              className="relative flex h-[142px] w-[96px] flex-col rounded-[22px] p-[5px] shadow-[0_16px_32px_rgba(40,48,88,0.28)]"
              style={{
                backgroundColor: palette.phoneCase,
                boxShadow: `4px 6px 0px ${palette.body}55, 0 16px 32px rgba(40,48,88,0.24)`,
              }}
            >
              {/* Glossy pastel smartphone screen */}
              <div className="flex flex-1 flex-col justify-between overflow-hidden rounded-[17px] bg-gradient-to-b from-[#edf6ff] via-[#f7fbff] to-[#ffffff] p-2">
                {/* 2x2 Coastal App Icons Grid */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <div className="flex h-8 items-center justify-center rounded-xl bg-[#e3f3ff] text-[#3b82f6]">
                    <MapPin className="h-4 w-4 fill-[#60a5fa]/35" />
                  </div>
                  <div className="flex h-8 items-center justify-center rounded-xl bg-[#e2faf4] text-[#02c6a7]">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex h-8 items-center justify-center rounded-xl bg-[#eef2ff] text-[#6366f1]">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <div className="flex h-8 items-center justify-center rounded-xl bg-[#fff0f2] text-[#f2676f]">
                    <Shirt className="h-4 w-4" />
                  </div>
                </div>

                {/* Bottom Golden Wellbeing Coin Counter (1:1 CP Counter!) */}
                <div className="flex items-center justify-between rounded-full bg-white px-2 py-1 shadow-sm ring-1 ring-[#e6edf6]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-b from-[#ffd44d] to-[#f59e0b] text-[10px] font-black text-white shadow-inner">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex items-center gap-0.5 pr-1 text-xs font-black text-[#3b3777]">
                    {comfortScore}
                    <Heart className="h-2.5 w-2.5 fill-[#f2676f] text-[#f2676f]" />
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>
      )}
    </>
  )
}
