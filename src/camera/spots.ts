import type { Shot } from './shots';

type V3 = [number, number, number];

/**
 * Pontos de vista da sala: lugares onde a pessoa "fica" no plano inicial.
 * Em cada um dá para arrastar e olhar em volta; para trocar de lugar,
 * clica-se no marcador do chão ou nas setas do seletor.
 */
export interface Spot extends Shot {
  id:
    | 'sofa'
    | 'entrada'
    | 'escritorio'
    | 'cadeira'
    | 'poltrona'
    | 'bar'
    | 'janela'
    | 'geral'
    | 'garagem';
  /** Chave de tradução do nome do lugar. */
  label: string;
  /** Onde fica o marcador no chão (null = sem marcador). */
  marker: V3 | null;
}

export const SPOTS: Spot[] = [
  {
    id: 'sofa',
    label: 'spots.sofa',
    position: [2.5, 0.82, 0.62],
    // levemente para baixo: a mesa de centro inteira acima do seletor de lugar
    target: [-5.6, 0.2, 0.85],
    hfov: 80,
    portrait: { position: [2.55, 0.95, 0.62], target: [-5.6, 0.05, 0.85], hfov: 66 },
    marker: [2.02, -0.44, 0.62],
  },
  {
    id: 'entrada',
    label: 'spots.entrada',
    position: [5.25, 1.62, 2.35],
    target: [-4.2, 0.75, -1.3],
    hfov: 76,
    portrait: { hfov: 64, target: [-4.2, 0.3, -1.3] },
    marker: [5.25, 0.012, 2.35],
  },
  {
    id: 'escritorio',
    label: 'spots.escritorio',
    position: [-2.45, 1.6, -0.95],
    target: [-3.4, 0.85, -3.4],
    hfov: 76,
    portrait: { hfov: 64, target: [-3.4, 0.5, -3.4] },
    marker: [-2.45, 0.012, -0.95],
  },
  {
    id: 'cadeira',
    label: 'spots.cadeira',
    position: [-3.23, 1.2, -3.78],
    target: [-3.25, 0.86, -2.55],
    hfov: 80,
    portrait: { hfov: 66, target: [-3.25, 0.6, -2.6] },
    marker: null,
  },
  {
    // sentado na poltrona lounge, olhando a sala, com a mesinha dos livros ao lado
    id: 'poltrona',
    label: 'spots.poltrona',
    // recostado na poltrona, um pouco acima e atrás: a sala na frente e a
    // mesinha com os livros no canto; arrastando dá para olhar tudo em volta
    position: [-3.16, 1.18, 3.13],
    target: [-1.36, 0.24, 2.91],
    hfov: 84,
    portrait: { hfov: 70, target: [-1.6, 0.2, 3.05] },
    marker: null,
  },
  {
    id: 'bar',
    label: 'spots.bar',
    position: [4.6, 1.6, -0.45],
    target: [2.9, 1.0, -3.4],
    hfov: 76,
    portrait: { hfov: 64, target: [2.9, 0.7, -3.4] },
    marker: [4.6, 0.012, -0.45],
  },
  {
    id: 'janela',
    label: 'spots.janela',
    position: [-0.4, 1.62, -2.35],
    target: [-0.4, 0.9, -9],
    hfov: 82,
    portrait: { hfov: 66 },
    marker: [-0.4, 0.012, -2.35],
  },
  {
    id: 'geral',
    label: 'spots.geral',
    position: [0.3, 1.75, 4.05],
    target: [0.0, 0.45, -2.6],
    hfov: 80,
    portrait: { hfov: 66, target: [0.0, 0.0, -1.8] },
    marker: [0.3, 0.012, 4.05],
  },
  {
    // dentro da garagem, logo depois da passagem do vidro, olhando o carro
    id: 'garagem',
    label: 'spots.garagem',
    position: [7.0, 1.55, 3.7],
    target: [10.4, 0.45, 0.2],
    hfov: 72,
    portrait: { hfov: 62 },
    marker: [7.0, 0.012, 3.7],
  },
];
