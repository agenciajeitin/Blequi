import type { ExternalAiProviderId } from '@funcionarios/aiProvidersCatalog'

interface AiProviderLogoProps {
  id: ExternalAiProviderId
  className?: string
}

/** Saved crisp SVG brand icons for the 4 Blequi AI accounts: Antigravity, OpenCode, OpenAI, Claude */
export function AiProviderLogo({ id, className = 'h-5 w-5' }: AiProviderLogoProps) {
  switch (id) {
    case 'antigravity':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="blequi-agy-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4285f4" />
              <stop offset="55%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <path
            d="M12 2C12.7 7.1 16.9 11.3 22 12C16.9 12.7 12.7 16.9 12 22C11.3 16.9 7.1 12.7 2 12C7.1 11.3 11.3 7.1 12 2Z"
            fill="url(#blequi-agy-grad)"
          />
        </svg>
      )
    case 'opencode':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="6" fill="#10b981" />
          <path
            d="M9 8.5L5.5 12L9 15.5M15 8.5L18.5 12L15 15.5M13.2 7.5L10.8 16.5"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'openai':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" stroke="#10a37f" strokeWidth="1.9" />
          <path
            d="M12 5.2L17.2 8.2V14.2L12 17.2L6.8 14.2V8.2L12 5.2Z"
            stroke="#10a37f"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="11.2" r="2.1" fill="#10a37f" />
        </svg>
      )
    case 'claude':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="6" fill="#d97757" />
          <path
            d="M8.2 17L11.4 7H13.1L16.3 17H14.2L13.5 14.7H10.9L10.2 17H8.2ZM11.4 13H13.0L12.2 10.1L11.4 13Z"
            fill="#ffffff"
          />
        </svg>
      )
  }
}
