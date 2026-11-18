import { useMemo } from 'react';
import * as THREE from 'three';
import { films } from '../content/films';
import { box, merge } from '../scene/geo';
import { useScene } from '../store/useScene';
import { paintBookCover, paintBookSpine } from '../textures/books';
import { makeCanvas } from '../textures/canvas';
import { paintFoldedGi } from '../textures/gi';
import { Interactive } from './Interactive';

/** Textura pequena com pixels aparentes (estética retrô). */
function retro(canvas: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  return t;
}

/**
 * Pilha de 3 livros de capa dura na mesinha da poltrona, um para cada
 * filme favorito. Clicar num livro abre a ficha do filme.
 */
export function FilmBooks() {
  // cada livro tem o seu tamanho; a pilha sobe somando as espessuras
  const geos = useMemo(() => films.map((f) => new THREE.BoxGeometry(...f.size)), []);
  const heights = films.map((_, i) =>
    films.slice(0, i).reduce((sum, f) => sum + f.size[1] + 0.001, 0),
  );
  const mats = useMemo(
    () =>
      films.map((film) => {
        const cover = new THREE.MeshStandardMaterial({
          map: retro(makeCanvas(112, 160, (c, w, h) => paintBookCover(c, w, h, film))),
          roughness: 0.6,
        });
        const spine = new THREE.MeshStandardMaterial({
          map: retro(makeCanvas(160, 24, (c, w, h) => paintBookSpine(c, w, h, film))),
          roughness: 0.6,
        });
        const pages = new THREE.MeshStandardMaterial({ color: '#e9e0cc', roughness: 0.9 });
        const cloth = new THREE.MeshStandardMaterial({ color: film.color, roughness: 0.7 });
        // faces da caixa: +x (lombada), -x (páginas), +y (capa), -y, +z, -z (páginas)
        return [spine, pages, cover, cloth, pages, pages];
      }),
    [],
  );
  const yaws = [0.3, 0.12, 0.42];
  return (
    <group name="film-books">
      {films.map((film, i) => (
        <Interactive
          key={film.id}
          id={`book-${film.id}`}
          label="objects.book"
          text={`${film.title} (${film.year})`}
          onClick={() => useScene.getState().setDossier(film.id)}
        >
          <mesh
            geometry={geos[i]}
            material={mats[i]}
            position={[(i - 1) * 0.008, heights[i] + film.size[1] / 2, (1 - i) * 0.008]}
            rotation={[0, yaws[i], 0]}
          />
        </Interactive>
      ))}
    </group>
  );
}

/** Pano drapeado deitado (plano subdividido com dobras suaves). */
function drape(w: number, d: number, amp: number, seed: number) {
  const g = new THREE.PlaneGeometry(w, d, 14, 16).rotateX(-Math.PI / 2);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    const fold = Math.sin(x * 11 + seed) * Math.cos(z * 7 + seed * 0.5) * amp;
    p.setY(i, fold + amp);
  }
  g.computeVertexNormals();
  return g;
}

/**
 * Kimono de jiu-jitsu largado aberto no sofá, como quem acabou de chegar
 * do treino: o casaco aberto em T, com a gola em V mostrando o forro, as
 * duas mangas esticadas para os lados e a faixa preta solta em curva.
 * Clicar nele abre a ficha do jiu-jitsu.
 */
export function GiOnSofa() {
  const geo = useMemo(() => {
    const lapel = (side: number) =>
      box([0.06, 0.018, 0.54], [side * 0.1, 0.03, 0.02], { rot: [0, side * 0.3, 0] });
    const beltCurve = new THREE.CatmullRomCurve3(
      [
        [-0.3, 0.035, 0.1],
        [-0.1, 0.04, 0.14],
        [0.1, 0.04, 0.1],
        [0.28, 0.035, 0.16],
        [0.4, 0.02, 0.3],
      ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    );
    return {
      body: drape(0.58, 0.68, 0.008, 1.3),
      inside: new THREE.ShapeGeometry(
        new THREE.Shape([
          new THREE.Vector2(-0.03, 0.3),
          new THREE.Vector2(0.03, 0.3),
          new THREE.Vector2(0.17, -0.26),
          new THREE.Vector2(-0.17, -0.26),
        ]),
      )
        .rotateX(-Math.PI / 2)
        .translate(0, 0.022, 0),
      lapels: merge([lapel(1), lapel(-1)]),
      collar: box([0.2, 0.02, 0.06], [0, 0.032, -0.3]),
      // as duas mangas esticadas para os lados, deitadas no assento (silhueta em T)
      sleeves: merge([
        drape(0.46, 0.2, 0.006, 2.1).translate(0.5, 0.004, -0.2),
        drape(0.46, 0.2, 0.006, 3.4).translate(-0.5, 0.004, -0.2),
      ]),
      cuffs: merge([
        box([0.03, 0.02, 0.2], [0.72, 0.016, -0.2]),
        box([0.03, 0.02, 0.2], [-0.72, 0.016, -0.2]),
      ]),
      belt: new THREE.TubeGeometry(beltCurve, 40, 0.022, 6, false).scale(1, 0.3, 1),
    };
  }, []);
  const mats = useMemo(() => {
    const map = new THREE.CanvasTexture(makeCanvas(256, 256, paintFoldedGi));
    map.colorSpace = THREE.SRGBColorSpace;
    return {
      cloth: new THREE.MeshStandardMaterial({
        map,
        roughness: 0.92,
        side: THREE.DoubleSide,
        color: '#fff4e4',
        emissive: '#3a3228',
        emissiveIntensity: 0.25,
      }),
      shade: new THREE.MeshStandardMaterial({ color: '#a39b8e', roughness: 0.95 }),
      belt: new THREE.MeshStandardMaterial({ color: '#111012', roughness: 0.7 }),
    };
  }, []);
  return (
    <Interactive
      id="kimono"
      label="objects.kimono"
      onClick={() => useScene.getState().setDossier('gi')}
    >
      <group name="gi-on-sofa">
        <mesh geometry={geo.body} material={mats.cloth} />
        <mesh geometry={geo.inside} material={mats.shade} />
        <mesh geometry={geo.lapels} material={mats.cloth} />
        <mesh geometry={geo.collar} material={mats.cloth} />
        <mesh geometry={geo.sleeves} material={mats.cloth} />
        <mesh geometry={geo.cuffs} material={mats.cloth} />
        <mesh geometry={geo.belt} material={mats.belt} />
      </group>
    </Interactive>
  );
}
