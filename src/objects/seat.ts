import { SPOTS } from '../camera/spots';
import { useScene } from '../store/useScene';

/** Índice do ponto de vista "sentado na cadeira do escritório". */
export const SEAT_SPOT = SPOTS.findIndex((s) => s.id === 'cadeira');

/** Estou sentado na cadeira do escritório? */
export const useSeated = () => useScene((s) => s.view === 'home' && s.spot === SEAT_SPOT);
