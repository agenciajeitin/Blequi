import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Dices, X } from 'lucide-react'
import type {
  BodyAccessoryId,
  HeadAccessoryId,
  PlayerAvatarConfig,
  ShoeStyleId,
} from '@funcionarios/types'
import { useAgencyStore } from '@plataforma/store/useAgencyStore'
import { COASTAL_AVATAR_PALETTES } from '@ambiente/shaders/coastalShaders'
import { coastalAudio } from '@ambiente/audio/coastalAudio'

const HEAD_OPTIONS: HeadAccessoryId[] = ['headphones', 'beanie', 'sunhat', 'crown', 'visor', 'none']
const BODY_OPTIONS: BodyAccessoryId[] = ['fannypack', 'backpack', 'wings', 'buoy', 'none']
const SHOE_OPTIONS: ShoeStyleId[] = ['sneakers', 'boots', 'sandals', 'fast']

function cycle<T>(list: T[], current: T, delta: number): T {
  const idx = list.indexOf(current)
  const next = (idx + delta + list.length) % list.length
  return list[next]
}

/**
 * 1:1 Coastal World Live 3D Avatar Customizer (steps/86/media_0.png):
 * - Top center: white capsule swatch bar (5 pastel colors + checkmark) + face-style toggle tab beneath
 * - Flanking left & right: 3 pairs of white circular outlined arrows (Head, Body/Accessory, Shoes)
 * - Bottom center: 3 glossy 3D beveled circular orbs (Coral X, Blue Dice Randomize, Mint Check Confirm)
 */
