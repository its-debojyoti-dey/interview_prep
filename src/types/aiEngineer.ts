export interface AiEngineerQuestion {
  id: string;
  title: string;
  category: 'Autonomous AI Agents & Tool Calling' | 'LLM Evaluation & Guardrails' | 'LLM Fine-Tuning & RAG Architecture' | 'Vector Databases & Embeddings' | 'Real Interview Questions (OmnisAI, Bendito, GraphRAG, System Design)';
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  summary: string;
  answer: {
    simpleExplanation: string;
    keyConcepts: string[];
    jsExampleCode?: string;
    realWorldScenario?: string;
    interviewerExpectation?: string;
  };
  source?: string;
}

export interface AiEngineerTopicGroup {
  id: string;
  title: string;
  questionCount: number;
  description: string;
  questions: AiEngineerQuestion[];
}
