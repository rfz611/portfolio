/** Tempo máximo de trabalho por tarefa, abaixo dos 50 ms de uma tarefa longa. */
export const SLICE_MS = 24;

/** Devolve a vez ao navegador (outra tarefa, depois do que estiver na fila). */
export const yieldToBrowser = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * Roda um gerador em fatias de até SLICE_MS, cedendo a vez ao navegador
 * entre elas. Cada `yield` do gerador é um ponto onde dá para parar.
 */
export async function runSliced<T>(work: Generator<unknown, T>): Promise<T> {
  for (;;) {
    const start = performance.now();
    let step = work.next();
    while (!step.done && performance.now() - start < SLICE_MS) step = work.next();
    if (step.done) return step.value;
    await yieldToBrowser();
  }
}
