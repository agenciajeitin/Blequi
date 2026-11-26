import * as THREE from 'three'

export interface StudioTextureBundle {
  woodColor: THREE.CanvasTexture
  woodRoughness: THREE.CanvasTexture
  wallPlaster: THREE.CanvasTexture
  leftScreen: THREE.CanvasTexture
  rightScreen: THREE.CanvasTexture
  leftArt: THREE.CanvasTexture
  rightArt: THREE.CanvasTexture
  dispose: () => void
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

/** Deterministic PRNG so textures always render identically */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function createWoodFloorTextures(): {
  woodColor: THREE.CanvasTexture
  woodRoughness: THREE.CanvasTexture
} {
  const size = 1024
  const colorCanvas = document.createElement('canvas')
  colorCanvas.width = size
  colorCanvas.height = size
  const ctx = colorCanvas.getContext('2d')!

  const roughCanvas = document.createElement('canvas')
  roughCanvas.width = size
  roughCanvas.height = size
  const rctx = roughCanvas.getContext('2d')!

  const rand = mulberry32(4219)
  const plankRows = 10
  const plankH = size / plankRows

  // Base warm honey-oak fill
  ctx.fillStyle = '#b47849'
  ctx.fillRect(0, 0, size, size)
  rctx.fillStyle = '#8f8f8f'
  rctx.fillRect(0, 0, size, size)

  const palette = [
    [186, 125, 76],
    [174, 112, 65],
    [196, 136, 86],
    [166, 106, 61],
    [203, 144, 93],
    [179, 119, 71],
  ]

  for (let row = 0; row < plankRows; row++) {
    const y = row * plankH
    const splitX = Math.floor((0.18 + rand() * 0.64) * size)
    const segments = [
      { x: 0, w: splitX },
      { x: splitX, w: size - splitX },
    ]

    for (const seg of segments) {
      const base = palette[Math.floor(rand() * palette.length)]
      const delta = (rand() - 0.5) * 14
      const r = Math.min(255, Math.max(0, base[0] + delta))
      const g = Math.min(255, Math.max(0, base[1] + delta * 0.85))
      const b = Math.min(255, Math.max(0, base[2] + delta * 0.7))

      // Plank base gradient
      const grad = ctx.createLinearGradient(seg.x, y, seg.x + seg.w, y + plankH)
      grad.addColorStop(0, `rgb(${r + 5}, ${g + 4}, ${b + 3})`)
      grad.addColorStop(0.5, `rgb(${r}, ${g}, ${b})`)
      grad.addColorStop(1, `rgb(${r - 7}, ${g - 5}, ${b - 4})`)
      ctx.fillStyle = grad
      ctx.fillRect(seg.x, y, seg.w, plankH)

      // Roughness variation per plank
      const roughVal = Math.floor(125 + rand() * 36)
      rctx.fillStyle = `rgb(${roughVal},${roughVal},${roughVal})`
      rctx.fillRect(seg.x, y, seg.w, plankH)

      // Subtle organic wood grain fibers
      const grainCount = 26
      for (let i = 0; i < grainCount; i++) {
        const gy = y + 3 + rand() * (plankH - 6)
        const dark = rand() > 0.35
        ctx.strokeStyle = dark
          ? `rgba(82, 44, 18, ${0.06 + rand() * 0.09})`
          : `rgba(235, 185, 130, ${0.04 + rand() * 0.06})`
        ctx.lineWidth = 0.8 + rand() * 1.8
        ctx.beginPath()
        ctx.moveTo(seg.x, gy)
        const waveAmp = (rand() - 0.5) * 5
        ctx.bezierCurveTo(
          seg.x + seg.w * 0.33,
          gy + waveAmp,
          seg.x + seg.w * 0.66,
          gy - waveAmp,
          seg.x + seg.w,
          gy + (rand() - 0.5) * 2
        )
        ctx.stroke()

        rctx.strokeStyle = `rgba(175, 175, 175, ${0.08 + rand() * 0.08})`
        rctx.lineWidth = 1.2
        rctx.beginPath()
        rctx.moveTo(seg.x, gy)
        rctx.lineTo(seg.x + seg.w, gy)
        rctx.stroke()
      }

      // Plank vertical end seam
      ctx.fillStyle = 'rgba(54, 28, 12, 0.45)'
      ctx.fillRect(seg.x, y, 2, plankH)
      rctx.fillStyle = '#dcdcdc'
      rctx.fillRect(seg.x, y, 2, plankH)
    }

    // Horizontal groove between plank rows
    ctx.fillStyle = 'rgba(58, 30, 12, 0.5)'
    ctx.fillRect(0, y, size, 2.2)
    ctx.fillStyle = 'rgba(240, 198, 152, 0.14)'
    ctx.fillRect(0, y + 2.2, size, 1.2)
    rctx.fillStyle = '#e5e5e5'
    rctx.fillRect(0, y, size, 2.5)
  }

  const woodColor = new THREE.CanvasTexture(colorCanvas)
  woodColor.colorSpace = THREE.SRGBColorSpace
  woodColor.wrapS = THREE.RepeatWrapping
  woodColor.wrapT = THREE.RepeatWrapping
  woodColor.anisotropy = 8

  const woodRoughness = new THREE.CanvasTexture(roughCanvas)
  woodRoughness.wrapS = THREE.RepeatWrapping
  woodRoughness.wrapT = THREE.RepeatWrapping
  woodRoughness.anisotropy = 4

  return { woodColor, woodRoughness }
}

function createWallPlasterTexture(): THREE.CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const rand = mulberry32(9912)

