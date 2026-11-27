import { useEffect, useState } from 'react'
import { ArrowRight, KeyRound, User, X } from 'lucide-react'
import { useAgencyStore } from '@plataforma/store/useAgencyStore'
import { coastalAudio } from '@ambiente/audio/coastalAudio'

const WELCOME_LINES = [
  'Bem-vindos de volta à Ilha Blequi, CEOs Raynocas e Kafuzinho! Eu sou a Nori...',
  'Luma, Kael, Vex e eu estamos todos reunidos na Sede da Blequi esperando vocês!',
  'Explore a ilha, entre na Sede da Blequi ou abra o celular no canto para coordenar a equipe.',
]

export function CoastalIntroOverlay() {
  const introStage = useAgencyStore((s) => s.introStage)
  const isCeoLoginOpen = useAgencyStore((s) => s.isCeoLoginOpen)
  const currentUser = useAgencyStore((s) => s.currentUser)
  const savedCeoCode = useAgencyStore((s) => s.ceoCode)
  const savedRemember = useAgencyStore((s) => s.rememberPassword)
  const roomScale = useAgencyStore((s) => s.roomScale)

  const fetchServerMeta = useAgencyStore((s) => s.fetchServerMeta)
  const tryAutoLogin = useAgencyStore((s) => s.tryAutoLogin)
  const finishWelcomeIntro = useAgencyStore((s) => s.finishWelcomeIntro)
  const enterAgency = useAgencyStore((s) => s.enterAgency)
  const setCeoLoginOpen = useAgencyStore((s) => s.setCeoLoginOpen)

  const [lineIndex, setLineIndex] = useState(0)
  const [typedLen, setTypedLen] = useState(0)

  // Simplified CEO login fields (Login + Password + Remember checkbox + Enter)
  const [login, setLogin] = useState(currentUser?.name ?? '')
  const [password, setPassword] = useState(savedRemember ? savedCeoCode : '')
  const [remember, setRemember] = useState(savedRemember)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchServerMeta()
    void tryAutoLogin()
  }, [fetchServerMeta, tryAutoLogin])

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
    if (!login.trim()) {
      setLoginError('Informe seu login (Raynocas ou Kafuzinho).')
      return
    }
    if (!password.trim()) {
      setLoginError('Informe sua senha de acesso.')
      return
    }

    const normalized = login
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    const inferredSlot: 'ceo-1' | 'ceo-2' =
      normalized === 'kafuzinho' || normalized === 'kafu' || normalized === 'kafuzin'
        ? 'ceo-2'
        : 'ceo-1'

    setLoginError(null)
    setSubmitting(true)
    const res = await enterAgency({
      name: login.trim(),
      entityType: 'human',
      role: inferredSlot === 'ceo-1' ? 'CEO · Ambientação & Estética' : 'CEO · Edifícios & Animações',
      skills: currentUser?.skills?.length ? currentUser.skills : ['Direção Criativa', 'Ilha Blequi'],
      roomScale,
      ceoSlot: inferredSlot,
      ceoCode: password.trim(),
      rememberPassword: remember,
    })
    setSubmitting(false)
    if (!res.ok) {
      setLoginError(res.error || 'Login ou senha inválidos.')
      return
    }
    coastalAudio.playChime()
    finishWelcomeIntro()
  }

  const renderCeoLoginModal = () => {
    if (!isCeoLoginOpen) return null

    return (
      <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-[#23335a]/45 p-4 backdrop-blur-sm">
        <div className="cw-pop-in relative w-full max-w-[380px] rounded-[30px] bg-white px-6 pt-9 pb-6 text-center shadow-[0_24px_60px_rgba(32,54,102,0.34)]">
          <button
            type="button"
            onClick={() => setCeoLoginOpen(false)}
            aria-label="Fechar"
            className="absolute -top-5 left-1/2 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-b from-[#1de2c2] to-[#02c6a7] text-white shadow-[0_8px_20px_rgba(2,198,167,0.45)] transition-transform hover:scale-110 active:scale-95"
          >
            <X className="h-5 w-5 stroke-[3]" />
          </button>

          <p className="text-xs font-extrabold uppercase tracking-wider text-[#02c6a7]">
            Acesso CEO
          </p>
          <h2 className="mt-0.5 text-lg font-black text-[#3b3777]">
            Ilha Blequi
          </h2>

          <form onSubmit={handleCeoSubmit} className="mt-5 space-y-3 text-left">
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#02c6a7]" />
              <input
                type="text"
                autoComplete="username"
                value={login}
                onChange={(e) => {
                  setLogin(e.target.value)
                  if (loginError) setLoginError(null)
                }}
                placeholder="Login (Raynocas ou Kafuzinho)"
                className="w-full rounded-full border-2 border-[#edf1f7] bg-[#f4f7fb] py-2.5 pl-10 pr-4 text-sm font-bold text-[#3b3777] placeholder:text-[#9ea4be] focus:border-[#02c6a7] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#02c6a7]" />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (loginError) setLoginError(null)
                }}
                placeholder="Senha"
                className="w-full rounded-full border-2 border-[#edf1f7] bg-[#f4f7fb] py-2.5 pl-10 pr-4 font-mono text-sm font-semibold text-[#3b3777] placeholder:font-sans placeholder:text-[#9ea4be] focus:border-[#02c6a7] focus:bg-white focus:outline-none"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 px-1 text-xs font-bold text-[#6c6996] select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-[#cfd8e8] accent-[#02c6a7]"
              />
              <span>Salvar senha e entrar automaticamente</span>
            </label>

            {loginError && (
              <p className="rounded-2xl bg-[#fff0f1] px-3 py-2 text-center text-xs font-bold text-[#f2676f]">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="cw-cta cw-cta-mint mt-1 w-full"
            >
              <span className="cw-cta-inner flex w-full items-center justify-center gap-2 px-6 py-3 text-sm font-extrabold">
                {submitting ? 'Entrando...' : 'Entrar'}
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
      {/* STAGE 1: COASTAL WORLD BOAT ARRIVAL HERO SCREEN */}
      {introStage === 'boat' && (
        <div className="pointer-events-none fixed inset-0 z-30 flex flex-col items-center justify-between px-4 pt-9 pb-10 sm:pt-11 sm:pb-12">
          <div className="flex flex-col items-center text-center select-none">
            <p className="text-base font-extrabold tracking-wide text-white drop-shadow-[0_2px_10px_rgba(0,115,180,0.3)] sm:text-xl">
              Bem-vindos à
            </p>
            <h1 className="cw-wordmark mt-1 flex flex-col items-center leading-[0.84] text-white">
              <span className="text-[clamp(2.8rem,7.2vw,5.4rem)] tracking-[0.02em]">ILHA</span>
              <span className="text-[clamp(4.1rem,10.5vw,7.8rem)] tracking-[-0.01em]">BLEQUI</span>
            </h1>
          </div>

          {/* Primary CTA now opens the CEO Login Screen directly */}
          <div className="pointer-events-auto flex flex-col items-center">
            <button
              type="button"
              onClick={() => {
                coastalAudio.playPop(580, 0.07)
                setCeoLoginOpen(true)
              }}
              className="cw-cta cw-cta-white group"
            >
              <span className="cw-cta-inner flex items-center gap-3.5 py-2 pl-2 pr-7 text-[15px] font-extrabold text-[#3b3777] sm:text-base">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e6edf5] bg-gradient-to-b from-white to-[#eef4fa] shadow-inner transition-transform duration-300 group-hover:scale-105">
                  <KeyRound className="h-4 w-4 text-[#02c6a7]" />
                </span>
                <span>Entrar com passe de CEO</span>
              </span>
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: NORI BOAT WELCOME SPEECH BUBBLE */}
      {introStage === 'welcome' && (
        <div className="pointer-events-none fixed inset-0 z-30">
          <button
            type="button"
            onClick={() => {
              coastalAudio.playPop(580, 0.07)
              finishWelcomeIntro()
            }}
            aria-label="Ir direto para a ilha"
            className="cw-circle-btn pointer-events-auto fixed top-6 right-6 z-40"
          >
            <X className="h-5 w-5 stroke-[3]" />
          </button>

          <div className="flex justify-center px-5 pt-7 sm:pt-9">
            <button
              type="button"
              onClick={handleAdvanceDialog}
              className="cw-pop-in pointer-events-auto relative flex min-h-[104px] w-full max-w-[540px] items-center overflow-visible rounded-[22px] bg-white px-8 py-5 text-left shadow-[0_18px_46px_rgba(32,68,118,0.22)] transition-transform hover:scale-[1.01]"
            >
              <div className="pointer-events-none absolute inset-y-0 left-0 w-24 overflow-hidden rounded-l-[22px]">
                <div className="h-full w-24 rounded-r-[48px] bg-[#e9f0fa]" />
              </div>

              <div className="absolute -top-3.5 -right-2.5 flex h-9 w-11 rotate-12 items-center justify-center rounded-xl bg-[#f2676f] shadow-[0_6px_14px_rgba(242,103,111,0.45)]">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
              </div>

              <div className="relative z-10 pl-12 pr-4">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#02c6a7]">
                  Nori · Sede da Blequi
                </p>
                <p className="mt-0.5 text-base font-bold leading-snug text-[#3b3777] sm:text-lg">
                  {fullLine.slice(0, typedLen)}
                </p>
              </div>

              <span className="absolute right-4 bottom-3 text-xs text-[#f2676f] animate-bounce">▼</span>
              <span className="absolute -bottom-2.5 left-1/2 h-5 w-5 -translate-x-1/2 rotate-45 rounded-[3px] bg-white" />
            </button>
          </div>
        </div>
      )}

      {renderCeoLoginModal()}
    </>
  )
}
