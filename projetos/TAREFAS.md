# Quadro de Tarefas — Equipe Blequi (Co-CEO 1 & Co-CEO 2)

Use este quadro compartilhado no Git para dividir entregas sem editar os mesmos arquivos ao mesmo tempo.
Antes de começar uma tarefa, coloque seu nome em **Dona**, crie sua branch e mova o card para **Em Andamento**.

---

## Backlog (Prontas para pegar)

- [ ] **Novos acessórios de avatar no Customizador 3D** *(óculos de sol, boina de artista, capa)*
  - **Área:** `ambiente-3d/avatars/CoastalCharacterMesh.tsx` + `plataforma/components/CoastalCustomizerHud.tsx`
  - **Branch sugerida:** `art/novos-acessorios-avatar`

- [ ] **5º Estúdio no terreno de Expansão (`editorial`)**
  - **Área:** `ambiente-3d/island/CoastalStudios.tsx` + `ambiente-3d/zones/CoastalStudioInterior.tsx`
  - **Branch sugerida:** `art/quinto-estudio-editorial`

- [ ] **Chat rápido entre as 2 Co-CEOs no Celular da Ilha**
  - **Área:** `plataforma/components/CoastalPhoneModal.tsx` + `server/agencyPlugin.ts`
  - **Branch sugerida:** `feat/chat-entre-ceos`

- [ ] **Efeitos sonoros extras no Web Audio (passos na madeira/areia, sinos na prefeitura)**
  - **Área:** `ambiente-3d/audio/coastalAudio.ts`
  - **Branch sugerida:** `feat/sons-costeiros`

- [ ] **Importar primeiro modelo `.glb` com Baked Lighting para um prédio hero**
  - **Área:** `ambiente-3d/island/CoastalStudios.tsx` + `public/models/`
  - **Branch sugerida:** `art/predio-glb-baked`

---

## Em Andamento — Co-CEO 1
- *(Livre — escolha um card do Backlog e anote aqui)*

## Em Andamento — Co-CEO 2
- *(Livre — escolha um card do Backlog e anote aqui)*

---

## Concluído Recentemente
- [x] Ilha Blequi 3D estilo Coastal World 1:1 (oceano GLSL, barco intro, píer jogável, HUD e celular interativo)
- [x] 4 Interiores 3D autorais caminháveis em 3ª pessoa com Luma, Kael, Vex e Nori residentes
- [x] Sincronização multiplayer em tempo real das 2 Co-CEOs na ilha e dentro dos estúdios
- [x] Setup de trabalho em equipe (Git, `.gitattributes`, `.editorconfig`, PR template, `EQUIPE.md`)
