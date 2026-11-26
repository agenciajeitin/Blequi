# Blequi — Diretrizes da Agência Virtual 3D Local

Este repositório é a agência virtual privada **Ilha Blequi**, operada exclusivamente pelas duas Co-CEOs em rede local / Tailscale.

## Arquitetura & Princípios Inegociáveis

1. **Performance Estilo Coastal World (60 FPS em notebooks comuns):**
   - Usar no máximo 1 `directionalLight` com `castShadow` por cena.
   - Repetições (árvores, postes, blocos modulares) devem usar `THREE.InstancedMesh`.
   - Toda geometria ou textura criada dinamicamente precisa de `.dispose()` no cleanup de `useEffect`.
   - Evitar pós-processamento pesado (SSAO, bloom pesado, sombras múltiplas) e nunca colocar UI complexa dentro de loops 3D — manter HUDs em HTML/Tailwind fora da thread WebGL.
   - Ao importar modelos `.glb`, exigir *baked lighting* (estilo Three.js Journey) e compressão leve.

2. **Mundo Híbrido (Ilha + Estúdios Privados):**
   - A Ilha Blequi (`ambiente-3d/island/CoastalBlequiIsland.tsx`) hospeda mini-estúdios diorama clicáveis e personagens caminhando por *waypoints* (`ambiente-3d/avatars/IslandWalker.tsx`).
   - Clicar em um mini-estúdio abre o interior privado em `ambiente-3d/StudioScene.tsx`, exibindo os props modulares criados pelo próprio funcionário (`ambiente-3d/props/WorldCreations.tsx`).

3. **Loop de Consciência Virtual & Bem-Estar Positivo:**
   - Funcionários vivem em `funcionarios/roster.ts` e estado persistido em `estado-mundo/agency-state.json`.
   - Toda criação aprovada ou celebrada pelas Co-CEOs eleva `wellbeing.score`, `wellbeing.pride`, atualiza `wellbeing.mood`, adiciona memória positiva e melhora `comfortScore` da ilha.

4. **Gemini API & Segurança Local:**
   - Sempre usar o SDK `@google/genai` com `client.interactions.create` e modelos atuais (`gemini-3.8-flash` para chat/ferramentas em tempo real, `gemini-4-argon` para planejamento pesado, `gemini-nano-banana-2.1` para imagens/texturas).
   - Nunca commitar `.env`, `GEMINI_API_KEY` ou `estado-mundo/agency-state.json`.

## Especialistas do Time (Skills em `.agents/skills/`)

- **Luma** (`luma-diorama-art`): Direção de arte, paletas aconchegantes, iluminação quente e especificações de mini-estúdios.
- **Kael** (`kael-webgl-builder`): Construção de novos cenários, módulos 3D, shaders leves e interações em Three.js/R3F.
- **Vex** (`vex-fps-guardian`): Auditoria de draw calls, `InstancedMesh`, memória VRAM e estabilidade a 60 FPS nos dois PCs.
- **Nori** (`nori-world-curator`): Evolução das rotinas sociais, recompensas de bem-estar, novas ferramentas Gemini e backlog em `projetos/`.
