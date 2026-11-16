/** Cada peça do motor é um grupo de tecnologias (chaves em skills.*). */
export interface SkillGroup {
  id: 'languages' | 'backend' | 'frontend' | 'databases' | 'tools';
  /** Nome da peça no modelo do motor e chave do rótulo (skills.part*). */
  part: 'block' | 'intake' | 'radiator' | 'battery' | 'fuses';
  partKey: string;
  items: string[];
}

export const skillGroups: SkillGroup[] = [
  {
    id: 'languages',
    part: 'block',
    partKey: 'skills.partBlock',
    items: ['C#', 'Python', 'TypeScript', 'SQL', 'C'],
  },
  {
    id: 'backend',
    part: 'intake',
    partKey: 'skills.partIntake',
    items: ['ASP.NET Core', 'Entity Framework Core', 'FastAPI', 'APIs REST', 'SignalR', 'JWT'],
  },
  {
    id: 'frontend',
    part: 'radiator',
    partKey: 'skills.partRadiator',
    items: ['React Native (Expo)', 'Next.js', 'React', 'Tailwind CSS'],
  },
  {
    id: 'databases',
    part: 'battery',
    partKey: 'skills.partBattery',
    items: ['PostgreSQL', 'MySQL', 'SQLite'],
  },
  {
    id: 'tools',
    part: 'fuses',
    partKey: 'skills.partFuses',
    items: ['Git', 'GitHub', 'xUnit', 'Visual Studio', 'VS Code'],
  },
];