  // Soft vertical studio gradient matching print1 architectural grey walls
  const grad = ctx.createLinearGradient(0, 0, 0, size)
  grad.addColorStop(0, '#9ea4b2')
  grad.addColorStop(0.22, '#b4bac6')
  grad.addColorStop(0.85, '#b9beca')
  grad.addColorStop(1, '#9da2af')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  // Ultra-fine plaster grain
  for (let i = 0; i < 4500; i++) {
    const x = rand() * size
    const y = rand() * size
    const alpha = 0.015 + rand() * 0.025
    ctx.fillStyle = rand() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(20,25,38,${alpha})`
    ctx.fillRect(x, y, 2, 2)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}

function createLeftScreenTexture(): THREE.CanvasTexture {
  const w = 1280
  const h = 760
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  // Clean luminous board surface matching print1 left screen
  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, '#f5f8fd')
  bg.addColorStop(0.55, '#eef3fb')
  bg.addColorStop(1, '#e6eef9')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // Soft ambient corner light sheen
  const sheen = ctx.createRadialGradient(w * 0.25, h * 0.15, 20, w * 0.25, h * 0.15, w * 0.7)
  sheen.addColorStop(0, 'rgba(255,255,255,0.65)')
  sheen.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = sheen
  ctx.fillRect(0, 0, w, h)

  // Header
  ctx.fillStyle = '#1e293b'
  ctx.font = '700 48px "Plus Jakarta Sans", "Inter", system-ui, sans-serif'
  ctx.fillText('Blequi · Ecossistema & SEO', 76, 122)

  ctx.fillStyle = '#64748b'
  ctx.font = '500 22px "Plus Jakarta Sans", "Inter", system-ui, sans-serif'
  ctx.fillText('Arquitetura modular pronta para escalar de estúdio enxuto a sede gigante', 76, 166)

  // 3 iconic rounded squircle tiles matching print1's 3-column composition
  const cards = [
    {
      x: 76,
      colorTop: '#4e82f6',
      colorBot: '#3868e0',
      badge: 'SEO',
      title: 'Busca & Conteúdo',
      lines: ['Autoridade orgânica', 'Arquitetura semântica', 'Performance técnica'],
      iconType: 'seo' as const,
    },
    {
      x: 472,
      colorTop: '#5b93f8',
      colorBot: '#3d74e6',
      badge: 'DATA',
      title: 'Inteligência & Escala',
      lines: ['Métricas em tempo real', 'Análise de conversão', 'Crescimento contínuo'],
      iconType: 'chart' as const,
    },
    {
      x: 868,
      colorTop: '#4ec078',
      colorBot: '#2f9e59',
      badge: 'OPS',
      title: 'Campanhas & IA',
      lines: ['Orquestração de fluxos', 'Criação assistida', 'Entrega acelerada'],
      iconType: 'spark' as const,
    },
  ]

  for (const card of cards) {
    const tileW = 310
    const tileH = 228
    const tileY = 222

    // Soft elevation shadow
    ctx.save()
    ctx.shadowColor = 'rgba(30, 58, 138, 0.18)'
    ctx.shadowBlur = 28
    ctx.shadowOffsetY = 14
    const grad = ctx.createLinearGradient(card.x, tileY, card.x, tileY + tileH)
    grad.addColorStop(0, card.colorTop)
    grad.addColorStop(1, card.colorBot)
    ctx.fillStyle = grad
    roundRectPath(ctx, card.x, tileY, tileW, tileH, 34)
    ctx.fill()
    ctx.restore()

    // Crisp vector icon / badge inside squircle
    ctx.fillStyle = '#ffffff'
    if (card.iconType === 'seo') {
      ctx.font = '800 84px "Plus Jakarta Sans", "Inter", system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('SEO', card.x + tileW / 2, tileY + 144)
      ctx.textAlign = 'left'
    } else if (card.iconType === 'chart') {
      // Ascending bar + trend arrow icon matching print1 middle card
      const bx = card.x + 82
      const by = tileY + 168
      roundRectPath(ctx, bx, by - 52, 34, 52, 8)
      ctx.fill()
      roundRectPath(ctx, bx + 52, by - 82, 34, 82, 8)
      ctx.fill()
      roundRectPath(ctx, bx + 104, by - 114, 34, 114, 8)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.92)'
      ctx.lineWidth = 8
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(bx + 6, by - 72)
      ctx.lineTo(bx + 68, by - 102)
      ctx.lineTo(bx + 128, by - 134)
      ctx.stroke()
    } else {
      // Stylized campaign shield/node icon matching print1 green card
      const cx = card.x + tileW / 2
      const cy = tileY + tileH / 2
      ctx.fillStyle = 'rgba(255,255,255,0.95)'
      ctx.beginPath()
      ctx.arc(cx, cy, 56, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#f59e0b'
      ctx.beginPath()
      ctx.moveTo(cx - 20, cy + 16)
      ctx.lineTo(cx + 8, cy - 28)
      ctx.lineTo(cx + 22, cy + 16)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#2f9e59'
      ctx.beginPath()
      ctx.arc(cx - 10, cy + 12, 14, 0, Math.PI * 2)
      ctx.fill()
    }

    // Card title & clean caption lines below squircle
    ctx.fillStyle = '#1e293b'
    ctx.font = '700 28px "Plus Jakarta Sans", "Inter", system-ui, sans-serif'
    ctx.fillText(card.title, card.x + 6, tileY + tileH + 56)

    ctx.fillStyle = '#475569'
    ctx.font = '500 20px "Plus Jakarta Sans", "Inter", system-ui, sans-serif'
    card.lines.forEach((line, idx) => {
      ctx.fillText(line, card.x + 6, tileY + tileH + 96 + idx * 32)
    })
  }

  // Subtle footer status bar
  ctx.fillStyle = 'rgba(148, 163, 184, 0.25)'
  ctx.fillRect(76, 682, w - 152, 2)
  ctx.fillStyle = '#64748b'
  ctx.font = '600 18px "JetBrains Mono", monospace'
  ctx.fillText('BLEQUI STUDIO · AMBIENTE ISOMÉTRICO', 76, 720)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#3b82f6'
  ctx.fillText('PRONTO PARA EXPANSÃO', w - 76, 720)
  ctx.textAlign = 'left'

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

function createRightScreenTexture(): THREE.CanvasTexture {
  const w = 1280
  const h = 760
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  // Clean white-blue board matching print1 right screen
  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, '#f4f7fd')
  bg.addColorStop(0.6, '#ecf2fa')
  bg.addColorStop(1, '#e3ecf8')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // Signature royal-blue heading matching print1 ("Digital Marketing")
  ctx.fillStyle = '#3b73e5'
  ctx.font = '700 50px "Plus Jakarta Sans", "Inter", system-ui, sans-serif'
  ctx.fillText('Digital Marketing & IA', 78, 124)

  // Left editorial column
  ctx.fillStyle = '#1e293b'
  ctx.font = '700 26px "Plus Jakarta Sans", "Inter", system-ui, sans-serif'
  ctx.fillText('Motores homologados na agência', 78, 198)

  ctx.fillStyle = '#475569'
  ctx.font = '500 20px "Plus Jakarta Sans", "Inter", system-ui, sans-serif'
  ctx.fillText('Cinco provedores preparados para operar', 78, 238)
  ctx.fillText('junto com pessoas reais dentro do estúdio.', 78, 268)

  // Clean pills for the exact 5 allowed providers
  const providers = [
    { name: 'OpenCode', code: 'OPC', color: '#10b981' },
    { name: 'Gemini', code: 'GEM', color: '#3b82f6' },
    { name: 'Antigravity', code: 'AGY', color: '#6366f1' },
    { name: 'Claude', code: 'CLD', color: '#e07a3f' },
    { name: 'Codex', code: 'CDX', color: '#0ea5e9' },
  ]

  providers.forEach((p, idx) => {
    const py = 314 + idx * 66
    ctx.save()
    ctx.shadowColor = 'rgba(15, 23, 42, 0.06)'
    ctx.shadowBlur = 12
    ctx.shadowOffsetY = 4
    ctx.fillStyle = '#ffffff'
    roundRectPath(ctx, 78, py, 440, 50, 14)
    ctx.fill()
    ctx.restore()

    // Color dot
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(106, py + 25, 8, 0, Math.PI * 2)
    ctx.fill()

    // Provider name
    ctx.fillStyle = '#1e293b'
    ctx.font = '600 22px "Plus Jakarta Sans", "Inter", system-ui, sans-serif'
    ctx.fillText(p.name, 130, py + 32)

    // Badge
    ctx.fillStyle = `${p.color}22`
    roundRectPath(ctx, 434, py + 11, 68, 28, 8)
    ctx.fill()
    ctx.fillStyle = p.color
    ctx.font = '700 15px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillText(p.code, 468, py + 30)
    ctx.textAlign = 'left'
  })

  // Right side: floating clean UI cards (matching print1 right screen)
  // Upper floating card
  ctx.save()
  ctx.shadowColor = 'rgba(30, 58, 138, 0.12)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 10
  ctx.fillStyle = '#ffffff'
  roundRectPath(ctx, 640, 194, 520, 176, 22)
  ctx.fill()
  ctx.restore()

  // Donut/pie chart inside floating card (matching print1 colorful pie accent)
  const cx = 724
  const cy = 282
  const r = 46
  const slices = [
    { start: 0, end: 1.9, color: '#3b82f6' },
    { start: 1.9, end: 3.4, color: '#10b981' },
    { start: 3.4, end: 4.8, color: '#f59e0b' },
    { start: 4.8, end: Math.PI * 2, color: '#e07a3f' },
  ]
  for (const s of slices) {
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, s.start, s.end)
    ctx.closePath()
    ctx.fillStyle = s.color
    ctx.fill()
  }
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(cx, cy, 22, 0, Math.PI * 2)
  ctx.fill()

  // Mini bars/lines inside upper floating card
  ctx.fillStyle = '#1e293b'
  ctx.font = '700 22px "Plus Jakarta Sans", "Inter", system-ui, sans-serif'
  ctx.fillText('Operação Híbrida', 804, 250)
  ctx.fillStyle = '#64748b'
  ctx.font = '500 18px "Plus Jakarta Sans", "Inter", system-ui, sans-serif'
  ctx.fillText('Pessoas reais + Agentes IA', 804, 282)

  ctx.fillStyle = '#e2e8f0'
  roundRectPath(ctx, 804, 308, 310, 12, 6)
  ctx.fill()
  ctx.fillStyle = '#3b82f6'
  roundRectPath(ctx, 804, 308, 225, 12, 6)
  ctx.fill()

  // Signature 5 ascending colored bars in bottom-right corner (exact print1 palette!)
  const bars = [
    { h: 98, color: '#f5b82e' },
    { h: 146, color: '#3bc16b' },
    { h: 184, color: '#4d84f5' },
    { h: 218, color: '#3c70e8' },
    { h: 256, color: '#2f5cd6' },
  ]
  const baseLineY = 678
  const startBarX = 724
  bars.forEach((bar, i) => {
    const bx = startBarX + i * 86
    const by = baseLineY - bar.h
    ctx.save()
    ctx.shadowColor = 'rgba(30, 58, 138, 0.16)'
    ctx.shadowBlur = 14
    ctx.shadowOffsetY = 6
    ctx.fillStyle = bar.color
    roundRectPath(ctx, bx, by, 54, bar.h, 12)
    ctx.fill()
    ctx.restore()
  })

  // Subtle baseline under bar chart
  ctx.fillStyle = 'rgba(148, 163, 184, 0.35)'
  ctx.fillRect(692, baseLineY + 6, 480, 3)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** Left framed painting inspired by print1's warm organic abstract canvas */
function createLeftArtTexture(): THREE.CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#f3f0e8'
  ctx.fillRect(0, 0, size, size)

  // Warm burnt-orange organic shape
  ctx.fillStyle = '#e05a2b'
  ctx.beginPath()
  ctx.ellipse(size * 0.62, size * 0.44, size * 0.28, size * 0.36, 0.18, 0, Math.PI * 2)
  ctx.fill()

  // Golden ochre accent overlay
  ctx.fillStyle = '#f2a93b'
  ctx.beginPath()
  ctx.ellipse(size * 0.54, size * 0.32, size * 0.18, size * 0.24, -0.3, 0, Math.PI * 2)
  ctx.fill()

  // Deep charcoal-navy silhouette curve
  ctx.fillStyle = '#1b202c'
  ctx.beginPath()
  ctx.moveTo(size * 0.46, size)
  ctx.bezierCurveTo(size * 0.44, size * 0.68, size * 0.66, size * 0.56, size * 0.84, size * 0.72)
  ctx.lineTo(size * 0.9, size)
  ctx.closePath()
  ctx.fill()

  // Small dark organic dot left
  ctx.fillStyle = '#202636'
  ctx.beginPath()
  ctx.ellipse(size * 0.24, size * 0.52, size * 0.08, size * 0.11, -0.2, 0, Math.PI * 2)
  ctx.fill()

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/** Right framed painting inspired by print1's yellow + op-art contour canvas */
function createRightArtTexture(): THREE.CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Vibrant mustard-gold geometric background
  ctx.fillStyle = '#f2c144'
  ctx.fillRect(0, 0, size, size)

  // Warm pale cream geometric triangles
  ctx.fillStyle = '#f8f5ec'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(size * 0.32, 0)
  ctx.lineTo(size * 0.18, size)
  ctx.lineTo(0, size)
  ctx.closePath()
  ctx.fill()

  // Concentric op-art contour waves in center-right
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(size * 0.58, size * 0.54, size * 0.34, size * 0.42, -0.1, 0, Math.PI * 2)
  ctx.clip()

  ctx.fillStyle = '#faf8f2'
  ctx.fillRect(0, 0, size, size)

  ctx.strokeStyle = '#181c26'
  ctx.lineWidth = 7
  for (let r = 18; r < 260; r += 17) {
    ctx.beginPath()
    for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.08) {
      const wobble = Math.sin(a * 3 + r * 0.03) * 14
      const px = size * 0.58 + Math.cos(a) * (r + wobble)
      const py = size * 0.56 + Math.sin(a) * (r * 1.18 + wobble * 0.7)
      if (a === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.stroke()
  }
  ctx.restore()

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export function createStudioTextures(): StudioTextureBundle {
  const { woodColor, woodRoughness } = createWoodFloorTextures()
  const wallPlaster = createWallPlasterTexture()
  const leftScreen = createLeftScreenTexture()
  const rightScreen = createRightScreenTexture()
  const leftArt = createLeftArtTexture()
  const rightArt = createRightArtTexture()

  return {
    woodColor,
    woodRoughness,
    wallPlaster,
    leftScreen,
    rightScreen,
    leftArt,
    rightArt,
    dispose: () => {
      woodColor.dispose()
      woodRoughness.dispose()
      wallPlaster.dispose()
      leftScreen.dispose()
      rightScreen.dispose()
      leftArt.dispose()
      rightArt.dispose()
    },
  }
}
