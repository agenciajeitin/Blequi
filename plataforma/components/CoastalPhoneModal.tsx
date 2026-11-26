import { useEffect, useState } from 'react'
import {
  Building2,
  CheckCircle2,
  Circle,
  ClipboardList,
  Compass,
  Gauge,
  Heart,
  MapPin,
  MessageCircle,
  Plus,
  Shirt,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import type { CoastalPhoneTab, StudioZoneId } from '@funcionarios/types'
import { AGENT_PROVIDERS, PROP_CATALOG, STUDIO_ZONES } from '@funcionarios/providers'
import { playerLiveTransform, useAgencyStore } from '@plataforma/store/useAgencyStore'
import { COASTAL_AVATAR_PALETTES } from '@ambiente/shaders/coastalShaders'
import { COASTAL_STUDIO_LOCATIONS } from '@ambiente/island/CoastalStudios'
import { coastalAudio } from '@ambiente/audio/coastalAudio'

const PHONE_TABS: { id: CoastalPhoneTab; label: string; color: string; Icon: typeof MapPin }[] = [
  { id: 'map', label: 'Mapa', color: '#3b82f6', Icon: MapPin },
  { id: 'studios', label: 'Equipe', color: '#02c6a7', Icon: Users },
  { id: 'wellbeing', label: 'Bem-Estar', color: '#f59e0b', Icon: Sparkles },
  { id: 'customize', label: 'Avatar', color: '#f2676f', Icon: Shirt },
  { id: 'projects', label: 'Projetos', color: '#6366f1', Icon: ClipboardList },
]

function worldToMapPercent(wx: number, wz: number) {
  // Maps island x [-28..28] -> 8..92%, z [-20..28] -> 10..88%
  const x = Math.max(8, Math.min(92, 50 + (wx / 28) * 42))
  const y = Math.max(10, Math.min(88, 44 + (wz / 27) * 38))
  return { x, y }
}

/**
 * 1:1 Coastal World Hand-Held Interactive Smartphone (steps/105/media_0.png):
 * - Stylized pastel thumb (left) + 3 cute rounded fingers (right) tinted with your avatar color
 * - Top floating white capsule nav bar with 5 apps + navy pill tip holding glossy mint X button
 * - Interactive Island Map, Team/Studios Directory, Wellbeing & 3D Creations, Avatar Preview, Projects
 */
export function CoastalPhoneModal() {
  const isOpen = useAgencyStore((s) => s.isPhoneOpen)
  const phoneTab = useAgencyStore((s) => s.phoneTab)
  const playerAvatar = useAgencyStore((s) => s.playerAvatar)
  const agents = useAgencyStore((s) => s.agents)
  const props = useAgencyStore((s) => s.props)
  const projects = useAgencyStore((s) => s.projects)
  const comfortScore = useAgencyStore((s) => s.comfortScore)
  const liveFps = useAgencyStore((s) => s.liveFps)
  const onlineCeos = useAgencyStore((s) => s.onlineCeos)
  const currentUser = useAgencyStore((s) => s.currentUser)

  const setPhoneOpen = useAgencyStore((s) => s.setPhoneOpen)
  const setPhoneTab = useAgencyStore((s) => s.setPhoneTab)
  const setCustomizerOpen = useAgencyStore((s) => s.setCustomizerOpen)
  const setCreateModalOpen = useAgencyStore((s) => s.setCreateModalOpen)
  const teleportPlayerTo = useAgencyStore((s) => s.teleportPlayerTo)
  const enterStudioZone = useAgencyStore((s) => s.enterStudioZone)
  const selectAgent = useAgencyStore((s) => s.selectAgent)
  const rewardAgentOrProp = useAgencyStore((s) => s.rewardAgentOrProp)
  const toggleDeliverable = useAgencyStore((s) => s.toggleDeliverable)

  const [selectedPinZone, setSelectedPinZone] = useState<Exclude<StudioZoneId, 'editorial'> | null>(null)
  const [playerPin, setPlayerPin] = useState(() => worldToMapPercent(playerLiveTransform.x, playerLiveTransform.z))

  useEffect(() => {
    if (!isOpen || phoneTab !== 'map') return
    const id = setInterval(() => {
      setPlayerPin(worldToMapPercent(playerLiveTransform.x, playerLiveTransform.z))
    }, 200)
    return () => clearInterval(id)
  }, [isOpen, phoneTab])

  if (!isOpen) return null

  const palette = COASTAL_AVATAR_PALETTES[playerAvatar.colorIndex] ?? COASTAL_AVATAR_PALETTES[4]
  const selectedPinLoc = selectedPinZone ? COASTAL_STUDIO_LOCATIONS[selectedPinZone] : null
  const selectedPinMeta = selectedPinZone ? STUDIO_ZONES[selectedPinZone] : null
  const selectedPinOwner = selectedPinZone ? agents.find((a) => a.zone === selectedPinZone) : null

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-[#23325b]/45 p-4 backdrop-blur-[4px]"
      onClick={() => setPhoneOpen(false)}
    >
      {/* Hand-Held Smartphone Wrapper */}
      <div
        className="cw-pop-in relative flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Stylized Character Left Thumb gripping phone (exact Coastal World silhouette!) */}
        <div
          className="pointer-events-none absolute -left-16 top-[28%] hidden h-56 w-28 -rotate-[18deg] rounded-full sm:block"
          style={{
            background: `radial-gradient(circle at 65% 35%, ${palette.phoneCase}, ${palette.handColor} 72%, ${palette.body} 100%)`,
            boxShadow: 'inset -8px -12px 24px rgba(32,20,56,0.22)',
          }}
        />
        {/* Stylized Character Right 3 Curled Fingers gripping phone edge */}
        <div className="pointer-events-none absolute -right-11 top-[14%] z-20 hidden flex-col gap-5 sm:flex">
          {[0, 1, 2].map((f) => (
            <div
              key={f}
              className="h-20 w-16 rounded-full"
              style={{
                background: `radial-gradient(circle at 35% 30%, ${palette.phoneCase}, ${palette.handColor} 70%, ${palette.body} 100%)`,
                boxShadow: 'inset -6px -8px 16px rgba(32,20,56,0.25), -6px 8px 14px rgba(20,28,60,0.2)',
              }}
            />
          ))}
        </div>

        {/* Rounded Pastel Smartphone Frame */}
        <div
          className="relative z-10 flex h-[min(84vh,690px)] w-[min(92vw,396px)] flex-col rounded-[40px] p-3 shadow-[0_28px_72px_rgba(20,34,74,0.48)]"
          style={{ backgroundColor: palette.phoneCase }}
        >
          {/* Phone Screen */}
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] bg-[#f4f8ff]">
            {/* 1:1 Floating Top Capsule App Bar + Navy Cap with Mint Close Button */}
            <div className="relative z-20 flex items-center justify-center px-3 pt-3 pb-2">
              <div className="flex w-full items-center justify-between rounded-full bg-white p-1.5 shadow-[0_8px_22px_rgba(42,52,102,0.16)]">
                <div className="flex flex-1 items-center justify-around">
                  {PHONE_TABS.map(({ id, label, color, Icon }) => {
                    const active = phoneTab === id
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          coastalAudio.playPop(600, 0.06)
                          setPhoneTab(id)
                        }}
                        title={label}
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                          active ? 'scale-110 shadow-sm' : 'opacity-65 hover:opacity-100 hover:bg-[#f2f6fc]'
                        }`}
                        style={{
                          backgroundColor: active ? `${color}22` : undefined,
                          color,
                        }}
                      >
                        <Icon className="h-5 w-5 stroke-[2.5]" />
                      </button>
                    )
                  })}
                </div>

                {/* Iconic #3b3777 Navy Cap housing glossy Mint X button (1:1 steps/105/media_0.png!) */}
                <div className="ml-1 flex items-center rounded-full bg-[#3b3777] p-1 pl-2">
                  <button
                    type="button"
                    onClick={() => {
                      coastalAudio.playPop(480, 0.06)
                      setPhoneOpen(false)
                    }}
                    aria-label="Fechar celular"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-b from-[#20e4c4] to-[#02c6a7] text-white shadow-inner transition-transform hover:scale-110"
                  >
                    <X className="h-4 w-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            </div>

            {/* ================= TAB 1: INTERACTIVE ISLAND MAP (1:1 steps/105/media_0.png!) ================= */}
            {phoneTab === 'map' && (
              <div className="relative flex-1 overflow-hidden bg-gradient-to-b from-[#3db3e8] via-[#4cc2ec] to-[#3aa9e0]">
                {/* Stylized Top-Down SVG Coastal Blequi Island Map */}
                <svg viewBox="0 0 100 100" className="h-full w-full select-none">
                  {/* Subtle ocean wave rings */}
                  <ellipse cx="50" cy="46" rx="41" ry="33" fill="#7be0f2" opacity="0.45" />
                  <ellipse cx="50" cy="46" rx="38" ry="30" fill="#ffffff" opacity="0.82" />
                  {/* Warm golden sandy shoreline */}
                  <rect x="14" y="18" width="72" height="54" rx="18" fill="#f2d699" />
                  {/* Lush green island plateau */}
                  <rect x="17" y="21" width="66" height="46" rx="15" fill="#64cf7c" />
                  {/* Coastal boulevards */}
                  <rect x="24" y="54" width="52" height="7" rx="3.5" fill="#dde4ee" />
                  <rect x="46" y="34" width="8" height="27" rx="3" fill="#dde4ee" />
                  <circle cx="50" cy="44" r="9.5" fill="#e8eef6" />
                  {/* Wooden Pier jutting South */}
                  <rect x="46.5" y="65" width="7" height="16" rx="1.5" fill="#9a7852" />
                  {/* Satellite Palm Islet Left Bay */}
                  <circle cx="15" cy="77" r="5" fill="#ffffff" opacity="0.7" />
                  <circle cx="15" cy="77" r="3.6" fill="#f2d699" />
                  <circle cx="15" cy="77" r="2.2" fill="#47c46a" />
                  {/* Twin Lighthouses */}
                  <circle cx="12" cy="52" r="4" fill="#8998a6" />
                  <circle cx="12" cy="52" r="2" fill="#ffffff" />
                  <circle cx="88" cy="36" r="4" fill="#8998a6" />
                  <circle cx="88" cy="36" r="2" fill="#ffffff" />
                </svg>

                {/* Live Glowing Cyan Player Position Smiley Pin */}
                <div
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
                  style={{ left: `${playerPin.x}%`, top: `${playerPin.y}%` }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white bg-[#2dd4f7] text-white shadow-[0_0_0_5px_rgba(45,212,247,0.35)]">
                    <span className="text-xs font-black">☺</span>
                  </div>
                </div>

                {/* Partner Co-CEO Live Pin on Island Map */}
                {onlineCeos
                  .filter((c) => c.ceoSlot !== currentUser?.ceoSlot && c.activeView === 'island' && c.position)
                  .map((partner) => {
                    const pp = worldToMapPercent(partner.position![0], partner.position![2])
                    return (
                      <div
                        key={partner.id}
                        className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
                        style={{ left: `${pp.x}%`, top: `${pp.y}%` }}
                        title={`${partner.name} (Co-CEO)`}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white bg-[#f6b93b] text-xs shadow-[0_0_0_5px_rgba(246,185,59,0.35)]">
                          👑
                        </div>
                      </div>
                    )
                  })}

                {/* Clickable #3b3777 Teardrop Studio Pins (1:1 Coastal World Map Pins!) */}
                {(Object.keys(COASTAL_STUDIO_LOCATIONS) as Exclude<StudioZoneId, 'editorial'>[]).map(
                  (zoneId) => {
                    const loc = COASTAL_STUDIO_LOCATIONS[zoneId]
                    const owner = agents.find((a) => a.zone === zoneId)
                    const active = selectedPinZone === zoneId
                    return (
                      <button
                        key={zoneId}
                        type="button"
                        onClick={() => {
                          coastalAudio.playPop(660, 0.06)
                          setSelectedPinZone(active ? null : zoneId)
                        }}
                        className={`absolute -translate-x-1/2 -translate-y-full transition-transform ${
                          active ? 'z-20 scale-115' : 'z-10 hover:scale-110'
                        }`}
                        style={{ left: `${loc.mapCoords.x}%`, top: `${loc.mapCoords.y}%` }}
                      >
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-full rounded-br-sm -rotate-45 bg-[#3b3777] p-1 shadow-[0_10px_20px_rgba(32,40,86,0.36)]">
                          <div className="flex h-full w-full rotate-45 flex-col items-center justify-center rounded-full bg-white text-center">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: loc.badgeColor }}
                            />
                            <span className="mt-0.5 text-[8px] font-black leading-none text-[#3b3777]">
                              {owner?.name || STUDIO_ZONES[zoneId].shortName}
                            </span>
                          </div>
                        </div>
                      </button>
                    )
                  }
                )}

                {/* Bottom Studio Quick-Visit Card when a Map Pin is tapped */}
                {selectedPinLoc && selectedPinMeta ? (
                  <div className="cw-pop-in absolute inset-x-3 bottom-3 z-30 rounded-[24px] bg-white p-3.5 shadow-[0_14px_34px_rgba(24,42,88,0.28)]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#02c6a7]">
                          {selectedPinOwner ? `Estúdio de ${selectedPinOwner.name}` : 'Mini-Estúdio'}
                        </p>
                        <h3 className="text-sm font-black text-[#3b3777]">
                          {selectedPinOwner?.studioTheme.studioName || selectedPinMeta.name}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPinZone(null)}
                        className="rounded-full bg-[#f1f4fa] p-1 text-[#3b3777]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          coastalAudio.playChime()
                          teleportPlayerTo(selectedPinLoc.teleportPoint)
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-full bg-[#eef4fb] py-2 text-xs font-extrabold text-[#3b3777] hover:bg-[#dfe9f7]"
                      >
                        <Compass className="h-3.5 w-3.5 text-[#3b82f6]" />
                        Ir até lá
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          coastalAudio.playChime()
                          enterStudioZone(selectedPinLoc.zoneId)
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-full bg-[#02c6a7] py-2 text-xs font-extrabold text-white hover:brightness-105"
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        Entrar no Estúdio
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pointer-events-none absolute inset-x-4 bottom-3 rounded-full bg-white/92 px-4 py-2 text-center text-xs font-extrabold text-[#3b3777] shadow-md">
                    Toque em um pin da Ilha Blequi para viajar
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 2: EQUIPE & ESTÚDIOS ================= */}
            {phoneTab === 'studios' && (
              <div className="flex-1 space-y-2.5 overflow-y-auto px-3.5 pt-1 pb-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-black text-[#3b3777]">Equipe da Ilha ({agents.length})</h3>
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(true)}
                    className="flex items-center gap-1 rounded-full bg-[#02c6a7] px-3 py-1 text-[11px] font-extrabold text-white shadow-sm hover:brightness-105"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[2.8]" />
                    Contratar
                  </button>
                </div>

                {agents.map((ag) => {
                  const prov = ag.provider ? AGENT_PROVIDERS[ag.provider] : null
                  return (
                    <div
                      key={ag.id}
                      className="rounded-[22px] bg-white p-3.5 shadow-[0_6px_18px_rgba(59,55,119,0.08)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-white shadow-sm"
                            style={{ backgroundColor: ag.accentColor }}
                          >
                            {ag.name.slice(0, 1)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-[#3b3777]">{ag.name}</p>
                            <p className="truncate text-[11px] font-semibold text-[#7976a3]">{ag.role}</p>
                          </div>
                        </div>
                        {prov && (
                          <span
                            className="rounded-full px-2 py-0.5 font-mono text-[10px] font-bold"
                            style={{ backgroundColor: `${prov.color}18`, color: prov.color }}
                          >
                            {prov.badge}
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5 flex items-center gap-2 text-[11px] font-bold text-[#02c6a7]">
                        <Heart className="h-3.5 w-3.5 fill-[#02c6a7]" />
                        <span>Bem-estar {ag.wellbeing.score}%</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#ebf2fa]">
                          <div
                            className="h-full rounded-full bg-[#02c6a7]"
                            style={{ width: `${ag.wellbeing.score}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => selectAgent(ag.id)}
                          className="flex items-center justify-center gap-1.5 rounded-full bg-[#f1f5fc] py-1.5 text-xs font-extrabold text-[#3b3777] hover:bg-[#e4ecf9]"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-[#3b82f6]" />
                          Conversar
                        </button>
                        <button
                          type="button"
                          onClick={() => enterStudioZone(ag.zone)}
                          className="flex items-center justify-center gap-1.5 rounded-full bg-[#02c6a7] py-1.5 text-xs font-extrabold text-white hover:brightness-105"
                        >
                          <Building2 className="h-3.5 w-3.5" />
                          Estúdio
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ================= TAB 3: BEM-ESTAR & CRIAÇÕES 3D ================= */}
            {phoneTab === 'wellbeing' && (
              <div className="flex-1 space-y-3 overflow-y-auto px-3.5 pt-1 pb-4">
                <div className="rounded-[24px] bg-gradient-to-br from-[#02c6a7] to-[#34d8ba] p-4 text-white shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-wider opacity-90">
                        Conforto da Ilha Blequi
                      </p>
                      <p className="mt-0.5 text-3xl font-black">{comfortScore}%</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 font-mono text-[11px] font-bold">
                        <Gauge className="h-3.5 w-3.5" />
                        {liveFps} FPS
                      </span>
                      <span className="text-[10px] font-bold opacity-90">
                        {onlineCeos.length || 1} Co-CEO online
                      </span>
                    </div>
                  </div>
                </div>

                <h4 className="px-1 text-xs font-black uppercase tracking-wider text-[#7976a3]">
                  Criações 3D da Equipe ({props.length})
                </h4>

                <div className="space-y-2">
                  {props.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-[20px] bg-white p-3 shadow-[0_6px_16px_rgba(59,55,119,0.07)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-black text-[#3b3777]">{p.title}</p>
                          <p className="text-[11px] font-semibold text-[#7976a3]">
                            {PROP_CATALOG[p.kind]?.label} · por {p.createdByName}
                          </p>
                        </div>
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-[#eef2f8]"
                          style={{ backgroundColor: p.color }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        {p.approved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#02c6a7]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Celebrado pelas CEOs
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => rewardAgentOrProp({ propId: p.id })}
                            className="rounded-full bg-[#f6d35f] px-3 py-1 text-[11px] font-black text-[#3b3777] hover:brightness-105"
                          >
                            Celebrar +{p.wellbeingBonus} ✨
                          </button>
                        )}
                        <span className="font-mono text-[10px] text-[#9aa0bc]">{p.createdAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= TAB 4: AVATAR CO-CEO ================= */}
            {phoneTab === 'customize' && (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
                <div
                  className="flex h-28 w-28 items-center justify-center rounded-full shadow-lg ring-8 ring-white"
                  style={{ backgroundColor: palette.body }}
                >
                  <div
                    className="flex h-16 w-16 flex-col items-center justify-center rounded-full"
                    style={{ backgroundColor: palette.face }}
                  >
                    <div className="flex gap-3">
                      <span className="h-3 w-2 rounded-full bg-[#241f46]" />
                      <span className="h-3 w-2 rounded-full bg-[#241f46]" />
                    </div>
                    <span className="mt-1.5 h-2 w-4 rounded-b-full border-b-[2.5px] border-[#241f46]" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-[#3b3777]">Seu Avatar Co-CEO</h3>
                  <p className="mt-1 text-xs font-semibold text-[#7976a3]">
                    Mude cores, expressão, fone, gorro, coroa, mochila, asas e tênis ao vivo em 3D!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    coastalAudio.playChime()
                    setCustomizerOpen(true)
                  }}
                  className="cw-cta cw-cta-mint w-full"
                >
                  <span className="cw-cta-inner flex w-full items-center justify-center gap-2 py-3 text-sm font-extrabold">
                    <Shirt className="h-4 w-4" />
                    Abrir Customizador 3D
                  </span>
                </button>
              </div>
            )}

            {/* ================= TAB 5: PROJETOS & MISSÕES BLEQUI ================= */}
            {phoneTab === 'projects' && (
              <div className="flex-1 space-y-3 overflow-y-auto px-3.5 pt-1 pb-4">
                <h3 className="px-1 text-sm font-black text-[#3b3777]">Missões & Roadmap</h3>
                {projects.map((proj) => {
                  const zone = STUDIO_ZONES[proj.zone]
                  return (
                    <div
                      key={proj.id}
                      className="rounded-[22px] bg-white p-3.5 shadow-[0_6px_18px_rgba(59,55,119,0.08)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-[#eef3fc] px-2.5 py-0.5 font-mono text-[10px] font-extrabold text-[#3b3777]">
                          {proj.code}
                        </span>
                        <span className="text-[11px] font-extrabold text-[#02c6a7]">
                          {proj.progress}%
                        </span>
                      </div>
                      <h4 className="mt-1.5 text-sm font-black text-[#3b3777]">{proj.name}</h4>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf2fa]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${proj.progress}%`, backgroundColor: zone.color }}
                        />
                      </div>
                      <div className="mt-2.5 space-y-1">
                        {proj.deliverables.map((del) => (
                          <button
                            key={del.id}
                            type="button"
                            onClick={() => toggleDeliverable(proj.id, del.id)}
                            className="flex w-full items-start gap-2 rounded-xl px-1.5 py-1 text-left text-[11px] font-bold hover:bg-[#f5f8fd]"
                          >
                            {del.done ? (
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#02c6a7]" />
                            ) : (
                              <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#b4bdd4]" />
                            )}
                            <span className={del.done ? 'text-[#9aa0bc] line-through' : 'text-[#3b3777]'}>
                              {del.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
