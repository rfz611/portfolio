import * as THREE from 'three';

type P2 = readonly [number, number];

/**
 * Puxa um perfil (d, h) ao longo de um caminho no chão (x, z).
 * d é a distância para o lado esquerdo do caminho (para dentro do
 * rebaixo, no sofá embutido) e h é a altura. UV: u acompanha o caminho
 * (em metros / uScale) e v acompanha o perfil (0 a vRepeat).
 */
export function sweep(
  path: readonly P2[],
  profile: readonly P2[],
  o: { uScale?: number; vRepeat?: number } = {},
): THREE.BufferGeometry {
  const n = path.length;
  const normals: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const prev = path[Math.max(0, i - 1)];
    const next = path[Math.min(n - 1, i + 1)];
    const tx = next[0] - prev[0];
    const tz = next[1] - prev[1];
    const len = Math.hypot(tx, tz) || 1;
    normals.push([-tz / len, tx / len]);
  }
  const along = [0];
  for (let i = 1; i < n; i++) {
    along.push(along[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  }
  const across = [0];
  for (let j = 1; j < profile.length; j++) {
    across.push(
      across[j - 1] +
        Math.hypot(profile[j][0] - profile[j - 1][0], profile[j][1] - profile[j - 1][1]),
    );
  }
  const total = across[across.length - 1] || 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const index: number[] = [];
  for (let i = 0; i < n; i++) {
    for (const [j, [d, h]] of profile.entries()) {
      positions.push(path[i][0] + normals[i][0] * d, h, path[i][1] + normals[i][1] * d);
      uvs.push(along[i] / (o.uScale ?? 1), (across[j] / total) * (o.vRepeat ?? 1));
    }
  }
  const m = profile.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < m - 1; j++) {
      const a = i * m + j;
      const b = (i + 1) * m + j;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/** Pontos de um arco no chão (x, z), sem repetir o primeiro. */
export function arcPoints(
  cx: number,
  cz: number,
  r: number,
  from: number,
  to: number,
  steps = 8,
): [number, number][] {
  const out: [number, number][] = [];
  for (let k = 1; k <= steps; k++) {
    const a = from + ((to - from) * k) / steps;
    out.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
  }
  return out;
}
