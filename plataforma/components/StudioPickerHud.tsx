import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Building2, X } from 'lucide-react'
import { gsap } from 'gsap'
import { useAgencyStore } from '@plataforma/store/useAgencyStore'
import { STUDIO_ZONES } from '@funcionarios/providers'
import { coastalAudio } from '@ambiente/audio/coastalAudio'
import type { StudioZoneId } from '@funcionarios/types'

/**
 * Seletor de estúdios: lista os mini-estúdios da Ilha Blequi com seus moradores
 * e leva a Co-CEO direto para o interior escolhido.
 * Aberto pelo botão "Interior Estúdio" do menu (flag `isStudioPickerOpen` na store).
 */
export function StudioPickerHud() {
  const isOpen = useAgencyStore((s) => s.isStudioPickerOpen)
  const setStudioPickerOpen = useAgencyStore((s) => s.setStudioPickerOpen)
  const enterStudioZone = useAgencyStore((s) => s.enterStudioZone)
  const agents = useAgencyStore((s) => s.agents)
  const worldView = useAgencyStore((s) => s.worldView)
  const activeStudioZone = useAgencyStore((s) => s.activeStudioZone)

  const [enteringZone, setEnteringZone] = useState<StudioZoneId | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const close = () => {
    coastalAudio.playPop(480, 0.06)
    setStudioPickerOpen(false)
  }

  // Entrada animada (GSAP) com cleanup automático via gsap.context
  useEffect(() => {
    if (!isOpen || !panelRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(panelRef.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' })
      gsap.fromTo(
        '[data-studio-card]',
        { opacity: 0, x: -24 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.07, ease: 'back.out(1.6)', delay: 0.1 },
      )
    }, panelRef)
    return () => ctx.revert()
  }, [isOpen])

  // ESC fecha o seletor
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStudioPickerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, setStudioPickerOpen])

  if (!isOpen) return null

  const handleEnter = async (zone: StudioZoneId) => {
    if (enteringZone) return
    coastalAudio.playChime()
    setEnteringZone(zone)
    try {
      await enterStudioZone(zone)
    } finally {
      setEnteringZone(null)
    }
  }

  const zones = Object.values(STUDIO_ZONES)

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-[#23325b]/45 p-4 backdrop-blur-sm"
      onClick={close}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="studio-picker-title"
        className="relative w-full max-w-[460px] rounded-[30px] bg-white px-6 pt-9 pb-6 shadow-[0_24px_60px_rgba(32,54,102,0.34)]"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Fechar seleção de estúdio"
          className="absolute -top-5 left-1/2 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-b from-[#1de2c2] to-[#02c6a7] text-white shadow-[0_8px_20px_rgba(2,198,167,0.45)] transition-transform hover:scale-110 active:scale-95"
        >
          <X className="h-5 w-5 stroke-[3]" />
        </button>

        <div className="text-center">
          <p className="text-sm font-extrabold text-[#02c6a7]">Mini-Estúdios da Ilha</p>
          <h2 id="studio-picker-title" className="mt-0.5 text-base font-extrabold text-[#3b3777]">
            Qual estúdio você quer visitar?
          </h2>
        </div>

        <div className="mt-4 max-h-[60vh] space-y-2.5 overflow-y-auto pr-1">
          {zones.map((zone) => {
            const residents = agents.filter((a) => a.zone === zone.id)
            const isCurrent = worldView === 'studio' && activeStudioZone === zone.id
            const isEntering = enteringZone === zone.id
            return (
              <button
                key={zone.id}
                type="button"
                data-studio-card
                disabled={Boolean(enteringZone) || isCurrent}
                onClick={() => handleEnter(zone.id)}
                className="group flex w-full items-center gap-3 rounded-[22px] border-2 border-[#eef2f8] bg-[#f7f9fc] px-4 py-3 text-left transition-all hover:border-[#02c6a7] hover:bg-white disabled:cursor-default disabled:opacity-70 disabled:hover:border-[#eef2f8]"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                  style={{ backgroundColor: zone.color }}
                >
                  <Building2 className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-[#3b3777]">{zone.name}</span>
                  <span className="block truncate text-[11px] font-semibold text-[#7c79a6]">
                    {residents.length > 0 ? residents.map((a) => a.name).join(' · ') : zone.subtitle}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] font-extrabold text-[#02c6a7]">
                  {isCurrent ? (
                    'Você está aqui'
                  ) : isEntering ? (
                    'Entrando...'
                  ) : (
                    <ArrowRight className="h-4 w-4 stroke-[2.8] transition-transform group-hover:translate-x-1" />
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
