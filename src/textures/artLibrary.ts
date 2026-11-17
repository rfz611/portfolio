import type * as THREE from 'three';
import { paintLandscape, paintSunset } from './art';
import { makeCanvas, tex } from './canvas';

let cache: Record<'landscape' | 'landscapeSmall' | 'sunset', THREE.Texture> | null = null;

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
    };
  }
  return cache;
}
