import { useEffect, useState } from 'react'
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  KeyRound,
  Lock,
  Sparkles,
  UserPlus,
  Wifi,
  X,
} from 'lucide-react'
import {
  EXTERNAL_AI_PROVIDERS,
  EXTERNAL_AI_PROVIDER_MAP,
  type ExternalAiProviderId,
} from '@funcionarios/aiProvidersCatalog'
import { useAgencyStore } from '@plataforma/store/useAgencyStore'
import { AiProviderLogo } from './AiProviderLogo'

function extractHostPort(rawUrl: string): string {
  return rawUrl.replace(/^https?:\/\//i, '')
}

export function CeoSettingsModal() {
  const isOpen = useAgencyStore((s) => s.isSettingsOpen)
  const setSettingsOpen = useAgencyStore((s) => s.setSettingsOpen)
  const serverMeta = useAgencyStore((s) => s.serverMeta)
  const allowSelfBuild = useAgencyStore((s) => s.allowSelfBuildWithoutApproval)
  const proposals = useAgencyStore((s) => s.proposals)
  const setAutoBuild = useAgencyStore((s) => s.setAutoBuildWithoutApproval)
  const saveServerConfig = useAgencyStore((s) => s.saveServerConfig)
  const testProviderConfig = useAgencyStore((s) => s.testProviderConfig)
  const resolveProposal = useAgencyStore((s) => s.resolveProposal)

  const [selectedProvider, setSelectedProvider] = useState<ExternalAiProviderId>('antigravity')
  const [apiKeyDraft, setApiKeyDraft] = useState('')
  const [modelDraft, setModelDraft] = useState('')
  const [baseUrlDraft, setBaseUrlDraft] = useState('')
  const [newCeoCode, setNewCeoCode] = useState('')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [discoveredModels, setDiscoveredModels] = useState<string[]>([])
  const [feedback, setFeedback] = useState<string | null>(null)

  const providerMeta = EXTERNAL_AI_PROVIDER_MAP[selectedProvider]
  const providerStatus = serverMeta?.aiProviders?.find((p) => p.id === selectedProvider)

  useEffect(() => {
    setApiKeyDraft('')
    setModelDraft(providerStatus?.model || providerMeta.defaultModel)
    setBaseUrlDraft(providerStatus?.baseUrl || providerMeta.defaultBaseUrl)
    setDiscoveredModels([])
    setFeedback(null)
  }, [selectedProvider, providerStatus?.model, providerStatus?.baseUrl, providerMeta.defaultModel, providerMeta.defaultBaseUrl])

  if (!isOpen) return null

  const handleTestProvider = async () => {
    setTesting(true)
    setFeedback(null)
    const res = await testProviderConfig({
      providerId: selectedProvider,
      apiKey: apiKeyDraft.trim() || undefined,
      baseUrl: providerMeta.envBaseUrlKey ? baseUrlDraft.trim() || undefined : undefined,
    })
    setTesting(false)
    if (res.ok) {
      setFeedback(res.message || `Conexão com ${providerMeta.name} confirmada!`)
      if (Array.isArray(res.models) && res.models.length > 0) {
        setDiscoveredModels(res.models)
      }
    } else {
      setFeedback(`⚠️ ${res.error || 'Falha ao testar conexão.'}`)
    }
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedUrl(text)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch {}
  }

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)
    const res = await saveServerConfig({
      providerId: selectedProvider,
      apiKey: apiKeyDraft.trim() || undefined,
      model: modelDraft.trim() || undefined,
      baseUrl: providerMeta.envBaseUrlKey ? baseUrlDraft.trim() || undefined : undefined,
      newCeoCode: newCeoCode.trim() || undefined,
    })
    setSaving(false)
    if (res.ok) {
      setApiKeyDraft('')
      setNewCeoCode('')
      setFeedback(`Configuração de ${providerMeta.name} salva ao vivo (sem reiniciar a ilha)!`)
    } else {
      setFeedback(res.error || 'Erro ao salvar.')
    }
  }

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-[#23325b]/45 p-4 backdrop-blur-sm"
      onClick={() => setSettingsOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cw-pop-in relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[32px] bg-white shadow-[0_28px_70px_rgba(24,42,88,0.34)]"
      >
        <button
          type="button"
          onClick={() => setSettingsOpen(false)}
          aria-label="Fechar configurações"
          className="absolute -top-5 left-1/2 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-b from-[#20e4c4] to-[#02c6a7] text-white shadow-[0_8px_20px_rgba(2,198,167,0.45)] transition-transform hover:scale-110"
        >
          <X className="h-5 w-5 stroke-[3]" />
        </button>

        <div className="border-b border-[#edf2f9] px-6 pt-8 pb-4 text-center">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#02c6a7]">
            Governança Local
          </p>
          <h2 className="text-lg font-black text-[#3b3777]">Painel Privado dos CEOs</h2>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {/* Compact LAN / Tailscale IP Info Only */}
          <section className="rounded-[22px] bg-[#e9fbf7] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-black text-[#01967e]">
                <Wifi className="h-4 w-4" />
                <span>LAN / Tailscale</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {serverMeta?.networkUrls && serverMeta.networkUrls.length > 0 ? (
                  serverMeta.networkUrls.map((url) => {
                    const displayIp = extractHostPort(url)
                    return (
                      <div
                        key={url}
                        className="flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm"
                      >
                        <span className="font-mono text-xs font-bold text-[#3b3777]">{displayIp}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(url)}
                          className="inline-flex items-center gap-1 rounded-full bg-[#02c6a7] px-2.5 py-0.5 text-[10px] font-extrabold text-white hover:brightness-105"
                        >
                          {copiedUrl === url ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {copiedUrl === url ? 'Copiado' : 'Copiar'}
                        </button>
                      </div>
                    )
                  })
                ) : (
                  <span className="rounded-full bg-white px-3 py-1 font-mono text-xs font-bold text-[#3b3777] shadow-sm">
                    localhost:5173
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Pending New Employee Proposals */}
          {proposals.length > 0 && (
            <section className="space-y-2 rounded-[22px] bg-[#fff7dc] p-4">
              <div className="flex items-center gap-2 text-xs font-black text-[#b45309]">
                <UserPlus className="h-4 w-4" />
                Propostas de Novos Funcionários ({proposals.length})
              </div>
              {proposals.map((prop) => (
                <div key={prop.id} className="rounded-2xl bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-[#3b3777]">
                      {prop.name} · <span className="font-semibold text-[#7c79a6]">{prop.role}</span>
                    </p>
                    <span className="text-[10px] font-bold text-[#8d8bb0]">por {prop.proposedByName}</span>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-[#6c6996]">{prop.rationale}</p>
                  <div className="mt-2.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => resolveProposal(prop.id, true)}
                      className="rounded-full bg-[#02c6a7] px-3.5 py-1 text-xs font-extrabold text-white"
                    >
                      Aprovar contratação
                    </button>
                    <button
                      type="button"
                      onClick={() => resolveProposal(prop.id, false)}
                      className="rounded-full bg-[#eef2f8] px-3.5 py-1 text-xs font-bold text-[#6c6996]"
                    >
                      Recusar
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* AI Providers API Keys Registry with Saved Logos & Per-Provider Settings */}
          <section className="space-y-3 rounded-[24px] border-2 border-[#edf2f9] bg-[#f8fbff] p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#3b3777]">
                  <KeyRound className="h-3.5 w-3.5 text-[#02c6a7]" />
                  Chaves API &amp; Provedores de IA
                </h3>
                <p className="mt-0.5 text-[11px] font-semibold text-[#7c79a6]">
                  Selecione uma IA abaixo para configurar chave, modelo e endpoint específicos.
                </p>
              </div>
            </div>

            {/* Saved-Logo Provider Grid */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {EXTERNAL_AI_PROVIDERS.map((prov) => {
                const status = serverMeta?.aiProviders?.find((p) => p.id === prov.id)
                const isConfigured = Boolean(status?.configured)
                const active = selectedProvider === prov.id
                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => setSelectedProvider(prov.id)}
                    className={`flex flex-col items-start gap-1.5 rounded-2xl border-2 p-2.5 text-left transition-all ${
                      active
                        ? 'border-[#02c6a7] bg-white shadow-sm'
                        : 'border-transparent bg-white/80 hover:border-[#d7e3f4] hover:bg-white'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-1">
                      <AiProviderLogo id={prov.id} className="h-6 w-6 shrink-0" />
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isConfigured ? 'bg-[#02c6a7]' : 'bg-[#cbd5e1]'
                        }`}
                        title={isConfigured ? 'Configurada' : 'Não configurada'}
                      />
                    </div>
                    <span className="truncate text-[11px] font-black text-[#3b3777]">{prov.name}</span>
                    <span
                      className={`text-[10px] font-bold ${
                        isConfigured ? 'text-[#01967e]' : 'text-[#9ea4be]'
                      }`}
                    >
                      {isConfigured ? 'Ativa' : 'Sem chave'}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Selected Provider Specific Config Form */}
            <form onSubmit={handleSaveProvider} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <AiProviderLogo id={providerMeta.id} className="h-7 w-7 shrink-0" />
                  <div>
                    <p className="text-sm font-black text-[#3b3777]">{providerMeta.name}</p>
                    <p className="text-[11px] font-semibold text-[#7c79a6]">{providerMeta.tagline}</p>
                  </div>
                </div>
                <a
                  href={providerMeta.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e9fbf7] px-2.5 py-1 text-[10px] font-extrabold text-[#01967e] hover:brightness-95"
                >
                  Chave
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-black text-[#3b3777]">
                  {providerMeta.envApiKey}{' '}
                  {!providerMeta.requiresApiKey && (
                    <span className="font-semibold text-[#8d8bb0]">(opcional)</span>
                  )}
                </label>
                <input
                  type="password"
                  value={apiKeyDraft}
                  onChange={(e) => setApiKeyDraft(e.target.value)}
                  placeholder={
                    providerStatus?.configured
                      ? 'Chave já salva no .env · cole outra apenas para trocar'
                      : providerMeta.keyPlaceholder
                  }
                  className="w-full rounded-full border-2 border-[#edf2f9] bg-[#f5f8fd] px-4 py-2 font-mono text-xs font-semibold text-[#3b3777] placeholder:text-[#9ea4be] focus:border-[#02c6a7] focus:bg-white focus:outline-none"
                />
              </div>

              <div className={`grid gap-2.5 ${providerMeta.envBaseUrlKey ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
                <div>
                  <label className="mb-1 block text-[11px] font-black text-[#3b3777]">
                    Modelo padrão ({providerMeta.envModelKey})
                  </label>
                  <input
                    type="text"
                    value={modelDraft}
                    onChange={(e) => setModelDraft(e.target.value)}
                    placeholder={providerMeta.defaultModel}
                    className="w-full rounded-full border-2 border-[#edf2f9] bg-[#f5f8fd] px-3.5 py-2 font-mono text-xs font-semibold text-[#3b3777] focus:border-[#02c6a7] focus:bg-white focus:outline-none"
                  />
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {Array.from(new Set([...discoveredModels, ...providerMeta.modelSuggestions])).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setModelDraft(m)}
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold transition-colors ${
                          modelDraft === m
                            ? 'bg-[#3b3777] text-white'
                            : 'bg-[#eef3fa] text-[#6c6996] hover:bg-[#e1eaf7]'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {providerMeta.envBaseUrlKey && (
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-[11px] font-black text-[#3b3777]">
                      <Globe className="h-3 w-3 text-[#02c6a7]" />
                      Endpoint ({providerMeta.envBaseUrlKey})
                    </label>
                    <input
                      type="text"
                      value={baseUrlDraft}
                      onChange={(e) => setBaseUrlDraft(e.target.value)}
                      placeholder={providerMeta.defaultBaseUrl}
                      className="w-full rounded-full border-2 border-[#edf2f9] bg-[#f5f8fd] px-3.5 py-2 font-mono text-xs font-semibold text-[#3b3777] focus:border-[#02c6a7] focus:bg-white focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Optional CEO Password Change */}
              <div className="border-t border-[#edf2f9] pt-3">
                <label className="mb-1 flex items-center gap-1.5 text-[11px] font-black text-[#3b3777]">
                  <Lock className="h-3.5 w-3.5 text-[#f2676f]" />
                  Trocar Senha dos CEOs (opcional)
                </label>
                <input
                  type="password"
                  value={newCeoCode}
                  onChange={(e) => setNewCeoCode(e.target.value)}
                  placeholder="Deixe vazio para manter a senha atual"
                  className="w-full rounded-full border-2 border-[#edf2f9] bg-[#f5f8fd] px-4 py-2 font-mono text-xs font-semibold text-[#3b3777] placeholder:text-[#9ea4be] focus:border-[#02c6a7] focus:bg-white focus:outline-none"
                />
              </div>

              {feedback && (
                <p className="rounded-2xl bg-[#e9fbf7] px-3.5 py-2 text-center text-xs font-extrabold text-[#01967e]">
                  {feedback}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  disabled={testing}
                  onClick={handleTestProvider}
                  className="rounded-full bg-[#eef4ff] px-4 py-2 text-xs font-extrabold text-[#3b3777] hover:bg-[#dfeaff] disabled:opacity-50"
                >
                  {testing ? 'Testando...' : 'Testar & Buscar Modelos'}
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(false)}
                    className="rounded-full bg-[#eef2f8] px-4 py-2 text-xs font-extrabold text-[#6c6996] hover:bg-[#e1e8f3]"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="cw-cta cw-cta-mint disabled:opacity-50"
                  >
                    <span className="cw-cta-inner px-5 py-2 text-xs font-extrabold">
                      {saving ? 'Salvando...' : `Salvar ${providerMeta.name}`}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* Autonomy Toggle */}
          <section className="flex items-center justify-between gap-4 rounded-[22px] bg-[#f5f8fd] p-4">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-black text-[#3b3777]">
                <Sparkles className="h-3.5 w-3.5 text-[#f6b93b]" />
                Auto-criação direta na Sede da Blequi
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-[#7c79a6]">
                Quando ativo, a equipe instala objetos 3D imediatamente e os CEOs podem celebrá-los depois.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAutoBuild(!allowSelfBuild)}
              className={`h-7 w-12 shrink-0 rounded-full p-1 transition-colors ${
                allowSelfBuild ? 'bg-[#02c6a7]' : 'bg-[#cbd5e1]'
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  allowSelfBuild ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
