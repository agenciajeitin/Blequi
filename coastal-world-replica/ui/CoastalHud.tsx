import {
  COASTAL_AVATAR_PALETTES,
} from '@ambiente/shaders/coastalShaders'
import { coastalAudio } from '@ambiente/audio/coastalAudio'
import {
  COASTAL_LANDMARKS,
  ISLAND_COINS,
  type HatAccessory,
  useReplicaStore,
} from '../store'

const HAT_OPTIONS: { id: HatAccessory; label: string; emoji: string }[] = [
  { id: 'none', label: 'No Hat', emoji: '✨' },
  { id: 'cap', label: 'Sun Cap', emoji: '🧢' },
  { id: 'beanie', label: 'Sailor', emoji: '🧶' },
  { id: 'crown', label: 'Crown', emoji: '👑' },
  { id: 'headphones', label: 'Beats', emoji: '🎧' },
]

export function CoastalHud() {
  const {
    phase,
    paletteIndex,
    hat,
    timeOfDay,
    audioEnabled,
    cp,
    collectedCoins,
    visitedLandmarks,
    rewardedLandmarks,
    customizedOnce,
    playerPosition,
    nearbyLandmarkId,
    activeDialogLandmarkId,
    dialogLineIndex,
    phoneOpen,
    phoneTab,
    customizerOpen,
    menuOpen,
    loginModalOpen,
    toastMessage,
    startJourney,
    setPaletteIndex,
    setHat,
    cycleTimeOfDay,
    setAudioEnabled,
    requestTeleport,
    openDialog,
    advanceDialog,
    closeDialog,
    openPhone,
    closePhone,
    setPhoneTab,
    toggleCustomizer,
    setMenuOpen,
    setLoginModalOpen,
    resetJourney,
  } = useReplicaStore()

  const nearbyLandmark = COASTAL_LANDMARKS.find((l) => l.id === nearbyLandmarkId) ?? null
  const activeDialogLandmark =
    COASTAL_LANDMARKS.find((l) => l.id === activeDialogLandmarkId) ?? null

  const handleAudioToggle = () => {
    const next = !audioEnabled
    setAudioEnabled(next)
    coastalAudio.setEnabled(next)
  }

  const handleStartJourney = () => {
    if (audioEnabled) coastalAudio.playChime()
    startJourney()
  }

  const quests = [
    {
      id: 'q-coins',
      title: 'Collect 5 Coastal Coins',
      current: Math.min(5, collectedCoins.length),
      target: 5,
      reward: '+100 CP',
      done: collectedCoins.length >= 5,
    },
    {
      id: 'q-stamps',
      title: 'Discover 3 Island Districts',
      current: Math.min(3, visitedLandmarks.length),
      target: 3,
      reward: 'Passport Badge',
      done: visitedLandmarks.length >= 3,
    },
    {
      id: 'q-guides',
      title: 'Chat with 2 Island Guides',
      current: Math.min(2, rewardedLandmarks.length),
      target: 2,
      reward: 'Explorer Title',
      done: rewardedLandmarks.length >= 2,
    },
    {
      id: 'q-style',
      title: 'Customize Your Avatar Style',
      current: customizedOnce ? 1 : 0,
      target: 1,
      reward: '+25 CP',
      done: customizedOnce,
    },
  ]

  const timeIcon = timeOfDay === 'daylight' ? '☀️' : timeOfDay === 'golden' ? '🌅' : '🌙'

  return (
    <>
      {/* TOP HUD BAR */}
      <header className="cw-top-hud">
        <button
          type="button"
          className="cw-brand-lockup"
          onClick={() => requestTeleport([0, 0.85, 16.5], 'pier')}
          title="Return to Arrival Pier"
        >
          <span className="cw-brand-lockup__top">COASTAL</span>
          <span className="cw-brand-lockup__main">WORLD</span>
        </button>

        {phase === 'playing' && (
          <div className="cw-top-pill">
            <span className="cw-top-pill__dot" />
            <span>{nearbyLandmark ? `${nearbyLandmark.emoji} ${nearbyLandmark.name}` : '🏝️ Coastal Island'}</span>
            <span style={{ color: 'var(--cw-navy-muted)' }}>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span className="cw-cp-coin">CP</span>
              {cp}
            </span>
          </div>
        )}

        <div className="cw-top-actions">
          <button
            type="button"
            className="cw-circle-btn"
            onClick={cycleTimeOfDay}
            title="Switch Daylight / Golden Hour / Coastal Dusk"
            aria-label="Switch atmosphere"
          >
            {timeIcon}
          </button>
          <button
            type="button"
            className="cw-circle-btn"
            onClick={handleAudioToggle}
            title={audioEnabled ? 'Mute ocean audio' : 'Enable ocean audio'}
            aria-label="Toggle audio"
          >
            {audioEnabled ? '🔊' : '🔇'}
          </button>
          <button
            type="button"
            className="cw-circle-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            title="Open Coastal Menu"
            aria-label="Open menu"
          >
            ☰
          </button>
        </div>
      </header>

      {/* TOAST FEEDBACK */}
      {toastMessage && <div className="cw-toast">{toastMessage}</div>}

      {/* VIEW 1: INTRO BOAT ARRIVAL OVERLAY (1:1 Coastal World Hero) */}
      {phase === 'intro' && (
        <section className="cw-intro-overlay" aria-label="Coastal World Arrival">
          <div className="cw-intro-hero">
            <span className="cw-intro-welcome">Welcome to</span>
            <h1 className="cw-wordmark cw-intro-title">
              COASTAL
              <br />
              WORLD
            </h1>
          </div>

          <div className="cw-intro-bottom">
            <div className="cw-speech-bubble" style={{ width: '100%' }}>
              <span className="cw-speech-bubble__dots">•••</span>
              <span className="cw-speech-bubble__eyebrow">CAPTAIN LOU · COASTAL FERRY</span>
              <div className="cw-speech-bubble__text">
                Welcome aboard, newcomer! Ready to step onto the pier and explore Coastal World?
              </div>
              <span className="cw-speech-bubble__arrow">▼</span>
            </div>

            <button
              type="button"
              className="cw-cta cw-cta--white"
              onClick={handleStartJourney}
            >
              <span className="cw-cta-inner" style={{ padding: '14px 34px', fontSize: 16 }}>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--cw-surface)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ⛵
                </span>
                Start the journey
              </span>
            </button>

            <div className="cw-intro-resume">
              Already started your journey?{' '}
              <button type="button" onClick={() => setLoginModalOpen(true)}>
                login to resume
              </button>
            </div>

            <div className="cw-keys-hint">
              <div className="cw-keycap">↑</div>
              <div className="cw-keys-row">
                <div className="cw-keycap" style={{ animationDelay: '0.2s' }}>
                  ←
                </div>
                <div className="cw-keycap" style={{ animationDelay: '0.35s' }}>
                  ↓
                </div>
                <div className="cw-keycap" style={{ animationDelay: '0.5s' }}>
                  →
                </div>
              </div>
              <div className="cw-keys-pill">
                use keys or <strong>click &amp; drag to move</strong>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* VIEW 2: PLAYING HUD ORBS (BOTTOM LEFT) */}
      {phase === 'playing' && !customizerOpen && !activeDialogLandmark && (
        <div className="cw-bottom-left-orbs">
          <button
            type="button"
            className="cw-action-orb"
            onClick={() => toggleCustomizer(true)}
            title="Customize Avatar & Hats"
          >
            <span className="cw-action-orb__inner">
              <span style={{ fontSize: 22 }}>👕</span>
              <span style={{ fontSize: 10, fontWeight: 900 }}>STYLE</span>
            </span>
          </button>

          <button
            type="button"
            className="cw-action-orb"
            onClick={() => openPhone('map')}
            title="Open Island Map"
          >
            <span className="cw-action-orb__inner">
              <span style={{ fontSize: 22 }}>🗺️</span>
              <span style={{ fontSize: 10, fontWeight: 900 }}>MAP</span>
            </span>
          </button>
        </div>
      )}

      {/* PROXIMITY INTERACTION PROMPT */}
      {phase === 'playing' &&
        nearbyLandmark &&
        !activeDialogLandmark &&
        !customizerOpen &&
        !phoneOpen && (
          <div className="cw-proximity-wrap">
            <button
              type="button"
              className="cw-cta cw-cta--mint"
              onClick={() => {
                if (audioEnabled) coastalAudio.playPop(620, 0.08)
                openDialog(nearbyLandmark.id)
              }}
            >
              <span className="cw-cta-inner" style={{ padding: '12px 26px', fontSize: 15 }}>
                <span>{nearbyLandmark.emoji}</span>
                <span>Talk to {nearbyLandmark.npcName}</span>
              </span>
            </button>
          </div>
        )}

      {/* NPC SPEECH BUBBLE DIALOG */}
      {activeDialogLandmark && (
        <div className="cw-dialog-overlay">
          <div
            className="cw-speech-bubble"
            style={{ width: '100%', cursor: 'var(--cw-cursor-pointer)' }}
            onClick={advanceDialog}
            role="button"
            tabIndex={0}
          >
            <span className="cw-speech-bubble__dots">•••</span>
            <span className="cw-speech-bubble__eyebrow">
              {activeDialogLandmark.npcName} · {activeDialogLandmark.npcRole}
            </span>
            <div className="cw-speech-bubble__text">
              {activeDialogLandmark.dialogLines[dialogLineIndex]}
            </div>
            <span className="cw-speech-bubble__arrow">▼</span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="cw-cta cw-cta--mint" onClick={advanceDialog}>
              <span className="cw-cta-inner" style={{ padding: '10px 24px', fontSize: 14 }}>
                {dialogLineIndex < activeDialogLandmark.dialogLines.length - 1
                  ? 'Next →'
                  : rewardedLandmarks.includes(activeDialogLandmark.id)
                    ? 'See you around!'
                    : `Claim +${activeDialogLandmark.rewardCp} CP`}
              </span>
            </button>
            <button type="button" className="cw-cta cw-cta--white" onClick={closeDialog}>
              <span className="cw-cta-inner" style={{ padding: '10px 18px', fontSize: 14 }}>
                Close
              </span>
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM CUSTOMIZER BAR */}
      {phase === 'playing' && customizerOpen && (
        <div className="cw-customizer-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--cw-navy-muted)',
              }}
            >
              Palette
            </span>
            {COASTAL_AVATAR_PALETTES.map((pal, idx) => (
              <button
                key={pal.id}
                type="button"
                className={`cw-swatch-dot ${paletteIndex === idx ? 'is-active' : ''}`}
                style={{ background: pal.swatch }}
                onClick={() => {
                  if (audioEnabled) coastalAudio.playPop(540 + idx * 45, 0.07)
                  setPaletteIndex(idx)
                }}
                title={pal.id}
                aria-label={`Select ${pal.id} palette`}
              />
            ))}
          </div>

          <div style={{ width: 1, height: 28, background: 'var(--cw-border-soft)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {HAT_OPTIONS.map((h) => (
              <button
                key={h.id}
                type="button"
                className={`cw-hat-chip ${hat === h.id ? 'is-active' : ''}`}
                onClick={() => {
                  if (audioEnabled) coastalAudio.playPop(680, 0.06)
                  setHat(h.id)
                }}
              >
                {h.emoji} {h.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="cw-cta cw-cta--mint"
            onClick={() => toggleCustomizer(false)}
          >
            <span className="cw-cta-inner" style={{ padding: '8px 20px', fontSize: 13 }}>
              Done
            </span>
          </button>
        </div>
      )}

      {/* BOTTOM-RIGHT CURVED WHITE CORNER + TILTED MINI SMARTPHONE */}
      <div className="cw-corner-wave" />
      <button
        type="button"
        className="cw-mini-phone-btn"
        onClick={() => openPhone('map')}
        aria-label="Open Coastal Smartphone"
        title="Open Coastal Smartphone"
      >
        <div className="cw-mini-phone">
          <div className="cw-mini-phone__screen">
            <div className="cw-mini-phone__grid">
              <div className="cw-mini-phone__tile" style={{ background: '#e3f3ff' }}>
                📍
              </div>
              <div className="cw-mini-phone__tile" style={{ background: '#e2faf4' }}>
                🚩
              </div>
              <div className="cw-mini-phone__tile" style={{ background: '#eef2ff' }}>
                📋
              </div>
              <div className="cw-mini-phone__tile" style={{ background: '#fff0f2' }}>
                👕
              </div>
            </div>
            <div className="cw-mini-phone__cp">
              <span className="cw-cp-coin">CP</span>
              <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--cw-navy)' }}>{cp}</span>
            </div>
          </div>
        </div>
      </button>

      {/* HAND-HELD INTERACTIVE SMARTPHONE MODAL */}
      {phoneOpen && (
        <div className="cw-modal-backdrop" onClick={closePhone}>
          <div className="cw-hand-stage" onClick={(e) => e.stopPropagation()}>
            <div className="cw-hand-palm" />
            <div className="cw-hand-thumb" />
            <div className="cw-hand-fingers">
              <span />
              <span />
              <span />
            </div>

            <div className="cw-big-phone">
              <div className="cw-big-phone__screen">
                <div className="cw-phone-header">
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 900,
                        letterSpacing: '0.08em',
                        color: 'var(--cw-mint)',
                        textTransform: 'uppercase',
                      }}
                    >
                      COASTAL OS
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--cw-navy)' }}>
                      {phoneTab === 'map'
                        ? 'Island Map'
                        : phoneTab === 'quests'
                          ? 'Island Quests'
                          : 'Coastal Passport'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        background: 'var(--cw-surface)',
                        borderRadius: 999,
                        padding: '4px 10px 4px 5px',
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      <span className="cw-cp-coin">CP</span>
                      {cp}
                    </span>
                    <button
                      type="button"
                      onClick={closePhone}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'var(--cw-surface)',
                        fontWeight: 900,
                        color: 'var(--cw-navy)',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="cw-phone-body">
                  {phoneTab === 'map' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* Live Radar Minimap */}
                      <div
                        style={{
                          position: 'relative',
                          height: 168,
                          borderRadius: 20,
                          background:
                            'radial-gradient(circle at 50% 50%, #91e0b4 0%, #91e0b4 48%, #f8e3ba 49%, #f8e3ba 57%, #65b2e6 58%, #42d2fb 100%)',
                          overflow: 'hidden',
                          boxShadow: 'inset 0 2px 10px rgba(32, 62, 114, 0.14)',
                        }}
                      >
                        {COASTAL_LANDMARKS.map((lm) => {
                          const left = `${50 + (lm.position[0] / 22) * 38}%`
                          const top = `${50 + (lm.position[2] / 22) * 38}%`
                          return (
                            <button
                              key={lm.id}
                              type="button"
                              onClick={() => requestTeleport(lm.teleportTo, lm.id)}
                              title={`Teleport to ${lm.name}`}
                              style={{
                                position: 'absolute',
                                left,
                                top,
                                transform: 'translate(-50%, -50%)',
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: '#ffffff',
                                border: `2.5px solid ${lm.badgeColor}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 13,
                                boxShadow: '0 4px 10px rgba(59,55,119,0.2)',
                              }}
                            >
                              {lm.emoji}
                            </button>
                          )
                        })}
                        {/* Live Player Dot */}
                        <div
                          style={{
                            position: 'absolute',
                            left: `${50 + (playerPosition[0] / 22) * 38}%`,
                            top: `${50 + (playerPosition[2] / 22) * 38}%`,
                            transform: 'translate(-50%, -50%)',
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: 'var(--cw-coral)',
                            border: '2.5px solid #fff',
                            boxShadow: '0 0 0 4px rgba(242,103,111,0.35)',
                          }}
                        />
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 900,
                          color: 'var(--cw-navy-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        Fast Travel Districts
                      </div>

                      {COASTAL_LANDMARKS.map((lm) => (
                        <button
                          key={lm.id}
                          type="button"
                          onClick={() => requestTeleport(lm.teleportTo, lm.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: 16,
                            background: '#ffffff',
                            boxShadow: '0 4px 12px rgba(59,55,119,0.06)',
                            textAlign: 'left',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 18 }}>{lm.emoji}</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--cw-navy)' }}>
                                {lm.name}
                              </div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cw-navy-muted)' }}>
                                {lm.subtitle}
                              </div>
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 900,
                              color: 'var(--cw-mint)',
                            }}
                          >
                            GO →
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {phoneTab === 'quests' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {quests.map((q) => (
                        <div
                          key={q.id}
                          style={{
                            padding: 12,
                            borderRadius: 16,
                            background: '#ffffff',
                            boxShadow: '0 4px 12px rgba(59,55,119,0.06)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 6,
                            }}
                          >
                            <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--cw-navy)' }}>
                              {q.done ? '✅ ' : '🚩 '}
                              {q.title}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 900,
                                padding: '2px 8px',
                                borderRadius: 999,
                                background: q.done ? '#e2faf4' : '#fff8e1',
                                color: q.done ? 'var(--cw-mint-shadow)' : '#b47b00',
                              }}
                            >
                              {q.reward}
                            </span>
                          </div>
                          <div
                            style={{
                              height: 7,
                              borderRadius: 999,
                              background: 'var(--cw-surface-muted)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${(q.current / q.target) * 100}%`,
                                height: '100%',
                                borderRadius: 999,
                                background: q.done ? 'var(--cw-mint)' : 'var(--cw-coral)',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {phoneTab === 'passport' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {COASTAL_LANDMARKS.map((lm) => {
                        const unlocked = visitedLandmarks.includes(lm.id)
                        return (
                          <div
                            key={lm.id}
                            style={{
                              padding: 12,
                              borderRadius: 18,
                              background: '#ffffff',
                              textAlign: 'center',
                              opacity: unlocked ? 1 : 0.45,
                              border: unlocked
                                ? `2px solid ${lm.badgeColor}`
                                : '2px dashed var(--cw-border-soft)',
                            }}
                          >
                            <div style={{ fontSize: 26, marginBottom: 4 }}>{lm.emoji}</div>
                            <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--cw-navy)' }}>
                              {lm.name}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                color: unlocked ? 'var(--cw-mint)' : 'var(--cw-navy-muted)',
                                marginTop: 2,
                              }}
                            >
                              {unlocked ? 'STAMPED ✓' : 'UNDISCOVERED'}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="cw-phone-tabs">
                  <button
                    type="button"
                    className={`cw-phone-tab ${phoneTab === 'map' ? 'is-active' : ''}`}
                    onClick={() => setPhoneTab('map')}
                  >
                    <span style={{ fontSize: 16 }}>📍</span>
                    Map
                  </button>
                  <button
                    type="button"
                    className={`cw-phone-tab ${phoneTab === 'quests' ? 'is-active' : ''}`}
                    onClick={() => setPhoneTab('quests')}
                  >
                    <span style={{ fontSize: 16 }}>🚩</span>
                    Quests
                  </button>
                  <button
                    type="button"
                    className={`cw-phone-tab ${phoneTab === 'passport' ? 'is-active' : ''}`}
                    onClick={() => setPhoneTab('passport')}
                  >
                    <span style={{ fontSize: 16 }}>📋</span>
                    Passport
                  </button>
                  <button
                    type="button"
                    className="cw-phone-tab"
                    onClick={() => setPhoneTab('style')}
                  >
                    <span style={{ fontSize: 16 }}>👕</span>
                    Style
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN TO RESUME MODAL */}
      {loginModalOpen && (
        <div className="cw-modal-backdrop" onClick={() => setLoginModalOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(420px, 100%)',
              background: '#ffffff',
              borderRadius: 'var(--cw-radius-modal)',
              padding: 28,
              boxShadow: 'var(--cw-shadow-card)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--cw-mint)',
              }}
            >
              COASTAL PASSPORT
            </div>
            <h2 style={{ margin: '6px 0 8px', fontSize: 24, fontWeight: 900 }}>
              Resume your journey
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: 14, fontWeight: 700, color: 'var(--cw-navy-muted)' }}>
              Enter your explorer nickname to step right back onto the Arrival Pier.
            </p>
            <input
              type="text"
              placeholder="Explorer nickname (e.g. Marina)"
              defaultValue="Coastal Explorer"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 16,
                border: '2px solid var(--cw-border-soft)',
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: 800,
                color: 'var(--cw-navy)',
                marginBottom: 18,
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button type="button" className="cw-cta cw-cta--mint" onClick={handleStartJourney}>
                <span className="cw-cta-inner" style={{ padding: '11px 26px', fontSize: 14 }}>
                  Continue →
                </span>
              </button>
              <button
                type="button"
                className="cw-cta cw-cta--white"
                onClick={() => setLoginModalOpen(false)}
              >
                <span className="cw-cta-inner" style={{ padding: '11px 20px', fontSize: 14 }}>
                  Cancel
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MENU DRAWER */}
      {menuOpen && (
        <div className="cw-modal-backdrop" onClick={() => setMenuOpen(false)}>
          <aside className="cw-drawer" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: '0.1em',
                    color: 'var(--cw-mint)',
                    textTransform: 'uppercase',
                  }}
                >
                  COASTAL WORLD 1:1
                </div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>Explorer Menu</div>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--cw-surface)',
                  fontWeight: 900,
                  color: 'var(--cw-navy)',
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                padding: 14,
                borderRadius: 20,
                background: 'var(--cw-surface)',
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1.5,
              }}
            >
              <strong>Controls:</strong> Use <code>WASD</code> / Arrow keys or{' '}
              <strong>click &amp; drag</strong> anywhere on the island to walk. Click any NPC or
              walk close to chat and earn <strong>CP</strong>!
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                className="cw-cta cw-cta--mint"
                style={{ width: '100%' }}
                onClick={() => openPhone('map')}
              >
                <span className="cw-cta-inner" style={{ width: '100%', padding: '11px 18px', fontSize: 14 }}>
                  📱 Open Smartphone ({cp} CP · {collectedCoins.length}/{ISLAND_COINS.length} coins)
                </span>
              </button>

              <button
                type="button"
                className="cw-cta cw-cta--yellow"
                style={{ width: '100%' }}
                onClick={() => {
                  setMenuOpen(false)
                  toggleCustomizer(true)
                }}
              >
                <span className="cw-cta-inner" style={{ width: '100%', padding: '11px 18px', fontSize: 14 }}>
                  👕 Customize Character
                </span>
              </button>

              <a
                href="../coastal-design-system/design-system.html"
                target="_blank"
                rel="noreferrer"
                className="cw-cta cw-cta--lavender"
                style={{ width: '100%', textDecoration: 'none' }}
              >
                <span className="cw-cta-inner" style={{ width: '100%', padding: '11px 18px', fontSize: 14 }}>
                  🎨 Open Coastal Design System
                </span>
              </a>

              <button
                type="button"
                className="cw-cta cw-cta--coral"
                style={{ width: '100%' }}
                onClick={resetJourney}
              >
                <span className="cw-cta-inner" style={{ width: '100%', padding: '11px 18px', fontSize: 14 }}>
                  ⛵ Replay Ferry Arrival Intro
                </span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
