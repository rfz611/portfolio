import type * as THREE from 'three';
import { paintLandscape, paintSunset } from './art';
import { makeCanvas, tex } from './canvas';
import { paintNativity, paintStormGalilee } from './masters';
import { paintTigerStorm } from './tiger';

let cache: Record<
  'landscape' | 'landscapeSmall' | 'sunset' | 'tiger' | 'storm' | 'nativity',
  THREE.Texture
> | null = null;

/** Pinturas das paredes, geradas uma vez só. */
export function art() {
  if (!cache) {
    cache = {
      landscape: tex(
        makeCanvas(512, 320, (c, w, h) => paintLandscape(c, w, h, 3)),
        { clamp: true },
      ),
      landscapeSmall: tex(
        makeCanvas(384, 256, (c, w, h) => paintLandscape(c, w, h, 9)),
        {
          clamp: true,
        },
      ),
      sunset: tex(makeCanvas(384, 288, paintSunset), { clamp: true }),
      tiger: tex(makeCanvas(640, 480, paintTigerStorm), { clamp: true, aniso: 8 }),
      storm: tex(makeCanvas(512, 640, paintStormGalilee), { clamp: true, aniso: 8 }),
      nativity: tex(makeCanvas(464, 640, paintNativity), { clamp: true, aniso: 8 }),
    };
  }
  return cache;
}
