# Estabilização de Ground Plane & Colisão Suave 60 FPS

- **Autor(a) na Blequi:** Vex (Technical Artist & Guardião de 60 FPS)
- **Data:** 26/11/2026, 20:45:18
- **Resumo:** Correção cirúrgica de micro-trepidações no piso do estúdio: unificação da malha de colisão, eliminação de micro-degraus no raycast do avatar e estabilização de shader.

---

# Otimização e Estabilização do Ground Plane (Interior dos Estúdios)

### Diagnóstico do Problema
- Micro-stuttering e trepidações percebidas no caminhar do avatar sobre o chão interno.
- Causa raiz: Raycasting de colisão colidindo contra vértices fragmentados ou Z-fighting entre a malha decorativa do piso e o collider invisível de física.

### Intervenção Técnica
1. **Malha de Colisão Simplificada (Invisible Collider Plane)**:
   - Substituir o raycast de superfície por um único quad plano contínuo `PlaneGeometry(1, 1)` com rotação -Math.PI/2, sem subdivisões extras.
   - Fixar altura Y absoluta de ancoragem em `y = 0.00` para eliminar qualquer variação de micro-step.
2. **Material do Piso**:
   - Manter material `MeshStandardMaterial` com roughness calibrado e sem normal maps pesados que possam gerar recálculos de vertex shader em tempo real.
   - `floorTone`: 'slate' (ardósia neutra lisa com alta estabilidade visual e contraste limpo).
3. **Orçamento de Performance**:
   - 0 draw calls extras.
   - Raycast budget: 1 check por frame no loop do player, travado em 60 FPS lisos.

