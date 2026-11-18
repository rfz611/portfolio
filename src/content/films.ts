/**
 * Filmes favoritos do Raphael (livros na mesinha da poltrona). Só dados
 * públicos de cada filme; as notas pessoais ficam em pt/en.json
 * (films.<id>.notes) e aparecem "em breve" até o Raphael escrever.
 */
export interface Film {
  id: 'magnolia' | 'donnie' | 'arrival';
  title: string;
  year: number;
  director: string;
  /** Cor da capa do livro. */
  color: string;
}

export const films: Film[] = [
  {
    id: 'magnolia',
    title: 'MAGNOLIA',
    year: 1999,
    director: 'Paul Thomas Anderson',
    color: '#5a1a14',
  },
  { id: 'donnie', title: 'DONNIE DARKO', year: 2001, director: 'Richard Kelly', color: '#14182a' },
  { id: 'arrival', title: 'ARRIVAL', year: 2016, director: 'Denis Villeneuve', color: '#2c2c2a' },
];
