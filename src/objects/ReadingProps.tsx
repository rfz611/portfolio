import { useMemo } from 'react';
import * as THREE from 'three';
import { films } from '../content/films';
import { box, cyl, merge } from '../scene/geo';
import { useScene } from '../store/useScene';
import { paintBookCover, paintBookSpine } from '../textures/books';
import { makeCanvas } from '../textures/canvas';
import { paintFoldedGi } from '../textures/gi';
import { lib } from '../textures/library';
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

const BOOK = { w: 0.14, h: 0.028, d: 0.2 };

/**
 * Pilha de 3 livros de capa dura na mesinha da poltrona, um para cada
 * filme favorito. Clicar num livro abre a ficha do filme.
 */
export function FilmBooks() {
  const geo = useMemo(() => new THREE.BoxGeometry(BOOK.w, BOOK.h, BOOK.d), []);
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
  const yaws = [0.32, 0.18, 0.4];
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
            geometry={geo}
            material={mats[i]}
            position={[(i - 1) * 0.006, BOOK.h / 2 + i * (BOOK.h + 0.001), (1 - i) * 0.006]}
            rotation={[0, yaws[i], 0]}
          />
        </Interactive>
      ))}
    </group>
  );
}

/**
 * Cabide de pé de madeira com o kimono de jiu-jitsu pendurado aberto: as
 * costas atrás, as duas frentes afastadas mostrando a gola grossa, as
 * mangas caindo e a faixa preta jogada por cima do cabide.
 * Clicar no kimono abre a ficha do jiu-jitsu.
 */
export function HangingGi() {
  const { mat } = lib();
  const geo = useMemo(() => {
    const top = 1.62;
    const shoulders = top - 0.06;
    const sleeve = (side: number) =>
      new THREE.CylinderGeometry(0.075, 0.06, 0.52, 12, 1, true)
        .rotateZ(side * 0.1)
        .translate(side * 0.27, shoulders - 0.27, 0.0);
    const panel = (side: number) =>
      box([0.2, 0.74, 0.012], [side * 0.13, shoulders - 0.37, 0.035], {
        rot: [0, side * -0.35, 0],
      });
    const lapel = (side: number) =>
      box([0.05, 0.5, 0.016], [side * 0.075, shoulders - 0.22, 0.05], {
        rot: [0, side * -0.35, side * -0.32],
      });
    return {
      stand: merge([
        cyl(0.17, 0.19, 0.025, [0, 0.0125, 0], { seg: 18 }),
        cyl(0.014, 0.014, top, [0, top / 2, -0.045], { seg: 10 }),
        box([0.5, 0.025, 0.03], [0, top, -0.03]),
      ]),
      back: box([0.5, 0.76, 0.012], [0, shoulders - 0.38, -0.02]),
      fronts: merge([panel(1), panel(-1)]),
      lapels: merge([lapel(1), lapel(-1)]),
      sleeves: merge([sleeve(1), sleeve(-1)]),
      inside: new THREE.PlaneGeometry(0.16, 0.62).translate(0, shoulders - 0.34, -0.012),
      belt: merge([
        box([0.045, 0.006, 0.05], [0.1, top + 0.016, 0]),
        box([0.045, 0.5, 0.006], [0.1, top - 0.24, 0.03]),
        box([0.045, 0.42, 0.006], [0.1, top - 0.2, -0.03]),
      ]),
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
        emissive: '#3a3228',
        emissiveIntensity: 0.22,
      }),
      shade: new THREE.MeshStandardMaterial({ color: '#b5ad9f', roughness: 0.95 }),
      belt: new THREE.MeshStandardMaterial({ color: '#111012', roughness: 0.75 }),
    };
  }, []);
  return (
    <group name="hanging-gi">
      <mesh geometry={geo.stand} material={mat.walnut} />
      <Interactive
        id="kimono"
        label="objects.kimono"
        onClick={() => useScene.getState().setDossier('gi')}
      >
        <mesh geometry={geo.back} material={mats.cloth} />
        <mesh geometry={geo.inside} material={mats.shade} />
        <mesh geometry={geo.fronts} material={mats.cloth} />
        <mesh geometry={geo.lapels} material={mats.cloth} />
        <mesh geometry={geo.sleeves} material={mats.cloth} />
        <mesh geometry={geo.belt} material={mats.belt} />
      </Interactive>
    </group>
  );
}
