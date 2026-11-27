# Guia de Trabalho em Equipe — Ilha Blequi (Co-CEO 1 & Co-CEO 2)

Este guia organiza como vocês duas compartilham o **mesmo código**, **dividem tarefas sem conflito** e **testam a Ilha Blequi ao vivo juntas**.

---

## 1. Subir o projeto para um repositório privado no GitHub (1ª vez — Co-CEO 1)

O repositório Git local já está inicializado na branch `main` com `.gitignore` protegendo `.env` e `estado-mundo/agency-state.json`.

1. Crie um repositório **Privado** no GitHub (ex.: `blequi-ilha-3d`), **sem** marcar README/.gitignore (o projeto já tem tudo).
2. Conecte e envie o código inicial:
   ```bash
   git remote add origin https://github.com/SEU-USUARIO/blequi-ilha-3d.git
   git push -u origin main
   ```
3. Em **Settings → Collaborators** do repositório no GitHub, adicione a conta GitHub da sua amiga como colaboradora.

---

## 2. Configurar no computador da sua amiga (Co-CEO 2)

No PC dela, rode apenas 1 vez:

```bash
git clone https://github.com/SEU-USUARIO/blequi-ilha-3d.git
cd blequi-ilha-3d
npm install
copy .env.example .env   # (no Mac/Linux: cp .env.example .env)
```

Depois, basta colar a `GEMINI_API_KEY` (opcional) no `.env` ou direto pelo menu dentro do app, e rodar:

```bash
npm run dev
```

---

## 3. Como Dividir Tarefas sem Conflito de Código

A regra de ouro para 2 pessoas programarem ao mesmo tempo sem dor de cabeça é **dividir por pastas independentes** e registrar quem pegou cada card em `projetos/TAREFAS.md`:

| Frente de Trabalho | Pastas Donas | Exemplos de Tarefas |
| :--- | :--- | :--- |
| **3D · Ilha & Cenário Externo** | `ambiente-3d/island/`, `ambiente-3d/shaders/` | Novos prédios, barcos, clima, praia, shaders de água/céu |
| **3D · Interiores & Props** | `ambiente-3d/zones/`, `ambiente-3d/props/`, `ambiente-3d/workstations/` | Decoração dos 4 estúdios, novos móveis e props 3D |
| **3D · Avatares & Acessórios** | `ambiente-3d/avatars/` | Novos chapéus, mochilas, calçados, animações de personagem |
| **Interface, HUD & Celular** | `plataforma/components/`, `src/index.css` | Novos apps no celular, telas, modais, micro-animações CSS |
| **IA, Agentes & Servidor** | `funcionarios/`, `server/`, `projetos/` | Novos funcionários, prompts, ferramentas Gemini, sync SSE |

> **Dica de ouro:** Evitem editar `plataforma/store/useAgencyStore.ts` ou `ambiente-3d/StudioScene.tsx` ao mesmo tempo. Se precisarem mexer nesses arquivos centrais, avisem antes e façam um `git pull` rápido.

---

## 4. Fluxo Diário em 4 Passos (Simples e Seguro)

### Antes de começar uma tarefa:
```bash
git checkout main
git pull origin main
git checkout -b feat/nome-curto-da-tarefa
```
*(Sugestão de prefixos: `art/` para 3D e visual, `feat/` para nova função, `fix/` para correção.)*

### Quando terminar a tarefa:
1. Valide que tudo compila limpo:
   ```bash
   npm run check
   ```
2. Salve e envie sua branch:
   ```bash
   git add .
   git commit -m "feat: descreva o que você criou"
   git push -u origin feat/nome-curto-da-tarefa
   ```
3. Abra um **Pull Request** no GitHub para `main` (o template já vem preenchido!) → revise rápido → clique em **Merge**!
4. Ambas rodam `git checkout main && git pull origin main` para pegar a versão atualizada.

---

## 5. Trabalhando com Agentes de IA (Antigravity / Gemini)

- Antes de pedir uma tarefa grande para o agente, **crie uma branch própria** (`git checkout -b feat/...`) para manter a `main` sempre estável.
- As diretrizes de arquitetura e 60 FPS já ficam sincronizadas entre vocês duas em `GEMINI.md` e `.agents/skills/`.

---

## 6. Testar AO VIVO Juntas na Mesma Ilha Blequi (LAN / Tailscale)

1. No PC Host (Co-CEO 1): rode `npm run dev:lan`.
2. Abra o **Menu (☰) → Gemini Live & Rede LAN** para copiar o link de rede (ex.: `http://192.168.x.x:5173` ou IP do **Tailscale** se estiverem em casas diferentes).
3. Sua amiga abre esse link no navegador e entra como **Co-CEO 2** usando a mesma **Chave CEO** (`blequi-ceo` ou a que vocês definirem no `.env`).
4. Vocês se verão andando ao vivo pela ilha e dentro dos estúdios com coroa `Co-CEO`!
