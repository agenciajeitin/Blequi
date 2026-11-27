export type ExternalAiProviderId = 'antigravity' | 'opencode' | 'openai' | 'claude'

export interface ExternalAiProviderMeta {
  id: ExternalAiProviderId
  name: string
  tagline: string
  color: string
  envApiKey: string
  envModelKey: string
  envBaseUrlKey?: string
  defaultModel: string
  defaultBaseUrl: string
  keyPlaceholder: string
  requiresApiKey: boolean
  docsUrl: string
  modelSuggestions: string[]
}

export interface ExternalAiProviderStatus {
  id: ExternalAiProviderId
  configured: boolean
  model: string
  baseUrl: string
}

export const EXTERNAL_AI_PROVIDERS: ExternalAiProviderMeta[] = [
  {
    id: 'antigravity',
    name: 'Antigravity',
    tagline: 'Motor nativo da Ilha Blequi via Gemini API (ferramentas 3D e edição ao vivo)',
    color: '#6366f1',
    envApiKey: 'GEMINI_API_KEY',
    envModelKey: 'GEMINI_MODEL',
    defaultModel: 'gemini-3.8-flash',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com',
    keyPlaceholder: 'AIzaSy...',
    requiresApiKey: true,
    docsUrl: 'https://aistudio.google.com/app/api-keys',
    modelSuggestions: ['gemini-3.8-flash', 'gemini-4-argon', 'gemini-2.5-flash'],
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    tagline: 'Conta OpenCode / OpenRouter (endpoint compatível com OpenAI)',
    color: '#10b981',
    envApiKey: 'OPENCODE_API_KEY',
    envModelKey: 'OPENCODE_MODEL',
    envBaseUrlKey: 'OPENCODE_BASE_URL',
    defaultModel: 'claude-sonnet-4-5',
    defaultBaseUrl: 'https://opencode.ai/zen/v1',
    keyPlaceholder: 'sk-...',
    requiresApiKey: true,
    docsUrl: 'https://opencode.ai',
    modelSuggestions: ['claude-sonnet-4-5', 'gpt-4.1', 'openrouter/auto'],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    tagline: 'Modelos GPT / Codex com function calling para resolver tarefas e código',
    color: '#10a37f',
    envApiKey: 'OPENAI_API_KEY',
    envModelKey: 'OPENAI_MODEL',
    envBaseUrlKey: 'OPENAI_BASE_URL',
    defaultModel: 'gpt-4.1',
    defaultBaseUrl: 'https://api.openai.com/v1',
    keyPlaceholder: 'sk-proj-...',
    requiresApiKey: true,
    docsUrl: 'https://platform.openai.com/api-keys',
    modelSuggestions: ['gpt-4.1', 'gpt-4.1-mini', 'o4-mini'],
  },
  {
    id: 'claude',
    name: 'Claude',
    tagline: 'Anthropic Claude para raciocínio profundo, arquitetura e edição precisa',
    color: '#d97757',
    envApiKey: 'ANTHROPIC_API_KEY',
    envModelKey: 'ANTHROPIC_MODEL',
    envBaseUrlKey: 'ANTHROPIC_BASE_URL',
    defaultModel: 'claude-sonnet-4-5',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    keyPlaceholder: 'sk-ant-...',
    requiresApiKey: true,
    docsUrl: 'https://console.anthropic.com/settings/keys',
    modelSuggestions: ['claude-sonnet-4-5', 'claude-opus-4-1', 'claude-3-7-sonnet-latest'],
  },
]

export const EXTERNAL_AI_PROVIDER_MAP: Record<ExternalAiProviderId, ExternalAiProviderMeta> =
  Object.fromEntries(EXTERNAL_AI_PROVIDERS.map((p) => [p.id, p])) as Record<
    ExternalAiProviderId,
    ExternalAiProviderMeta
  >
