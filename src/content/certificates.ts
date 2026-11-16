/**
 * Certificados (revistas da mesa). O nome do curso vem de certificates.<id>;
 * o nome da revista é inventado e não se traduz.
 */
export interface Certificate {
  id: 'python' | 'c' | 'office' | 'salesforce';
  magazine: string;
  provider: string;
  /** null = ainda em estudo. */
  year: number | null;
  color: string;
}

export const certificates: Certificate[] = [
  { id: 'python', magazine: 'INDENTA', provider: 'Udemy', year: 2026, color: '#1d3a5f' },
  { id: 'c', magazine: 'PONTEIRO', provider: 'Udemy', year: 2025, color: '#5c0f16' },
  {
    id: 'office',
    magazine: 'PLANILHA',
    provider: 'Fundação Bradesco',
    year: 2026,
    color: '#22452f',
  },
  { id: 'salesforce', magazine: 'CIRRUS', provider: 'Trailhead', year: null, color: '#3a1450' },
];
