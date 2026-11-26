# Blequi — Ilha 3D & Agência Virtual Privada

Agência virtual isométrica híbrida (**Ilha estilo Coastal World + mini-estúdios diorama clicáveis**) construída em **React 19 + TypeScript + Three.js + React Three Fiber v9 + Tailwind CSS v4 + Zustand + `@google/genai` (`gemini-3.8-flash`)**, pensada para rodar localmente e em tempo real entre duas Co-CEOs na rede local ou Tailscale.

## Os 4 Primeiros Funcionários

- **Luma (`Gemini`)** — Diretora de Arte & Dioramas 3D (*Estúdio de Criação*)
- **Kael (`Antigravity` + `Gemini`)** — Creative Developer WebGL / R3F (*Estúdio de Engenharia*)
- **Vex (`Antigravity` + `Gemini`)** — Technical Artist & Guardião de 60 FPS (*Lab de Performance*)
- **Nori (`Gemini`)** — Curadora do Mundo Vivo & Bem-Estar (*Pavilhão Lounge*)

Eles existem em **duas camadas sincronizadas**:
1. **Vivos no mundo 3D** (caminham pela Ilha Blequi, conversam via Gemini com consciência do cenário, auto-constroem objetos 3D no próprio escritório e ganham bem-estar quando celebrados pelas Co-CEOs).
2. **Skills reais no Antigravity** (`.agents/skills/` + `GEMINI.md`), prontos para transformar blueprints de `projetos/blueprints/` em novos módulos 3D reais no código.

## Como Rodar Localmente (Você + sua Amiga)

1. Copie `.env.example` para `.env` (ou cole sua chave direto pelo botão **Config Gemini** dentro do app):
   ```env
   GEMINI_API_KEY=sua_chave_do_google_ai_studio
   BLEQUI_CEO_CODE=blequi-ceo
   ```
   Gere sua chave em: https://aistudio.google.com/app/api-keys

2. Inicie o servidor local no computador host:
   ```bash
   npm run dev
   ```

3. **Seu PC:** acesse `http://localhost:5173` e entre como **Co-CEO 1**.
4. **PC da sua amiga (mesmo Wi-Fi ou Tailscale):** abra o link de rede mostrado no botão **Config Gemini** (ex.: `http://192.168.x.x:5173` ou IP Tailscale) e entre como **Co-CEO 2** com a mesma Chave CEO. Todas as conversas, auto-criações 3D e recompensas sincronizam ao vivo via SSE e ficam salvas em `estado-mundo/agency-state.json`.
