/**
 * Cortina preta usada nas trocas de plano (corte de cinema).
 * Fica num elemento fixo da página, fora da cena 3D.
 */
export function cut(opacity: number, seconds: number) {
  const el = document.getElementById('cut');
  if (!el) return;
  el.style.transition = `opacity ${seconds}s ease`;
  el.style.opacity = String(opacity);
}
