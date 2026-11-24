/** Estações do rádio do carro (seção Contato). */
export interface ContactLink {
  id: 'email' | 'linkedin' | 'github' | 'cv';
  frequency: string;
  value: string;
  href: string;
}

export const EMAIL = 'raphaspassos@gmail.com';

export const contactLinks: ContactLink[] = [
  { id: 'email', frequency: '88.1', value: EMAIL, href: `mailto:${EMAIL}` },
  {
    id: 'linkedin',
    frequency: '91.5',
    value: 'linkedin.com/in/raphaelscharf',
    href: 'https://www.linkedin.com/in/raphaelscharf',
  },
  {
    id: 'github',
    frequency: '97.3',
    value: 'github.com/rfz611',
    href: 'https://github.com/rfz611',
  },
  { id: 'cv', frequency: '101.9', value: 'PDF', href: '/cv/curriculo-raphael-scharf-passos.pdf' },
];

export const cvFiles = {
  pt: '/cv/curriculo-raphael-scharf-passos.pdf',
  en: '/cv/resume-raphael-scharf-passos.pdf',
} as const;