export function CoastalCustomizerHud() {
  const isOpen = useAgencyStore((s) => s.isCustomizerOpen)
  const playerAvatar = useAgencyStore((s) => s.playerAvatar)
  const setPlayerAvatar = useAgencyStore((s) => s.setPlayerAvatar)
  const setCustomizerOpen = useAgencyStore((s) => s.setCustomizerOpen)

  const [snapshot, setSnapshot] = useState<PlayerAvatarConfig>(playerAvatar)

  useEffect(() => {
    if (isOpen) {
      setSnapshot(playerAvatar)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  if (!isOpen) return null

  const update = (patch: Partial<PlayerAvatarConfig>) => {
    coastalAudio.playPop(640, 0.06)
    setPlayerAvatar({ ...playerAvatar, ...patch })
  }

  const handleRandomize = () => {
    coastalAudio.playChime()
    setPlayerAvatar({
      colorIndex: Math.floor(Math.random() * COASTAL_AVATAR_PALETTES.length),
      faceStyle: Math.random() > 0.45 ? 'lashes' : 'classic',
      headAccessory: HEAD_OPTIONS[Math.floor(Math.random() * HEAD_OPTIONS.length)],
      bodyAccessory: BODY_OPTIONS[Math.floor(Math.random() * BODY_OPTIONS.length)],
      shoeStyle: SHOE_OPTIONS[Math.floor(Math.random() * SHOE_OPTIONS.length)],
    })
  }

  const handleDiscard = () => {
    coastalAudio.playPop(420, 0.07)
    setPlayerAvatar(snapshot)
    setCustomizerOpen(false)
  }

  const handleConfirm = () => {
    coastalAudio.playChime()
    setCustomizerOpen(false)
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col items-center justify-between py-6 px-4">
      {/* TOP CENTER: 5-Color Pastel Pill Bar + Dual Face Toggle Tab (1:1 steps/86/media_0.png!) */}
      <div className="pointer-events-auto flex flex-col items-center">
        <div className="flex items-center overflow-hidden rounded-full border-[5px] border-white bg-white shadow-[0_12px_30px_rgba(32,54,102,0.2)]">
          {COASTAL_AVATAR_PALETTES.map((pal, idx) => {
            const active = playerAvatar.colorIndex === idx
            return (
              <button
                key={pal.id}
                type="button"
                aria-label={`Cor ${idx + 1}`}
                onClick={() => update({ colorIndex: idx })}
                className="relative flex h-9 w-12 items-center justify-center transition-transform hover:brightness-105 sm:w-14"
                style={{
                  background: `linear-gradient(180deg, ${pal.swatch}ee 0%, ${pal.swatch} 100%)`,
                }}
              >
                {active && <Check className="h-5 w-5 stroke-[3.2] text-white drop-shadow" />}
              </button>
            )
          })}
        </div>

        {/* Face Expression Toggle Pill attached underneath */}
        <div className="flex items-center gap-1 rounded-b-[20px] bg-white px-2.5 py-1.5 shadow-[0_10px_22px_rgba(32,54,102,0.16)]">
          <button
            type="button"
            onClick={() => update({ faceStyle: 'classic' })}
            aria-label="Rosto clássico"
            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
              playerAvatar.faceStyle === 'classic'
                ? 'border-[#3b3777] text-[#3b3777] scale-105'
                : 'border-transparent text-[#b8bfd4] hover:text-[#3b3777]'
            }`}
          >
            <span className="text-base font-black leading-none">☺</span>
          </button>
          <div className="h-5 w-px bg-[#e6ecf5]" />
          <button
            type="button"
            onClick={() => update({ faceStyle: 'lashes' })}
            aria-label="Rosto com cílios"
            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
              playerAvatar.faceStyle === 'lashes'
                ? 'border-[#3b3777] text-[#3b3777] scale-105'
                : 'border-transparent text-[#b8bfd4] hover:text-[#3b3777]'
            }`}
          >
            <span className="text-base font-black leading-none">☻</span>
          </button>
        </div>
      </div>

      {/* MIDDLE FLANKING WHITE CIRCLE ARROWS FOR HEAD / BODY / SHOES (1:1 steps/86/media_0.png!) */}
      <div className="flex w-full max-w-[660px] flex-col gap-10 px-2 sm:gap-12">
        {/* Row 1: Headgear */}
        <div className="flex items-center justify-between px-6 sm:px-14">
          <button
            type="button"
            aria-label="Acessório cabeça anterior"
            onClick={() => update({ headAccessory: cycle(HEAD_OPTIONS, playerAvatar.headAccessory, -1) })}
            className="cw-circle-btn pointer-events-auto !h-12 !w-12 !border-[3px]"
          >
            <ArrowLeft className="h-5 w-5 stroke-[2.8]" />
          </button>
          <button
            type="button"
            aria-label="Próximo acessório cabeça"
            onClick={() => update({ headAccessory: cycle(HEAD_OPTIONS, playerAvatar.headAccessory, 1) })}
            className="cw-circle-btn pointer-events-auto !h-12 !w-12 !border-[3px]"
          >
            <ArrowRight className="h-5 w-5 stroke-[2.8]" />
          </button>
        </div>

        {/* Row 2: Body / Waist Accessory */}
        <div className="flex items-center justify-between px-0 sm:px-6">
          <button
            type="button"
            aria-label="Acessório corpo anterior"
            onClick={() => update({ bodyAccessory: cycle(BODY_OPTIONS, playerAvatar.bodyAccessory, -1) })}
            className="cw-circle-btn pointer-events-auto !h-12 !w-12 !border-[3px]"
          >
            <ArrowLeft className="h-5 w-5 stroke-[2.8]" />
          </button>
          <button
            type="button"
            aria-label="Próximo acessório corpo"
            onClick={() => update({ bodyAccessory: cycle(BODY_OPTIONS, playerAvatar.bodyAccessory, 1) })}
            className="cw-circle-btn pointer-events-auto !h-12 !w-12 !border-[3px]"
          >
            <ArrowRight className="h-5 w-5 stroke-[2.8]" />
          </button>
        </div>

        {/* Row 3: Footwear */}
        <div className="flex items-center justify-between px-6 sm:px-14">
          <button
            type="button"
            aria-label="Calçado anterior"
            onClick={() => update({ shoeStyle: cycle(SHOE_OPTIONS, playerAvatar.shoeStyle, -1) })}
            className="cw-circle-btn pointer-events-auto !h-12 !w-12 !border-[3px]"
          >
            <ArrowLeft className="h-5 w-5 stroke-[2.8]" />
          </button>
          <button
            type="button"
            aria-label="Próximo calçado"
            onClick={() => update({ shoeStyle: cycle(SHOE_OPTIONS, playerAvatar.shoeStyle, 1) })}
            className="cw-circle-btn pointer-events-auto !h-12 !w-12 !border-[3px]"
          >
            <ArrowRight className="h-5 w-5 stroke-[2.8]" />
          </button>
        </div>
      </div>

      {/* BOTTOM CENTER: 3 GLOSSY BEVELED CIRCULAR ACTION ORBS (Discard / Randomize / Confirm) */}
      <div className="pointer-events-auto flex items-center gap-4">
        <button
          type="button"
          onClick={handleDiscard}
          aria-label="Descartar alterações"
          className="cw-action-orb"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-b from-[#ff9499] to-[#f2676f] text-white shadow-inner">
            <X className="h-6 w-6 stroke-[3]" />
          </span>
        </button>

        <button
          type="button"
          onClick={handleRandomize}
          aria-label="Visual aleatório"
          className="cw-action-orb"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-b from-[#5ca8f8] to-[#2c66c8] text-white shadow-inner">
            <Dices className="h-6 w-6 stroke-[2.4]" />
          </span>
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          aria-label="Confirmar avatar"
          className="cw-action-orb"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-b from-[#45e8cc] to-[#02c6a7] text-white shadow-inner">
            <Check className="h-6 w-6 stroke-[3.2]" />
          </span>
        </button>
      </div>
    </div>
  )
}
