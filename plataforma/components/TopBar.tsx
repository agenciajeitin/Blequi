import {
  Building2,
  Crown,
  Focus,
  Gauge,
  Grid3x3,
  Heart,
  Layers,
  Map,
  Moon,
  Plus,
  Settings2,
  Sun,
  Sunset,
} from 'lucide-react'
import { ROOM_SCALES, ROOM_SCALE_ORDER, STUDIO_ZONES } from '@funcionarios/providers'
import type { WorldTimeOfDay } from '@funcionarios/types'
import { useAgencyStore } from '@plataforma/store/useAgencyStore'

const TIME_OPTIONS: { id: WorldTimeOfDay; label: string; Icon: typeof Sun }[] = [
  { id: 'golden', label: 'Dourado', Icon: Sunset },
  { id: 'daylight', label: 'Dia', Icon: Sun },
  { id: 'dusk', label: 'Noite', Icon: Moon },
]

export function TopBar() {
  const currentUser = useAgencyStore((s) => s.currentUser)
  const onlineCeos = useAgencyStore((s) => s.onlineCeos)
  const liveConnected = useAgencyStore((s) => s.liveConnected)
  const liveFps = useAgencyStore((s) => s.liveFps)
  const serverMeta = useAgencyStore((s) => s.serverMeta)
  const worldView = useAgencyStore((s) => s.worldView)
  const activeStudioZone = useAgencyStore((s) => s.activeStudioZone)
  const timeOfDay = useAgencyStore((s) => s.timeOfDay)
  const roomScale = useAgencyStore((s) => s.roomScale)
  const comfortScore = useAgencyStore((s) => s.comfortScore)
  const showFloorGrid = useAgencyStore((s) => s.showFloorGrid)
  const isProjectsOpen = useAgencyStore((s) => s.isProjectsOpen)
  const proposalsCount = useAgencyStore((s) => s.proposals.length)

  const returnToIsland = useAgencyStore((s) => s.returnToIsland)
  const enterStudioZone = useAgencyStore((s) => s.enterStudioZone)
  const setTimeOfDay = useAgencyStore((s) => s.setTimeOfDay)
  const setRoomScale = useAgencyStore((s) => s.setRoomScale)
  const toggleFloorGrid = useAgencyStore((s) => s.toggleFloorGrid)
  const resetCamera = useAgencyStore((s) => s.resetCamera)
  const setProjectsOpen = useAgencyStore((s) => s.setProjectsOpen)
  const setCreateModalOpen = useAgencyStore((s) => s.setCreateModalOpen)
  const setSettingsOpen = useAgencyStore((s) => s.setSettingsOpen)
  const openEntryHud = useAgencyStore((s) => s.openEntryHud)

  const activeZoneMeta = STUDIO_ZONES[activeStudioZone]

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex flex-wrap items-center justify-between gap-2.5 p-3.5">
      {/* Left: Active CEO & Co-CEO Online Sync Pill */}
      <button
        type="button"
        onClick={openEntryHud}
        title="Editar perfil de Co-CEO"
        className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-slate-200/12 bg-[#141822]/85 px-3 py-2 text-left backdrop-blur-xl shadow-xl shadow-black/40 transition-colors hover:border-slate-200/25 cursor-pointer"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950">
          <Crown className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-xs font-bold text-white">
              {currentUser?.name ?? 'Co-CEO'}
            </span>
            <span
              className={`h-2 w-2 rounded-full ${liveConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}
              title={liveConnected ? 'Sincronizado em tempo real' : 'Modo local'}
            />
          </div>
          <p className="truncate text-[11px] text-slate-400">
            {onlineCeos.length >= 2
              ? `2 Co-CEOs online (${onlineCeos.map((c) => c.name).join(' & ')})`
              : `${currentUser?.role ?? 'Co-CEO'} · Privado`}
          </p>
        </div>
      </button>

      {/* Center: Hybrid World Switcher (Coastal Island <-> Private Studio Interior) */}
      <nav
        aria-label="Navegação do mundo 3D"
        className="pointer-events-auto flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200/12 bg-[#141822]/85 p-1.5 backdrop-blur-xl shadow-xl shadow-black/40"
      >
        <button
          type="button"
          onClick={() => returnToIsland()}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            worldView === 'island'
              ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow-sm'
              : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Map className="h-3.5 w-3.5" />
          Ilha Blequi
        </button>

        <button
          type="button"
          onClick={() => enterStudioZone(activeStudioZone)}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            worldView === 'studio'
              ? 'bg-[#f4f7fc] text-slate-950 shadow-sm'
              : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          {worldView === 'studio' ? activeZoneMeta.shortName : 'Interior Estúdio'}
        </button>

        <div className="mx-1 h-4 w-px bg-slate-200/12" />

        {worldView === 'island' ? (
          <div className="flex items-center gap-0.5">
            {TIME_OPTIONS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTimeOfDay(id)}
                className={`flex items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-all cursor-pointer ${
                  timeOfDay === id
                    ? 'bg-white/15 text-amber-200'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
                title={`Iluminação: ${label}`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">{label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-0.5">
            {ROOM_SCALE_ORDER.map((scaleId) => {
              const meta = ROOM_SCALES[scaleId]
              const active = roomScale === scaleId
              return (
                <button
                  key={scaleId}
                  type="button"
                  onClick={() => setRoomScale(scaleId)}
                  className={`rounded-xl px-2 py-1.5 text-[11px] font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-white/15 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  {meta.size}m
                </button>
              )
            })}
            <button
              type="button"
              onClick={toggleFloorGrid}
              className={`rounded-xl p-1.5 text-xs transition-all cursor-pointer ${
                showFloorGrid ? 'bg-blue-500/25 text-blue-200' : 'text-slate-400 hover:text-white'
              }`}
              title="Grade modular"
            >
              <Grid3x3 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={resetCamera}
          className="rounded-xl p-1.5 text-slate-400 transition-all hover:bg-white/5 hover:text-white cursor-pointer"
          title="Enquadrar câmera"
        >
          <Focus className="h-3.5 w-3.5" />
        </button>
      </nav>

      {/* Right: Comfort Score, FPS, Add Member, Gemini/Network Config, Projects */}
      <div className="pointer-events-auto flex items-center gap-1.5">
        <div
          className="hidden items-center gap-2 rounded-xl border border-slate-200/12 bg-[#141822]/85 px-2.5 py-2 text-[11px] backdrop-blur-xl xl:flex"
          title="Conforto da ilha & FPS adaptativo (padrão Coastal World)"
        >
          <span className="flex items-center gap-1 font-semibold text-amber-300">
            <Heart className="h-3 w-3 fill-amber-400/30" />
            {comfortScore}%
          </span>
          <span className="h-3 w-px bg-white/10" />
          <span className="flex items-center gap-1 font-mono text-emerald-300">
            <Gauge className="h-3 w-3" />
            {liveFps} FPS
          </span>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200/12 bg-[#141822]/85 px-3 py-2 text-xs font-medium text-slate-200 backdrop-blur-xl hover:border-slate-200/25 cursor-pointer"
          title="Adicionar novo funcionário"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Equipe</span>
        </button>

        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className={`relative flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold backdrop-blur-xl transition-all cursor-pointer ${
            serverMeta?.geminiConfigured
              ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25'
              : 'border-amber-400/45 bg-amber-500/18 text-amber-100 hover:bg-amber-500/28'
          }`}
          title="Configurar Gemini API, Rede para sua Amiga e Aprovações CEO"
        >
          <Settings2 className="h-3.5 w-3.5" />
          <span>{serverMeta?.geminiConfigured ? 'Gemini Live' : 'Config Gemini'}</span>
          {proposalsCount > 0 && (
            <span className="ml-0.5 rounded-full bg-amber-400 px-1.5 py-0.2 text-[10px] font-bold text-slate-950">
              {proposalsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setProjectsOpen(!isProjectsOpen)}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium backdrop-blur-xl transition-all cursor-pointer ${
            isProjectsOpen
              ? 'border-blue-400/50 bg-blue-500/20 text-blue-100'
              : 'border-slate-200/12 bg-[#141822]/85 text-slate-200 hover:border-slate-200/25'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Projetos</span>
        </button>
      </div>
    </header>
  )
}
