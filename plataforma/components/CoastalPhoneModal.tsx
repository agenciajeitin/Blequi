import { useState } from 'react'
import {
  Building2,
  CheckCircle2,
  Circle,
  ClipboardList,
  Gauge,
  Heart,
  MessageCircle,
  MessagesSquare,
  Plus,
  Shirt,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import type { CoastalPhoneTab } from '@funcionarios/types'
import { AGENT_PROVIDERS, PROP_CATALOG, STUDIO_ZONES } from '@funcionarios/providers'
import { useAgencyStore } from '@plataforma/store/useAgencyStore'
import { COASTAL_AVATAR_PALETTES } from '@ambiente/shaders/coastalShaders'
import { coastalAudio } from '@ambiente/audio/coastalAudio'
import { MessagesApp } from './MessagesApp'
import { AgentPortrait } from './chat/AgentPortrait'

const PHONE_TABS: { id: CoastalPhoneTab; label: string; color: string; Icon: typeof MessagesSquare }[] = [
  { id: 'messages', label: 'Mensagens', color: '#3b82f6', Icon: MessagesSquare },
  { id: 'studios', label: 'Equipe', color: '#02c6a7', Icon: Users },
  { id: 'wellbeing', label: 'Bem-Estar', color: '#f59e0b', Icon: Sparkles },
  { id: 'customize', label: 'Avatar', color: '#f2676f', Icon: Shirt },
  { id: 'projects', label: 'Projetos', color: '#6366f1', Icon: ClipboardList },
]

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

  const setPhoneOpen = useAgencyStore((s) => s.setPhoneOpen)
  const setPhoneTab = useAgencyStore((s) => s.setPhoneTab)
  const setCustomizerOpen = useAgencyStore((s) => s.setCustomizerOpen)
  const setCreateModalOpen = useAgencyStore((s) => s.setCreateModalOpen)
  const enterStudioZone = useAgencyStore((s) => s.enterStudioZone)
  const setActiveThread = useAgencyStore((s) => s.setActiveThread)
  const removeAgent = useAgencyStore((s) => s.removeAgent)
  const rewardAgentOrProp = useAgencyStore((s) => s.rewardAgentOrProp)
  const toggleDeliverable = useAgencyStore((s) => s.toggleDeliverable)

  const [confirmFireId, setConfirmFireId] = useState<string | null>(null)

  if (!isOpen) return null

  const palette = COASTAL_AVATAR_PALETTES[playerAvatar.colorIndex] ?? COASTAL_AVATAR_PALETTES[4]

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

            {/* ================= TAB 1: MENSAGENS (grupos + conversas individuais) ================= */}
            {phoneTab === 'messages' && <MessagesApp />}

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
                          <AgentPortrait agent={ag} size={40} showStatus />
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

                      <div className="mt-3 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveThread({ kind: 'agent', id: ag.id })
                            setPhoneTab('messages')
                          }}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#f1f5fc] py-1.5 text-xs font-extrabold text-[#3b3777] hover:bg-[#e4ecf9]"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-[#3b82f6]" />
                          Conversar
                        </button>
                        <button
                          type="button"
                          onClick={() => enterStudioZone(ag.zone)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#02c6a7] py-1.5 text-xs font-extrabold text-white hover:brightness-105"
                        >
                          <Building2 className="h-3.5 w-3.5" />
                          Sede
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmFireId(confirmFireId === ag.id ? null : ag.id)}
                          title={`Mandar ${ag.name} embora`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff0f1] text-[#f2676f] hover:bg-[#ffe1e4]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {confirmFireId === ag.id && (
                        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-2xl bg-[#fff1f2] px-3 py-2 text-[11px]">
                          <span className="font-extrabold text-[#be123c]">Mandar embora?</span>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                coastalAudio.playPop(360, 0.08)
                                setConfirmFireId(null)
                                void removeAgent(ag.id)
                              }}
                              className="rounded-full bg-[#f2676f] px-2.5 py-0.5 font-extrabold text-white"
                            >
                              Sim
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmFireId(null)}
                              className="rounded-full bg-white px-2.5 py-0.5 font-bold text-[#6c6996]"
                            >
                              Não
                            </button>
                          </div>
                        </div>
                      )}
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
                        {onlineCeos.length || 1} CEO online
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
                  <h3 className="text-lg font-black text-[#3b3777]">Seu Avatar CEO</h3>
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
