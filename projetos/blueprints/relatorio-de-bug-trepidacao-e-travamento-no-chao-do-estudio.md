# Relatório de Bug: Trepidação e Travamento no Chão do Estúdio

- **Autor(a) na Blequi:** Vex (Technical Artist & Guardião de 60 FPS)
- **Data:** 26/11/2026, 21:28:09
- **Resumo:** Bug Report completo com análise de raycast jitter, conflito de geometria e solução em TypeScript/Three.js para a IA aplicar a correção definitiva no chão do estúdio.

---

# 📋 RELATÓRIO DE BUG TÉCNICO & DIRETRIZ DE CORREÇÃO (AI FIX)

**Para:** IA Desenvolvedora (Antigravity / Cursor / Claude)  
**Origem:** Vex (Technical Artist & Guardião de 60 FPS)  
**Reportado por:** Co-CEO Raynocas  
**Severidade:** Média-Alta (Impacto direto na experiência do usuário e movimentação no interior 3D)  
**Ambiente:** Interior dos Estúdios (Three.js / React Three Fiber)

---

## 1. 🔍 Descrição do Sintoma
Ao caminhar com o avatar pelo piso interno do estúdio ("Lab Vex" e correlatos), ocorrem micro-travadas, engasgos de movimentação ou trepidação vertical contínua na câmera/avatar. O avatar parece "agarrar" ou "tropeçar" no piso.

---

## 2. 🧠 Causa Raiz Técnica Identificada
1. **Raycast Vertical / Altura do Avatar Instável:**
   - O controlador do avatar faz raycasting para baixo a cada `useFrame` buscando a coordenada Y do chão.
   - O raycast está interceptando múltiplos objetos secundários (ex: bordas de rodapé, meshes de decoração com colisão ativa, ou subdivisões do piso com normais invertidas/desalinhadas).
   - Ocorre alternância brusca de `hit.point.y` (micro-degraus de milímetros), causando "snapping" errático.
2. **Conflito de Geometria (Z-Fighting & Multi-Mesh):**
   - O chão interior possui mais de um mesh sobreposto na mesma camada Y (`y: 0.00` ou similar), gerando múltiplos hits com profundidades flutuantes.
3. **Ausência de Suavização (Damping/Lerp) na Altura Y:**
   - A posição Y do avatar é aplicada de forma instantânea (`position.y = hit.point.y`), em vez de passar por interpolação suave (`lerp`).

---

## 3. 🛠️ Passos para a IA Corrigir no Código

### A. Isolar a Camada de Colisão do Chão (Layer ou Tag)
- Adicione uma propriedade explícita de colisão ou use layers do Three.js:
```typescript
// No componente do chão interno do estúdio:
<mesh
  name="studio-floor-collider"
  rotation={[-Math.PI / 2, 0, 0]}
  position={[0, 0, 0]}
  userData={{ isWalkableFloor: true }}
>
  <planeGeometry args={[10, 10]} />
  {/* Se for apenas collider invisível: */}
  {/* <meshBasicMaterial visible={false} /> */}
</mesh>
```

### B. Filtrar o Raycaster do Controlador
- No loop de verificação de chão (`useFrame`), garanta que o raycast filtre **apenas** o chão caminhável, ignorando decorações, móveis e props:
```typescript
const hits = raycaster.intersectObjects(scene.children, true);
const floorHit = hits.find(hit => hit.object.userData?.isWalkableFloor);

if (floorHit) {
  const targetY = floorHit.point.y + AVATAR_HEIGHT;
  // Use lerp para amortecer qualquer micro-imperfeição:
  avatarRef.current.position.y = THREE.MathUtils.lerp(
    avatarRef.current.position.y,
    targetY,
    delta * 12 // Damping suave
  );
}
```

### C. Desativar Colisão de Raycast nos Props Decorativos
- Em todos os props internos (tapetes, pedestais, luminárias, mesas), desativar raycast de altura adicionando:
```typescript
mesh.raycast = () => {}; // ou ignore nos raycasts de chão
```

---

## 4. ✅ Critérios de Aceite para Teste
- [ ] Avatar caminha em linha reta e em círculos dentro do estúdio sem trepidação na câmera.
- [ ] Altura Y do avatar se mantém estável a 60 FPS contínuos.
- [ ] Nenhum frame drop ou pico de garbage collection durante a movimentação interna.

