# Quadro de Tarefas — Equipe Blequi (CEOs Raynocas & Kafuzinho)

Todos os funcionários existentes (**Luma**, **Kael**, **Vex** e **Nori**) agora trabalham reunidos na **Sede da Blequi**, podendo conversar entre si (`consult_colleague`), pedir ajuda e coordenar entregas em conjunto.

---

## Frente 1 — CEO Raynocas (Ray) + Squad Ambientação & Estética (`Luma` & `Vex`)

**Escopo:** Melhorar ambientação (plantas, luz, qualidade da água e objetos em geral), personagens, acessórios e estética da Ilha Blequi.

- [ ] **Evolução da vegetação e plantas da ilha** *(novas espécies, variação de cores, movimento suave de brisa em InstancedMesh)*
  - **Agentes:** Luma (direção de arte) + Vex (instancing 60 FPS)
  - **Área:** `ambiente-3d/island/CoastalWorldProps.tsx`
- [ ] **Qualidade da água, reflexos e iluminação costeira** *(shader de oceano mais rico, espuma dinâmica na costa, luz dourada/dia/noite refinada)*
  - **Agentes:** Vex + Luma
  - **Área:** `ambiente-3d/shaders/coastalShaders.ts` + `ambiente-3d/StudioScene.tsx`
- [ ] **Qualidade visual dos objetos da ilha** *(acabamento de mobiliário, barcos, faróis, postes e props construídos pelos agentes)*
  - **Agentes:** Luma + Vex
  - **Área:** `ambiente-3d/props/WorldCreations.tsx` + `ambiente-3d/island/CoastalWorldProps.tsx`
- [ ] **Melhoria de personagens, acessórios e estética** *(novos acessórios no Customizador 3D: óculos de sol, boina, capa, expressões e paletas)*
  - **Agentes:** Luma + Vex
  - **Área:** `ambiente-3d/avatars/CoastalCharacterMesh.tsx` + `plataforma/components/CoastalCustomizerHud.tsx`

---

## Frente 2 — CEO Kafuzinho (Kafu) + Squad Edifícios, Interiores & Animações (`Kael` & `Nori`)

**Escopo:** Criar edifícios, interiores caminháveis, física/hitboxes e animações do personagem com o mundo e com outros personagens.

- [x] **Hitboxes e impacto físico nos objetos da ilha e na Sede da Blequi** *(colisão suave com prédios, árvores, postes, pier e props dinâmicos)*
  - **Agentes:** Kael + Vex
  - **Área:** `ambiente-3d/island/islandColliders.ts` + `ambiente-3d/island/PlayablePlayerController.tsx`
- [x] **Transferência da equipe para a Sede da Blequi e colaboração entre agentes** *(todos os agentes na Sede + ferramenta `consult_colleague`)*
  - **Agentes:** Nori + Kael
  - **Área:** `funcionarios/roster.ts` + `server/geminiAgency.ts`
- [ ] **Novos edifícios e expansão de interiores da ilha** *(5º edifício no Mirante Editorial, salas dedicadas e detalhes arquitetônicos)*
  - **Agentes:** Kael + Luma (apoio visual)
  - **Área:** `ambiente-3d/island/CoastalStudios.tsx` + `ambiente-3d/zones/CoastalStudioInterior.tsx`
- [ ] **Animações do personagem com o mundo** *(sentar em bancos/sofás, acenar, pegar café, abrir portas, pulo/interação física)*
  - **Agentes:** Kael + Nori
  - **Área:** `ambiente-3d/avatars/CoastalCharacterMesh.tsx` + `ambiente-3d/island/PlayablePlayerController.tsx`
- [ ] **Animações e interações entre personagens** *(diálogos espontâneos entre agentes na Sede, reações em grupo quando um CEO aprova criações)*
  - **Agentes:** Nori + Kael
  - **Área:** `ambiente-3d/avatars/StudioResidentAgent.tsx` + `server/geminiAgency.ts`

---

## Concluído Recentemente
- [x] Botão inicial direcionando para login CEO simplificado (Login + Senha + Entrar) exclusivo para **Raynocas** e **Kafuzinho**
- [x] Painel Governança Local com registro de chaves API de múltiplos provedores de IA com logos salvos + exibição limpa de IP LAN / Tailscale
- [x] Persistência automática da última posição do personagem na ilha (sem resetar para o píer)
- [x] Sistema de hitboxes físicas para objetos da ilha e interiores
- [x] Pavilhão renomeado para **Sede da Blequi** com todos os funcionários transferidos para o edifício
