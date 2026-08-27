export interface LldEditorial {
  companies: string[];
  overview: string;
  problemStatement: string;
  requirements: {
    functional: string[];
    nonFunctional: string[];
  };
  designPatterns: { name: string; rationale: string }[];
  classDiagram: string;
  codeImplementation: { language: string; code: string }[];
  tradeoffs: string[];
}

export interface LldQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface LldTopic {
  id: string;
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  frequencyRank: number;
  editorial: LldEditorial;
  quiz: LldQuizQuestion[];
}
