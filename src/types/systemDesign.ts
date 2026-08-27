export interface RequirementSection {
  functional: string[];
  nonFunctional: string[];
  outOfScope?: string[];
}

export interface TableField {
  name: string;
  type: string;
  desc: string;
}

export interface DBEntity {
  name: string;
  description: string;
  fields: TableField[];
}

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  params: string;
  statusCode: string;
  description: string;
}

export interface CapacityEstimation {
  assumptions: string[];
  calculations: { label: string; value: string; desc: string }[];
}

export interface SystemFlow {
  title: string;
  description: string;
  steps: string[];
}

export interface DiscussionPoint {
  topic: string;
  details: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface WhiteboardNode {
  id: string;
  label: string;
  type: 'client' | 'lb' | 'service' | 'cache' | 'db' | 'queue' | 'zookeeper' | 'storage' | 'cdn';
  description: string;
  x: number;
  y: number;
}

export interface WhiteboardConnection {
  from: string;
  to: string;
  label: string;
}

export interface EditorialSolution {
  companies: string[];
  overview: string;
  introduction: string;
  requirements: RequirementSection;
  keyQuestions: CapacityEstimation;
  dataModel: {
    overview: string;
    entities: DBEntity[];
  };
  apiDesign: {
    overview: string;
    endpoints: APIEndpoint[];
  };
  basicImplementation: {
    title: string;
    description: string;
    drawbacks: string[];
  };
  advancedImplementation: {
    title: string;
    description: string;
    components: { name: string; role: string; details: string }[];
  };
  flows: SystemFlow[];
  additionalPoints: DiscussionPoint[];
}

export interface SystemDesignTopic {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  frequencyRank: number; // 1 to 29
  editorial: EditorialSolution;
  quiz: QuizQuestion[];
  whiteboard: {
    nodes: WhiteboardNode[];
    connections: WhiteboardConnection[];
  };
}
