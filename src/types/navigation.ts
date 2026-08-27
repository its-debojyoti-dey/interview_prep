export type NavSection = 
  | 'system-design'
  | 'dsa'
  | 'lld'
  | 'behavioral'
  | 'fullstack'
  | 'devops'
  | 'ai-engineer'
  | 'resume'
  | 'companies'
  | 'roadmaps';

export interface CategoryCardItem {
  id: string;
  title: string;
  subtitle?: string;
  questionCount: number;
  tags?: string[];
  iconName?: string;
}

export interface GenericQuestion {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  company?: string;
  notes?: string;
  solution?: string;
  completed?: boolean;
}
