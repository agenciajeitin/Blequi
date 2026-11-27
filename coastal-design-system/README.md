# Coastal World — 1:1 Design System

Catálogo vivo e reutilizável da linguagem visual, interações, componentes e shaders do **Coastal World**, pronto para ser consumido pela equipe da **Ilha Blequi** (Luma, Kael, Vex, Nori e as duas Co-CEOs) ou por qualquer novo projeto web/3D.

## Arquivos

- [`design-system.html`](./design-system.html) — Catálogo interativo completo (**Overview 1:1**, **Foundations**, **Components** e **3D & Shaders Playground**). Funciona direto via `file://` (duplo clique) ou via servidor local (`http://localhost:5173/coastal-design-system/design-system.html`).
- [`tokens.css`](./tokens.css) — CSS Custom Properties (`--cw-*`), cursores SVG customizados (`#3b3777`), botões táteis 3D (`.cw-cta`), botões circulares HUD (`.cw-circle-btn`), orbes chanfrados (`.cw-action-orb`), balão de diálogo (`.cw-speech-bubble`) e animações.
- [`tokens.json`](./tokens.json) — Tokens estruturados em formato W3C Design Tokens (cores, paletas de ambiente, 5 paletas de avatar/celular, tipografia, raios e curvas de easing).
- [`coastal-webgl.js`](./coastal-webgl.js) — Engine WebGL2 pura de céu degradê, nuvens estilizadas e oceano animado com faixas de onda e espuma costeira (60 FPS sem dependências externas).
