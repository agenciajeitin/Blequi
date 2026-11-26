import { StudioScene } from '@ambiente/StudioScene'
import { useAgencyStore } from './store/useAgencyStore'
import { CoastalIntroOverlay } from './components/CoastalIntroOverlay'
import { CoastalWorldHud } from './components/CoastalWorldHud'
import { CoastalPhoneModal } from './components/CoastalPhoneModal'
import { CoastalCustomizerHud } from './components/CoastalCustomizerHud'
import { CoastalMenuDrawer } from './components/CoastalMenuDrawer'
import { AgentInspector } from './components/AgentInspector'
import { CeoSettingsModal } from './components/CeoSettingsModal'
import { CreateAgentModal } from './components/CreateAgentModal'

export function AgencyPlatform() {
  const introStage = useAgencyStore((s) => s.introStage)
  const toastMessage = useAgencyStore((s) => s.toastMessage)

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#00b8ff]">
      {/* Live 3D Coastal Blequi World (Intro Boat -> Playable 3rd-Person Pier & Island -> Private Studios) */}
      <StudioScene />

      {/* Coastal World Intro Boat Arrival Screen, Nori Speech Bubble & Private Co-CEO Login Modal */}
      <CoastalIntroOverlay />

      {/* Active Coastal World HUD (Wordmark, 3 Top-Right Circle Icons, Walking Hint, Tilted Mini Phone) */}
      {introStage === 'playing' && (
        <>
          <CoastalWorldHud />
          <CoastalCustomizerHud />
          <CoastalPhoneModal />
          <CoastalMenuDrawer />
          <AgentInspector />
          <CreateAgentModal />
          <CeoSettingsModal />

          {/* Crisp Coastal World Floating White Toast */}
          {toastMessage && (
            <div className="cw-pop-in pointer-events-none fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-full border-2 border-white bg-white/95 px-5 py-2 text-xs font-extrabold text-[#3b3777] shadow-[0_14px_34px_rgba(32,58,108,0.22)]">
              {toastMessage}
            </div>
          )}
        </>
      )}
    </main>
  )
}
