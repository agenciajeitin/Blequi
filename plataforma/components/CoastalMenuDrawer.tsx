import {
  Building2,
  Compass,
  Crown,
  Gauge,
  Moon,
  Plus,
  Settings2,
  Sun,
  Sunset,
  Wifi,
  X,
} from 'lucide-react'
import type { WorldTimeOfDay } from '@funcionarios/types'
import { useAgencyStore } from '@plataforma/store/useAgencyStore'
import { coastalAudio } from '@ambiente/audio/coastalAudio'

const TIME_MODES: { id: WorldTimeOfDay; label: string; Icon: typeof Sun }[] = [
  { id: 'daylight', label: 'Dia Costeiro', Icon: Sun },
  { id: 'golden', label: 'Fim de Tarde', Icon: Sunset },
  { id: 'dusk', label: 'Noite', Icon: Moon },
]

/**
 * 1:1 Coastal World Right-Side Curved White Menu Drawer
 * Houses Blequi Co-CEO presence, Gemini API / LAN settings, Lighting mood, World switcher, and Hiring.
 */
export function CoastalMenuDrawer() {
  const isOpen = useAgencyStore((s) => s.isMenuOpen)
  const currentUser = useAgencyStore((s) => s.currentUser)
  const onlineCeos = useAgencyStore((s) => s.onlineCeos)
  const liveConnected = useAgencyStore((s) => s.liveConnected)
  const liveFps = useAgencyStore((s) => s.liveFps)
  const serverMeta = useAgencyStore((s) => s.serverMeta)
  const worldView = useAgencyStore((s) => s.worldView)
  const activeStudioZone = useAgencyStore((s) => s.activeStudioZone)
  const timeOfDay = useAgencyStore((s) => s.timeOfDay)
  const proposalsCount = useAgencyStore((s) => s.proposals.length)

  const setMenuOpen = useAgencyStore((s) => s.setMenuOpen)
  const setTimeOfDay = useAgencyStore((s) => s.setTimeOfDay)
  const returnToIsland = useAgencyStore((s) => s.returnToIsland)
  const enterStudioZone = useAgencyStore((s) => s.enterStudioZone)
  const setSettingsOpen = useAgencyStore((s) => s.setSettingsOpen)
  const setCreateModalOpen = useAgencyStore((s) => s.setCreateModalOpen)
  const openEntryHud = useAgencyStore((s) => s.openEntryHud)

  if (!isOpen) return null

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-40 flex justify-end bg-[#23325b]/35 backdrop-blur-[3px]"
      onClick={() => setMenuOpen(false)}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full max-w-[390px] flex-col justify-between rounded-l-[46px] bg-white px-7 py-7 shadow-[-18px_0_54px_rgba(24,42,88,0.24)]"
      >
        {/* Top Close Circle Button (1:1 Coastal World Mint X button!) */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#02c6a7]">
              Agência Privada 3D
            </p>
            <h2 className="cw-wordmark text-2xl text-[#3b3777] !shadow-none">ILHA BLEQUI</h2>
          </div>

          <button
            type="button"
            onClick={() => {
              coastalAudio.playPop(480, 0.06)
              setMenuOpen(false)
            }}
            aria-label="Fechar menu"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-b from-[#20e4c4] to-[#02c6a7] text-white shadow-[0_8px_20px_rgba(2,198,167,0.38)] transition-transform hover:scale-105"
          >
            <X className="h-5 w-5 stroke-[3]" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="my-5 flex-1 space-y-5 overflow-y-auto pr-1">
          {/* Active Co-CEO Pill */}
          <div className="rounded-[24px] bg-[#f4f8ff] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f6d35f] to-[#f97316] text-white shadow-sm">
                <Crown className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-black text-[#3b3777]">
                    {currentUser?.name || 'Co-CEO Blequi'}
                  </p>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${liveConnected ? 'bg-[#02c6a7]' : 'bg-[#f6b93b]'}`}
                  />
                </div>
                <p className="truncate text-xs font-semibold text-[#7976a3]">
                  {onlineCeos.length >= 2
                    ? `2 Co-CEOs online (${onlineCeos.map((c) => c.name).join(' & ')})`
                    : `${currentUser?.role || 'Co-CEO & Fundadora'}`}
                </p>
              </div>
            </div>

            {serverMeta && serverMeta.networkUrls.length > 0 && (
              <div className="mt-3 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-mono text-[11px] font-semibold text-[#02a68c] shadow-sm">
                <Wifi className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{serverMeta.networkUrls[0]}</span>
              </div>
            )}
          </div>

          {/* World Mode Switcher */}
          <div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#7976a3]">
              Exploração 3D
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  coastalAudio.playPop(580, 0.06)
                  returnToIsland()
                }}
                className={`flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-extrabold transition-all ${
                  worldView === 'island'
                    ? 'bg-[#3b3777] text-white shadow-md'
                    : 'bg-[#f3f6fc] text-[#3b3777] hover:bg-[#e7eef9]'
                }`}
              >
                <Compass className="h-4 w-4" />
                Ilha Costeira
              </button>
              <button
                type="button"
                onClick={() => {
                  coastalAudio.playPop(580, 0.06)
                  enterStudioZone(activeStudioZone)
                }}
                className={`flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-extrabold transition-all ${
                  worldView === 'studio'
                    ? 'bg-[#3b3777] text-white shadow-md'
                    : 'bg-[#f3f6fc] text-[#3b3777] hover:bg-[#e7eef9]'
                }`}
              >
                <Building2 className="h-4 w-4" />
                Interior Estúdio
              </button>
            </div>
          </div>

          {/* Lighting Time of Day */}
          <div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#7976a3]">
              Clima & Luz da Ilha
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {TIME_MODES.map(({ id, label, Icon }) => {
                const active = timeOfDay === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      coastalAudio.playPop(620, 0.06)
                      setTimeOfDay(id)
                    }}
                    className={`flex flex-col items-center gap-1 rounded-2xl py-2.5 text-[11px] font-extrabold transition-all ${
                      active
                        ? 'bg-[#02c6a7] text-white shadow-sm'
                        : 'bg-[#f3f6fc] text-[#3b3777] hover:bg-[#e7eef9]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Primary Coastal World Tactile Pill CTAs */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="cw-cta cw-cta-mint w-full"
            >
              <span className="cw-cta-inner flex w-full items-center justify-center gap-2 py-3 text-sm font-extrabold">
                <Settings2 className="h-4 w-4" />
                {serverMeta?.geminiConfigured ? 'Gemini Live & Rede LAN' : 'Configurar Gemini API'}
                {proposalsCount > 0 && (
                  <span className="rounded-full bg-[#f6d35f] px-2 py-0.5 text-[10px] font-black text-[#3b3777]">
                    {proposalsCount}
                  </span>
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#eef3fb] py-3 text-sm font-extrabold text-[#3b3777] transition-colors hover:bg-[#e1eaf8]"
            >
              <Plus className="h-4 w-4 stroke-[2.8]" />
              Contratar Especialista
            </button>

            <button
              type="button"
              onClick={() => openEntryHud()}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#f7f9fd] py-2.5 text-xs font-extrabold text-[#6c6996] transition-colors hover:bg-[#edf2fa] hover:text-[#3b3777]"
            >
              <Crown className="h-3.5 w-3.5 text-[#f6b93b]" />
              Trocar Assento Co-CEO 1 / Co-CEO 2
            </button>
          </div>
        </div>

        {/* Footer Info & 60 FPS Badge */}
        <footer className="border-t border-[#edf2f8] pt-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#e9fbf7] px-3 py-1 font-mono text-[11px] font-bold text-[#01967e]">
            <Gauge className="h-3.5 w-3.5" />
            Qualidade Adaptativa · {liveFps} FPS
          </div>
          <p className="mt-2.5 text-[11px] font-semibold leading-relaxed text-[#8d8bb0]">
            Ilha Blequi — Agência Virtual Privada das duas Co-CEOs sincronizada localmente em tempo real.
          </p>
        </footer>
      </aside>
    </div>
  )
}
