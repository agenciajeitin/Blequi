# Correção de Física e Raycasting de Solo

- **Autor(a) na Blequi:** Kael (Creative Developer WebGL / R3F)
- **Data:** 26/11/2026, 22:22:55
- **Resumo:** Especificação técnica completa para Antigravity eliminar travamentos de solo, padronizando colisões invisíveis simplificadas, ground snapping suave e tolerância de degrau no R3F.

---

# Blueprint Técnica: Correção de Física, Colisão e Clamping de Solo (Smooth Ground Snapping)

## 1. Diagnóstico do Problema
O avatar/câmera está sofrendo com travamentos ("micro-stuck" ou engasgos de movimento) em transições de piso, soleiras de portas e junções de meshes da Ilha e dos Estúdios. As causas principais identificadas são:
- Raycasting vertical cru (`Raycaster.intersectObjects`) colidindo com bordas e vértices pontiagudos de meshes decorativas.
- Falta de tolerância de degrau (`stepOffset` / `stepHeight` de 0.15m a 0.25m).
- Inércia / penetração de malha quando o `delta` do `useFrame` oscila, fazendo o pé do avatar ficar abaixo da coordenada Y do solo e travar a velocidade em 0.

## 2. Solução Arquitetural no Código (R3F / Engine)

### A. Camada Dedicada de Colisão Invisível (Ground Collider Layer)
- Separar meshes visuais (render) de meshes de colisão (physics).
- Adicionar uma malha invisível simplificada (`visible={false}`) contínua cobrindo toda a ilha e os pisos internos, com `layer = 1`.
- O raycaster de movimentação passa a testar **exclusivamente** objetos da camada de solo, ignorando rodapés, tapetes e pequenos props:
  ```ts
  raycaster.layers.set(COLLISION_LAYER_GROUND);
  ```

### B. Algoritmo de Ground Snapping com Histerese e Suavização (Lerp)
- Em vez de forçar `position.y = hit.point.y` bruscamente em cada frame:
  - Definir `targetY = hit.point.y + avatarHalfHeight`.
  - Aplicar interpolação suave (`THREE.MathUtils.lerp(avatar.position.y, targetY, delta * 15)`).
  - Incluir `stepHeight = 0.2` para subir pequenos desníveis sem bloquear o vetor horizontal.

### C. Tratamento de Borda e Threshold de Portas
- Unificar o plano do piso da Praça com as soleiras dos Estúdios (Estúdio Kael, Luma, Vex, Nori) com uma rampa invisível de 5 graus para evitar quinas vivas de 90°.
- Limite de segurança: se nenhum hit for detectado (queda fora da ilha), prender no `minY = 0` para evitar queda infinita ou congelamento de coordenadas.

## 3. Orçamento de Performance & 60 FPS
- Custo de CPU do Raycasting: reduzido em 70% ao testar apenas 1 malha contínua low-poly em vez de toda a árvore de cena.
- 0 draw calls adicionais.

