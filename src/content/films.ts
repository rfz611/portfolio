/**
 * Filmes favoritos do Raphael (livros na mesinha da poltrona). Só dados
 * públicos de cada filme; as notas pessoais ficam em pt/en.json e aparecem
 * "em breve" até o Raphael escrever. Cada livro tem tamanho e capa próprios.
 */
export interface Film {
  id: 'magnolia' | 'donnie' | 'arrival';
  title: string;
  year: number;
  director: string;
  /** Cor do tecido da capa e da lombada. */
  color: string;
  /** Cor das letras. */
  ink: string;
  /** Tamanho do livro (largura, espessura, altura), em metros. */
  size: [number, number, number];
}

export const films: Film[] = [
  {
    id: 'magnolia',
    title: 'MAGNOLIA',
    year: 1999,
    director: 'Paul Thomas Anderson',
    color: '#ece2cc',
    ink: '#8a1a18',
    size: [0.16, 0.038, 0.23],
  },
  {
    id: 'donnie',
    title: 'DONNIE DARKO',
    year: 2001,
    director: 'Richard Kelly',
    color: '#0e1424',
    ink: '#c9d2e0',
    size: [0.13, 0.026, 0.2],
  },
  {
    id: 'arrival',
    title: 'ARRIVAL',
    year: 2016,
    director: 'Denis Villeneuve',
    color: '#9a9c98',
    ink: '#141414',
    size: [0.14, 0.02, 0.215],
  },
];
