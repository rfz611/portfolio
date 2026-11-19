import files from 'virtual:models-manifest';

/** No site publicado, o modelo vem de fora (o mesmo bucket das músicas). */
const REMOTE = import.meta.env.VITE_CAR_MODEL_URL;

/**
 * Tem modelo do carro? Em public/models (desenvolvimento) ou no endereço
 * de VITE_CAR_MODEL_URL (produção). O arquivo fica fora do Git: veja o README.
 */
export const HAS_CAR_MODEL = Boolean(REMOTE) || files.includes('car.glb');
export const CAR_MODEL_URL = REMOTE || '/models/car.glb';

/**
 * A cabine do modelo do Evo VIII começa uns 47 cm mais à frente que a do
 * carro feito no código: o interior e a câmera do motorista andam junto.
 */
export const CABIN_SHIFT = HAS_CAR_MODEL ? -0.47 : 0;

/**
 * O cofre do modelo é mais curto (do para-choque até a base do para-brisa,
 * em x ≈ -1,1): o motor do código é comprimido no comprimento para caber.
 */
export const ENGINE_FIT = HAS_CAR_MODEL
  ? { origin: -2.0, floor: 0.3, scale: [0.72, 0.9, 0.95] as const, shift: -0.05 }
  : null;
