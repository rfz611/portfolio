/** Canais da TV. Os textos ficam em pt.json/en.json (chave projects.<id>). */
export interface Project {
  id: 'unicar' | 'frotas';
  channel: string;
  tech: string[];
  /** null = repositório de demonstração ainda sem link. */
  link: string | null;
  image: string;
  /** Vídeo curto que passa sozinho na TV no lugar do print (sem som, em loop). */
  video?: string;
}

export const projects: Project[] = [
  {
    id: 'unicar',
    channel: '01',
    tech: [
      'C#',
      'ASP.NET Core 8',
      'Entity Framework Core',
      'PostgreSQL',
      'SignalR',
      'React Native',
      'TypeScript',
      'xUnit',
    ],
    link: 'https://github.com/rfz611/unicar-app',
    image: '/textures/projects/unicar.webp',
    video: '/videos/unicar.webm',
  },
  {
    id: 'frotas',
    channel: '02',
    tech: ['Python', 'FastAPI', 'pdfplumber', 'openpyxl', 'Next.js', 'TypeScript'],
    link: null,
    image: '/textures/projects/frotas.webp',
  },
];
