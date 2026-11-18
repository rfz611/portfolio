import { useMemo } from 'react';
import * as THREE from 'three';
import { films } from '../content/films';
import { useScene } from '../store/useScene';
import { paintBookCover, paintBookSpine } from '../textures/books';
import { makeCanvas } from '../textures/canvas';
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
 * 3 livros de capa dura na mesinha da poltrona, empilhados em escadinha
 * para aparecer o título de cada um.
 * Clicar num livro abre a ficha do filme.
 */
export function FilmBooks() {
  // cada livro tem o seu tamanho
  const geos = useMemo(() => films.map((f) => new THREE.BoxGeometry(...f.size)), []);
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
  // lado a lado, cada um num ângulo, todas as capas à vista
  // empilhados em escadinha: cada livro desliza um pouco, mostrando o título do de baixo
  const yaws = [0.06, -0.05, 0.08];
  const heights = [0, films[0].size[1], films[0].size[1] + films[1].size[1]];
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
            position={[(i - 1) * 0.012, heights[i] + film.size[1] / 2 + i * 0.001, (1 - i) * 0.065]}
            rotation={[0, yaws[i], 0]}
          />
        </Interactive>
      ))}
    </group>
  );
}
