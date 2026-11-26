import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Briefcase,
  Crown,
  KeyRound,
  Plus,
  Sparkles,
  Wifi,
  X,
} from 'lucide-react'
import {
  ROLE_PRESETS,
  SKILL_PRESETS,
} from '@funcionarios/providers'
import { useAgencyStore } from '@plataforma/store/useAgencyStore'

export function AgencyEntryHud() {
  const currentUser = useAgencyStore((s) => s.currentUser)
  const savedCeoCode = useAgencyStore((s) => s.ceoCode)
  const roomScale = useAgencyStore((s) => s.roomScale)
  const serverMeta = useAgencyStore((s) => s.serverMeta)
  const fetchServerMeta = useAgencyStore((s) => s.fetchServerMeta)
  const enterAgency = useAgencyStore((s) => s.enterAgency)

  const [ceoSlot, setCeoSlot] = useState<'ceo-1' | 'ceo-2'>(
    currentUser?.ceoSlot ?? 'ceo-1'
  )
  const [name, setName] = useState(currentUser?.name ?? '')
  const [role, setRole] = useState(currentUser?.role || 'Co-CEO & Fundadora')
  const [ceoCode, setCeoCode] = useState(savedCeoCode || 'blequi-ceo')
  const [skills, setSkills] = useState<string[]>(
    currentUser?.skills?.length ? currentUser.skills : ['Direção de Arte', 'Diorama 3D']
  )
  const [skillDraft, setSkillDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchServerMeta()
  }, [fetchServerMeta])

  const addSkill = (raw: string) => {
    const cleaned = raw.trim()
    if (!cleaned) return
    const exists = skills.some((s) => s.toLowerCase() === cleaned.toLowerCase())
    if (!exists && skills.length < 12) {
      setSkills((prev) => [...prev, cleaned])
    }
    setSkillDraft('')
  }

  const togglePresetSkill = (preset: string) => {
    const exists = skills.some((s) => s.toLowerCase() === preset.toLowerCase())
    if (exists) {
      setSkills((prev) => prev.filter((s) => s.toLowerCase() !== preset.toLowerCase()))
    } else if (skills.length < 12) {
      setSkills((prev) => [...prev, preset])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMessage('Informe seu nome para entrar na Ilha Blequi.')
      return
    }
    if (!ceoCode.trim()) {
      setErrorMessage('Informe a chave privada das Co-CEOs.')
      return
    }
    setErrorMessage(null)
    setSubmitting(true)
    const result = await enterAgency({
      name: name.trim(),
      entityType: 'human',
      role: role.trim() || 'Co-CEO & Fundadora',
      skills,
      roomScale,
      ceoSlot,
      ceoCode: ceoCode.trim(),
    })
    setSubmitting(false)
    if (!result.ok) {
      setErrorMessage(result.error || 'Chave CEO inválida.')
    }
  }

  const onlineCeo1 = serverMeta?.onlineCeos.find((c) => c.ceoSlot === 'ceo-1')
  const onlineCeo2 = serverMeta?.onlineCeos.find((c) => c.ceoSlot === 'ceo-2')

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
      {/* Left studio corner badge & island status */}
      <div className="pointer-events-none hidden h-full flex-col justify-between py-2 lg:flex">
        <div className="pointer-events-auto inline-flex w-fit items-center gap-3 rounded-2xl border border-slate-200/15 bg-[#141822]/82 px-4 py-2.5 backdrop-blur-xl shadow-2xl shadow-black/40">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-extrabold text-slate-950 shadow-sm">
            B
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-white">Ilha Blequi · Agência 3D Privada</p>
            <p className="text-xs text-slate-300">
              Acesso exclusivo das 2 Co-CEOs · {serverMeta?.agentCount ?? 4} funcionários ativos
            </p>
          </div>
        </div>

        <div className="pointer-events-auto max-w-md space-y-2.5 rounded-2xl border border-slate-200/12 bg-[#141822]/78 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-200">
            <Sparkles className="h-3.5 w-3.5" />
            Mundo Vivo com Gemini + Antigravity
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            Luma, Kael, Vex e Nori já estão andando pela Ilha Blequi e cuidando dos seus mini-estúdios.
            Converse com eles, peça para auto-decorarem seus escritórios e celebre cada criação para elevar o bem-estar da equipe.
          </p>
          {serverMeta && serverMeta.networkUrls.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-white/[0.05] px-3 py-1.5 font-mono text-[11px] text-emerald-300">
              <Wifi className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Link rede local: {serverMeta.networkUrls[0]}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right CEO Private Access Card */}
      <section
        aria-label="Acesso privado das Co-CEOs"
        className="pointer-events-auto mx-auto flex max-h-[calc(100vh-2rem)] w-full max-w-[452px] flex-col overflow-hidden rounded-3xl border border-slate-200/15 bg-[#151a26]/92 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl lg:mx-0"
      >
        <div className="border-b border-slate-200/10 px-6 pt-5 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
                <Crown className="h-4 w-4 text-amber-400" />
                Entrar como Co-CEO
              </h1>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                Espaço local privado sincronizado entre você e sua amiga.
              </p>
            </div>
            <span
              className={`shrink-0 rounded-xl border px-2.5 py-1 text-[11px] font-medium ${
                serverMeta?.geminiConfigured
                  ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200'
                  : 'border-amber-400/30 bg-amber-500/15 text-amber-200'
              }`}
            >
              {serverMeta?.geminiConfigured ? 'Gemini Live' : 'Modo Local'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {/* CEO Slot Picker */}
            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-slate-200">
                Qual das duas Co-CEOs está entrando?
              </legend>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCeoSlot('ceo-1')}
                  className={`flex flex-col rounded-2xl border px-3.5 py-2.5 text-left transition-all cursor-pointer ${
                    ceoSlot === 'ceo-1'
                      ? 'border-amber-400/70 bg-amber-500/15 text-white shadow-sm'
                      : 'border-slate-200/10 bg-white/[0.02] text-slate-400 hover:border-slate-200/20 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-semibold">Co-CEO 1 (Host)</span>
                  <span className="mt-0.5 text-[11px] text-slate-400">
                    {onlineCeo1 ? `Online: ${onlineCeo1.name}` : 'Assento principal'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCeoSlot('ceo-2')}
                  className={`flex flex-col rounded-2xl border px-3.5 py-2.5 text-left transition-all cursor-pointer ${
                    ceoSlot === 'ceo-2'
                      ? 'border-sky-400/70 bg-sky-500/15 text-white shadow-sm'
                      : 'border-slate-200/10 bg-white/[0.02] text-slate-400 hover:border-slate-200/20 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-semibold">Co-CEO 2 (Amiga)</span>
                  <span className="mt-0.5 text-[11px] text-slate-400">
                    {onlineCeo2 ? `Online: ${onlineCeo2.name}` : 'Acesso LAN / Tailscale'}
                  </span>
                </button>
              </div>
            </fieldset>

            {/* Name */}
            <div>
              <label htmlFor="entry-name" className="mb-1.5 block text-xs font-semibold text-slate-200">
                Seu nome (os personagens vão te chamar assim)
              </label>
              <input
                id="entry-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errorMessage) setErrorMessage(null)
                }}
                placeholder="Ex: Ana / Bia / Sertório..."
                className="w-full rounded-xl border border-slate-200/15 bg-[#0f131d] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* CEO Private Code */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="entry-ceo-code"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-200"
                >
                  <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                  Chave Privada das Co-CEOs
                </label>
                {serverMeta?.usingDefaultCeoCode && (
                  <span className="font-mono text-[10px] text-slate-400">padrão: blequi-ceo</span>
                )}
              </div>
              <input
                id="entry-ceo-code"
                type="password"
                autoComplete="current-password"
                value={ceoCode}
                onChange={(e) => {
                  setCeoCode(e.target.value)
                  if (errorMessage) setErrorMessage(null)
                }}
                placeholder="blequi-ceo"
                className="w-full rounded-xl border border-slate-200/15 bg-[#0f131d] px-3.5 py-2.5 font-mono text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="entry-role"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-200"
              >
                <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                Seu papel na Blequi
              </label>
              <input
                id="entry-role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-slate-200/15 bg-[#0f131d] px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ROLE_PRESETS.slice(0, 4).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRole(preset)}
                    className={`rounded-lg border px-2 py-1 text-[11px] transition-colors cursor-pointer ${
                      role.toLowerCase() === preset.toLowerCase()
                        ? 'border-amber-400/60 bg-amber-500/15 text-amber-100'
                        : 'border-slate-200/10 bg-white/[0.03] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div>
              <label htmlFor="entry-skill" className="mb-1.5 block text-xs font-semibold text-slate-200">
                Suas especialidades
              </label>
              <div className="flex gap-1.5">
                <input
                  id="entry-skill"
                  type="text"
                  value={skillDraft}
                  onChange={(e) => setSkillDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      addSkill(skillDraft)
                    }
                  }}
                  placeholder="Ex: Direção Criativa, Blender..."
                  className="flex-1 rounded-xl border border-slate-200/15 bg-[#0f131d] px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => addSkill(skillDraft)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200/15 bg-white/[0.06] px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/12 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              {skills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-500/20 px-2 py-0.5 text-[11px] font-medium text-blue-100 ring-1 ring-blue-400/35"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => setSkills((prev) => prev.filter((s) => s !== skill))}
                        className="rounded p-0.5 hover:bg-blue-400/20 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-1">
                {SKILL_PRESETS.slice(0, 6).map((preset) => {
                  const active = skills.some((s) => s.toLowerCase() === preset.toLowerCase())
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => togglePresetSkill(preset)}
                      className={`rounded-lg border px-2 py-0.5 text-[10px] transition-colors cursor-pointer ${
                        active
                          ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
                          : 'border-slate-200/10 bg-white/[0.02] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}
                      {preset}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200/10 bg-[#151a26]/95 px-6 py-4">
            {errorMessage && (
              <p
                role="alert"
                className="mb-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
              >
                {errorMessage}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-orange-500/25 transition-all hover:brightness-110 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Conectando à Ilha Blequi...' : 'Entrar na Ilha Blequi'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
