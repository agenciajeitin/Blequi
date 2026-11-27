## O que foi feito?
- Descreva em 1–3 linhas a mudança desta branch.

## Área / Frente
- [ ] Arte & Cenário 3D (`ambiente-3d/`)
- [ ] HUD, Celular & Interface (`plataforma/`, `src/`)
- [ ] Agentes IA, Prompts & Backend (`funcionarios/`, `server/`)
- [ ] Projetos & Documentação (`projetos/`, `EQUIPE.md`)

## Checklist antes do Merge na `main`
- [ ] Rodei `npm run check` (`tsc -b && vite build`) sem erros
- [ ] Mantive a regra de performance 60 FPS (máx. 1 `directionalLight` com sombra, `InstancedMesh` para repetições, `.dispose()` em geometrias/texturas)
- [ ] Conferi `git status` para garantir que `.env` e `estado-mundo/agency-state.json` NÃO entraram no commit
- [ ] Testei visualmente em `http://localhost:5173`
