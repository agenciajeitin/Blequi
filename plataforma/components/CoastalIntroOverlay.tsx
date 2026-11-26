import { useEffect, useState } from 'react'
import { ArrowRight, Crown, KeyRound, MessageSquare, Wifi, X } from 'lucide-react'
import { useAgencyStore } from '@plataforma/store/useAgencyStore'
import { coastalAudio } from '@ambiente/audio/coastalAudio'

const WELCOME_LINES = [
  'Bem-vindas a bordo, Co-CEOs! Eu sou a Nori, curadora da Ilha Blequi...',
  'Luma, Kael, Vex e nossos mini-estúdios já estão prontos lá no píer esperando vocês!',
  'Caminhe pela ilha, clique nos estúdios ou abra o celular no canto para conversar com o time.',
]

export function CoastalIntroOverlay() {
  const introStage = useAgencyStore((s) => s.introStage)
  const isCeoLoginOpen = useAgencyStore((s) => s.isCeoLoginOpen)
  const currentUser = useAgencyStore((s) => s.currentUser)
  const savedCeoCode = useAgencyStore((s) => s.ceoCode)
  const roomScale = useAgencyStore((s) => s.roomScale)
  const serverMeta = useAgencyStore((s) => s.serverMeta)

  const fetchServerMeta = useAgencyStore((s) => s.fetchServerMeta)
  const quickStartJourney = useAgencyStore((s) => s.quickStartJourney)
  const finishWelcomeIntro = useAgencyStore((s) => s.finishWelcomeIntro)
  const enterAgency = useAgencyStore((s) => s.enterAgency)
  const setCeoLoginOpen = useAgencyStore((s) => s.setCeoLoginOpen)

  const [lineIndex, setLineIndex] = useState(0)
  const [typedLen, setTypedLen] = useState(0)
  const [starting, setStarting] = useState(false)

  // Private Co-CEO login modal fields
  const [ceoSlot, setCeoSlot] = useState<'ceo-1' | 'ceo-2'>(currentUser?.ceoSlot ?? 'ceo-1')
  const [name, setName] = useState(currentUser?.name ?? '')
  const [role, setRole] = useState(currentUser?.role || 'Co-CEO & Fundadora')
  const [ceoCode, setCeoCode] = useState(savedCeoCode || 'blequi-ceo')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchServerMeta()
  }, [fetchServerMeta])

  // Typewriter effect for Nori's boat welcome speech bubble (1:1 Coastal World feel!)
  const fullLine = WELCOME_LINES[lineIndex] ?? ''
  useEffect(() => {
    if (introStage !== 'welcome') return
    setTypedLen(0)
    const id = setInterval(() => {
      setTypedLen((prev) => {
        if (prev >= fullLine.length) {
          clearInterval(id)
          return prev
        }
        return prev + 1
      })
    }, 22)
    return () => clearInterval(id)
  }, [introStage, lineIndex, fullLine])

  const handleStart = async () => {
    coastalAudio.playChime()
    setStarting(true)
    await quickStartJourney()
    setStarting(false)
  }

  const handleAdvanceDialog = () => {
    coastalAudio.playPop(620, 0.07)
    if (typedLen < fullLine.length) {
      setTypedLen(fullLine.length)
      return
    }
    if (lineIndex < WELCOME_LINES.length - 1) {
      setLineIndex((i) => i + 1)
    } else {
      finishWelcomeIntro()
    }
  }

  const handleCeoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setLoginError('Informe seu nome de Co-CEO para entrar.')
      return
    }
    setLoginError(null)
    setSubmitting(true)
    const res = await enterAgency({
      name: name.trim(),
      entityType: 'human',
      role: role.trim() || 'Co-CEO & Fundadora',
      skills: currentUser?.skills?.length ? currentUser.skills : ['Direção de Arte', 'Diorama 3D'],
      roomScale,
      ceoSlot,
      ceoCode: ceoCode.trim() || 'blequi-ceo',
    })
    setSubmitting(false)
    if (!res.ok) {
      setLoginError(res.error || 'Chave CEO inválida.')
      return
    }
    coastalAudio.playChime()
    finishWelcomeIntro()
  }

  // Modal can also be opened later from the Menu drawer to switch Co-CEO 1 <-> Co-CEO 2
  const renderCeoLoginModal = () => {
    if (!isCeoLoginOpen) return null
    const onlineCeo1 = serverMeta?.onlineCeos.find((c) => c.ceoSlot === 'ceo-1')
    const onlineCeo2 = serverMeta?.onlineCeos.find((c) => c.ceoSlot === 'ceo-2')

    return (
      <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-[#23335a]/45 p-4 backdrop-blur-sm">
        <div className="cw-pop-in relative w-full max-w-[420px] rounded-[30px] bg-white px-6 pt-9 pb-6 text-center shadow-[0_24px_60px_rgba(32,54,102,0.34)]">
          {/* Iconic Coastal World Floating Mint Circle X Button overlapping top center (steps/121/media_0.png!) */}
          <button
            type="button"
            onClick={() => setCeoLoginOpen(false)}
            aria-label="Fechar"
            className="absolute -top-5 left-1/2 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-b from-[#1de2c2] to-[#02c6a7] text-white shadow-[0_8px_20px_rgba(2,198,167,0.45)] transition-transform hover:scale-110 active:scale-95"
          >
            <X className="h-5 w-5 stroke-[3]" />
          </button>

          <p className="text-sm font-extrabold text-[#02c6a7]">Acesso Privado Co-CEO</p>
          <h2 className="mt-0.5 text-base font-extrabold text-[#3b3777]">
            Conecte seu perfil à Ilha Blequi local
          </h2>

          <form onSubmit={handleCeoSubmit} className="mt-4 space-y-3 text-left">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCeoSlot('ceo-1')}
                className={`rounded-2xl border-2 px-3 py-2 text-left transition-all ${
                  ceoSlot === 'ceo-1'
                    ? 'border-[#02c6a7] bg-[#02c6a7]/10 text-[#3b3777]'
                    : 'border-[#eef2f8] bg-[#f7f9fc] text-[#6d6a96] hover:border-[#cfd8e8]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-extrabold">
                  <Crown className="h-3.5 w-3.5 text-[#f6b93b]" />
                  Co-CEO 1 (Host)
                </div>
                <p className="mt-0.5 truncate text-[10px] font-semibold opacity-75">
                  {onlineCeo1 ? `Online: ${onlineCeo1.name}` : 'Assento principal'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCeoSlot('ceo-2')}
                className={`rounded-2xl border-2 px-3 py-2 text-left transition-all ${
                  ceoSlot === 'ceo-2'
                    ? 'border-[#02c6a7] bg-[#02c6a7]/10 text-[#3b3777]'
                    : 'border-[#eef2f8] bg-[#f7f9fc] text-[#6d6a96] hover:border-[#cfd8e8]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-extrabold">
                  <Crown className="h-3.5 w-3.5 text-[#f2676f]" />
                  Co-CEO 2 (Amiga)
                </div>
                <p className="mt-0.5 truncate text-[10px] font-semibold opacity-75">
                  {onlineCeo2 ? `Online: ${onlineCeo2.name}` : 'LAN / Tailscale'}
                </p>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome (ex: Ana / Bia / Sertório)"
                className="w-full rounded-full border-2 border-[#edf1f7] bg-[#f4f7fb] px-4 py-2.5 text-sm font-bold text-[#3b3777] placeholder:text-[#9ea4be] focus:border-[#02c6a7] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Papel na Blequi"
                className="w-full rounded-full border-2 border-[#edf1f7] bg-[#f4f7fb] px-4 py-2 text-xs font-bold text-[#3b3777] placeholder:text-[#9ea4be] focus:border-[#02c6a7] focus:bg-white focus:outline-none"
              />
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#02c6a7]" />
                <input
                  type="password"
                  value={ceoCode}
                  onChange={(e) => setCeoCode(e.target.value)}
                  placeholder="blequi-ceo"
                  className="w-full rounded-full border-2 border-[#edf1f7] bg-[#f4f7fb] py-2 pl-8 pr-3 font-mono text-xs font-semibold text-[#3b3777] focus:border-[#02c6a7] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {serverMeta && serverMeta.networkUrls.length > 0 && (
              <div className="flex items-center justify-center gap-1.5 rounded-full bg-[#e9fbf7] px-3 py-1.5 font-mono text-[11px] font-semibold text-[#01967e]">
                <Wifi className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Rede local: {serverMeta.networkUrls[0]}</span>
              </div>
            )}

            {loginError && (
              <p className="rounded-2xl bg-[#fff0f1] px-3 py-2 text-center text-xs font-bold text-[#f2676f]">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="cw-cta cw-cta-mint w-full"
            >
              <span className="cw-cta-inner flex w-full items-center justify-center gap-2 px-6 py-3 text-sm font-extrabold">
                {submitting ? 'Conectando...' : 'Entrar na Ilha Blequi'}
                <ArrowRight className="h-4 w-4 stroke-[2.8]" />
              </span>
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (introStage === 'playing') {
    return renderCeoLoginModal()
  }

  return (
    <>
      {/* STAGE 1: 1:1 COASTAL WORLD BOAT ARRIVAL HERO SCREEN (steps/38/media_0.png) */}
      {introStage === 'boat' && (
        <div className="pointer-events-none fixed inset-0 z-30 flex flex-col items-center justify-between px-4 pt-9 pb-8 sm:pt-11 sm:pb-10">
          {/* Top Center Chunky White Coastal Title */}
          <div className="flex flex-col items-center text-center select-none">
            <p className="text-base font-extrabold tracking-wide text-white drop-shadow-[0_2px_10px_rgba(0,115,180,0.3)] sm:text-xl">
              Bem-vindas à
            </p>
            <h1 className="cw-wordmark mt-1 flex flex-col items-center leading-[0.84] text-white">
              <span className="text-[clamp(2.8rem,7.2vw,5.4rem)] tracking-[0.02em]">ILHA</span>
              <span className="text-[clamp(4.1rem,10.5vw,7.8rem)] tracking-[-0.01em]">BLEQUI</span>
            </h1>
          </div>

          {/* Bottom Center Tactile Pill CTA + Resume Co-CEO Link */}
          <div className="pointer-events-auto flex flex-col items-center gap-3.5">
            <button
              type="button"
              disabled={starting}
              onClick={handleStart}
              className="cw-cta cw-cta-white group"
            >
              <span className="cw-cta-inner flex items-center gap-3.5 py-2 pl-2 pr-7 text-[15px] font-extrabold text-[#3b3777] sm:text-base">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e6edf5] bg-gradient-to-b from-white to-[#eef4fa] shadow-inner transition-transform duration-300 group-hover:scale-105">
                  <MessageSquare className="h-4 w-4 fill-[#5c8df6] text-[#5c8df6]" />
                </span>
                <span>{starting ? 'Embarcando...' : 'Iniciar a jornada'}</span>
              </span>
            </button>

            <div className="flex flex-col items-center text-center text-white drop-shadow-[0_2px_8px_rgba(20,82,132,0.35)]">
              <span className="text-xs font-bold opacity-95 sm:text-sm">
                Acesso exclusivo das duas Co-CEOs?
              </span>
              <button
                type="button"
                onClick={() => {
                  coastalAudio.playPop(540, 0.06)
                  setCeoLoginOpen(true)
                }}
                className="mt-0.5 border-b-2 border-white/90 pb-0.5 text-sm font-extrabold text-white transition-opacity hover:opacity-80"
              >
                entrar com passe Co-CEO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: 1:1 COASTAL WORLD NORI BOAT WELCOME SPEECH BUBBLE (steps/49/media_0.png) */}
      {introStage === 'welcome' && (
        <div className="pointer-events-none fixed inset-0 z-30">
          {/* Top-right white-bordered circular Skip/Close button */}
          <button
            type="button"
            onClick={() => {
              coastalAudio.playPop(580, 0.07)
              finishWelcomeIntro()
            }}
            aria-label="Ir direto para o píer"
            className="cw-circle-btn pointer-events-auto fixed top-6 right-6 z-40"
          >
            <X className="h-5 w-5 stroke-[3]" />
          </button>

          {/* Top-Center White Rounded Speech Bubble with Coral Corner Chat Tag */}
          <div className="flex justify-center px-5 pt-7 sm:pt-9">
            <button
              type="button"
              onClick={handleAdvanceDialog}
              className="cw-pop-in pointer-events-auto relative flex min-h-[104px] w-full max-w-[540px] items-center overflow-visible rounded-[22px] bg-white px-8 py-5 text-left shadow-[0_18px_46px_rgba(32,68,118,0.22)] transition-transform hover:scale-[1.01]"
            >
              {/* Soft blue curved left accent band inside bubble (1:1 steps/49/media_0.png!) */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-24 overflow-hidden rounded-l-[22px]">
                <div className="h-full w-24 rounded-r-[48px] bg-[#e9f0fa]" />
              </div>

              {/* Tilted Coral Red [...] Badge on Top-Right Corner */}
              <div className="absolute -top-3.5 -right-2.5 flex h-9 w-11 rotate-12 items-center justify-center rounded-xl bg-[#f2676f] shadow-[0_6px_14px_rgba(242,103,111,0.45)]">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
              </div>

              {/* Typewriter Text */}
              <div className="relative z-10 pl-12 pr-4">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#02c6a7]">
                  Nori · Curadora da Ilha
                </p>
                <p className="mt-0.5 text-base font-bold leading-snug text-[#3b3777] sm:text-lg">
                  {fullLine.slice(0, typedLen)}
                </p>
              </div>

              {/* Animated Coral Down Arrow Prompt */}
              <span className="absolute right-4 bottom-3 text-xs text-[#f2676f] animate-bounce">▼</span>

              {/* Speech Bubble Pointer Triangle pointing down at Nori */}
              <span className="absolute -bottom-2.5 left-1/2 h-5 w-5 -translate-x-1/2 rotate-45 rounded-[3px] bg-white" />
            </button>
          </div>
        </div>
      )}

      {renderCeoLoginModal()}
    </>
  )
}
