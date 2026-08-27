import { AiEngineerQuestion, AiEngineerTopicGroup } from '../types/aiEngineer';

export const allAiEngineerQuestions: AiEngineerQuestion[] = [
  // --- MUST KNOW & EXPLAINED CONCEPTS ---
  {
    id: 'ai-engineering-core-stack',
    title: 'AI Engineering Core Stack: LLM, RAG, MCP, Agent, Fine-Tuning & Quantization',
    category: 'Autonomous AI Agents & Tool Calling',
    difficulty: 'Basic',
    summary: 'The fundamental building blocks of modern production AI applications.',
    answer: {
      simpleExplanation: `AI Engineering is the practice of building software applications powered by Foundation Models.

1. LLM (Large Language Model): Deep neural network trained on vast text to predict next tokens.
2. RAG (Retrieval-Augmented Generation): Dynamically fetching relevant external document context into the LLM prompt.
3. MCP (Model Context Protocol): Open standard protocol connecting AI clients with tools, databases, and prompt templates.
4. Agent: An LLM running inside a loop that autonomously decides which tools to call to achieve a goal.
5. Fine-Tuning: Adapting pre-trained model weights to specific domain tasks or output formats.
6. Quantization: Compressing float weights (FP16 -> INT8 / INT4) to save VRAM and speed up inference.`,
      keyConcepts: [
        'LLM: Core reasoning engine.',
        'RAG: Grounding responses with enterprise private data.',
        'MCP: Standardized client-tool protocol.',
        'Agent: ReAct loop autonomous tool execution.',
        'Fine-Tuning & Quantization: Model optimization & cost reduction.'
      ],
      jsExampleCode: `import { OpenAI } from "openai";

const openai = new OpenAI();

// Basic LLM API Call with System Prompt & Temperature
async function generateAIResponse(prompt: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are an expert AI Engineer." },
      { role: "user", content: prompt }
    ],
    temperature: 0.2
  });

  return completion.choices[0].message.content;
}`,
      realWorldScenario: 'Building modern enterprise AI systems that combine LLMs for reasoning, RAG for private documentation, and MCP for database actions.'
    }
  },

  // --- LLM FUNDAMENTALS ---
  {
    id: 'llm-inside-chatgpt',
    title: 'Inside ChatGPT: What Happens After You Hit Enter?',
    category: 'LLM Fine-Tuning & RAG Architecture',
    difficulty: 'Basic',
    summary: 'Trace the journey of a user message from prompt submission to streaming response tokens.',
    answer: {
      simpleExplanation: `When you hit Enter in ChatGPT:
1. Input Sanitization & Safety Check: User text passes through input guardrails to catch prompt injection.
2. Tokenization: Text is converted into token integer IDs using Byte Pair Encoding (BPE).
3. Context Assembly: Recent chat turns, system prompts, and custom instructions are packed into the context window.
4. Prefill Phase (KV Cache): The Transformer processes the full prompt, computing Key and Value tensors for all input tokens.
5. Autoregressive Decode Phase: The decoder predicts logits for the next token, applies temperature & top-p sampling, and streams tokens over WebSockets / Server-Sent Events (SSE).`,
      keyConcepts: [
        'BPE Tokenization: Text -> Token IDs.',
        'Prefill Phase: High GPU batch parallel compute of prompt tokens.',
        'Decode Phase: Sequential token generation using KV Cache.',
        'Streaming SSE: Real-time UI token updates.'
      ],
      jsExampleCode: `import { OpenAI } from "openai";

const openai = new OpenAI();

async function demonstrateTokenStreaming() {
  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: "Explain token streaming in 20 words." }],
    stream: true
  });

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || "";
    process.stdout.write(token); // Real-time token streaming
  }
}`,
      realWorldScenario: 'Understanding Time-to-First-Token (TTFT) and inter-token latency in high-concurrency web applications.'
    }
  },
  {
    id: 'llm-transformer-qkv',
    title: 'Transformer Architecture: Self-Attention & Query (Q), Key (K), Value (V)',
    category: 'LLM Fine-Tuning & RAG Architecture',
    difficulty: 'Intermediate',
    summary: 'The mathematical mechanics of scaled dot-product self-attention in Transformers.',
    answer: {
      simpleExplanation: `In Transformer self-attention, every token representation is projected into three vectors:
- Query (Q): What am I looking for?
- Key (K): What information do I contain?
- Value (V): What message do I pass along if selected?

The attention weight between two tokens is computed as:
Attention(Q, K, V) = softmax( (Q * K^T) / sqrt(d_k) ) * V

- Scaling by 1/sqrt(d_k): Prevents dot products from growing excessively large in high dimensions, which would push softmax gradients into vanishingly small regions.
- Causal Masking: Masks future token positions with negative infinity so decoder models cannot cheat by looking ahead.`,
      keyConcepts: [
        'Q, K, V Projections: Linear projections of token embeddings.',
        'Scaled Dot-Product: Softmax((QK^T) / sqrt(d_k)).',
        'Multi-Head Attention (MHA): Running attention across parallel subspace heads.',
        'Grouped-Query Attention (GQA): Sharing Key/Value heads across Query heads to save VRAM.'
      ],
      jsExampleCode: `// Conceptual Self-Attention calculation in JavaScript
function scaledDotProductAttention(Q: number[][], K: number[][], V: number[][], d_k: number): number[][] {
  // 1. Compute Q * K^T
  // 2. Scale by 1 / Math.sqrt(d_k)
  // 3. Apply Softmax to rows
  // 4. Multiply softmax matrix by V
  return V; // Returns weighted context representation
}`,
      realWorldScenario: 'Explaining why Grouped-Query Attention (GQA) is used in Llama-3 and Mixtral to reduce KV cache memory requirements.'
    }
  },
  {
    id: 'llm-bpe-wordpiece',
    title: 'Tokenization: BPE (Byte Pair Encoding), WordPiece, and SentencePiece',
    category: 'LLM Fine-Tuning & RAG Architecture',
    difficulty: 'Intermediate',
    summary: 'How subword tokenizers break down text into token IDs efficiently.',
    answer: {
      simpleExplanation: `Tokenization converts raw text strings into numerical IDs that neural networks can process.

- Byte Pair Encoding (BPE): Starts with individual characters/bytes and iteratively merges the most frequent adjacent character pairs. Used by GPT-4 and Llama.
- WordPiece: Similar to BPE, but chooses pair merges that maximize likelihood under a language model. Used by BERT.
- SentencePiece: Treats raw text as a sequence of bytes (including whitespace as a symbol '_'), allowing language-agnostic tokenization without requiring pre-tokenizing word splitters.`,
      keyConcepts: [
        'Subword Tokenization: Handles out-of-vocabulary words cleanly.',
        'Tokenization Overhead: Non-English text or code can use 2-3x more tokens.',
        'Custom Vocabulary: Adding domain-specific tokens to prevent fragmenting.'
      ],
      jsExampleCode: `import { get_encoding } from "tiktoken";

const enc = get_encoding("cl100k_base"); // GPT-4 Tokenizer
const text = "AI Engineering is amazing!";
const tokens = enc.encode(text);

console.log("Token IDs:", tokens);
console.log("Token Count:", tokens.length);
console.log("Decoded Back:", enc.decode(tokens));
enc.free();`,
      realWorldScenario: 'Fixing issues where domain-specific acronyms or JSON strings consume excessive token counts.'
    }
  },
  {
    id: 'llm-sampling-temp-top-p',
    title: 'Temperature, Top-p (Nucleus), and Top-k Sampling',
    category: 'LLM Fine-Tuning & RAG Architecture',
    difficulty: 'Basic',
    summary: 'Controlling randomness and creativity in LLM text generation.',
    answer: {
      simpleExplanation: `LLMs output a probability distribution (logits) over their entire vocabulary for the next token.

- Temperature: Divides logits before softmax.
  - Temp = 0: Greedy deterministic sampling (picks highest probability token). Best for code/JSON.
  - Temp = 0.8: Flattens probability distribution for creative writing.
- Top-k Sampling: Filters output choices to only the top K most likely tokens.
- Top-p (Nucleus) Sampling: Samples from the smallest cumulative set of tokens whose probabilities sum to p (e.g. 0.9).`,
      keyConcepts: [
        'Temperature = 0: Deterministic output for structured data & math.',
        'Top-p = 0.9: Truncates long-tail low-probability hallucinated tokens.',
        'Logits: Unnormalized raw scores before softmax transformation.'
      ],
      jsExampleCode: `import { OpenAI } from "openai";

const openai = new OpenAI();

// Deterministic JSON generation call
async function generateDeterministicJson(prompt: string) {
  return await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0, // Zero temperature for reproducible outputs
    top_p: 1,
    response_format: { type: "json_object" }
  });
}`,
      realWorldScenario: 'Setting Temperature = 0 for JSON structured outputs, function calling, and medical diagnosis.'
    }
  },

  // --- PROMPT ENGINEERING & DEFENSES ---
  {
    id: 'prompt-zero-few-shot-cot',
    title: 'Prompt Techniques: Zero-Shot, Few-Shot, CoT, and ReAct',
    category: 'Autonomous AI Agents & Tool Calling',
    difficulty: 'Basic',
    summary: 'Structuring prompts with zero-shot, few-shot examples, Chain-of-Thought, and ReAct.',
    answer: {
      simpleExplanation: `- Zero-Shot: Prompting the model to solve a task with no examples.
- Few-Shot: Providing 2-3 input-output demonstration pairs in the prompt to ground formatting and logic.
- Chain-of-Thought (CoT): Instructing the model to "think step by step" before answering, drastically improving math and reasoning accuracy.
- ReAct (Reasoning + Acting): Combining CoT reasoning with dynamic Tool Calling in an iterative loop.`,
      keyConcepts: [
        'Few-Shot Prompting: Demonstrating exact expected output structure.',
        'Chain-of-Thought (CoT): Step-by-step reasoning for complex math/logic.',
        'Self-Consistency: Generating multiple CoT paths and taking majority vote.'
      ],
      jsExampleCode: `import { OpenAI } from "openai";

const openai = new OpenAI();

async function fewShotChainOfThought(userQuestion: string) {
  const prompt = \`
Solve the following math problem. Think step by step before answering.

Example 1:
Q: Roger has 5 tennis balls. He buys 2 more cans of 3 balls. How many does he have?
A: Roger starts with 5. 2 cans * 3 balls = 6 balls. 5 + 6 = 11. Answer is 11.

Q: \${userQuestion}
A:\`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1
  });

  return res.choices[0].message.content;
}`,
      realWorldScenario: 'Using Few-Shot CoT to achieve 95%+ accuracy on complex domain classification tasks.'
    }
  },

  // --- RAG & SEARCH ---
  {
    id: 'rag-chunking-hybrid-rerank',
    title: 'RAG Pipeline Architecture: Chunking, Hybrid Search & Re-Ranking',
    category: 'LLM Fine-Tuning & RAG Architecture',
    difficulty: 'Intermediate',
    summary: 'Building high-precision production Retrieval-Augmented Generation systems.',
    answer: {
      simpleExplanation: `Basic RAG fails when vector search retrieves noisy or incomplete chunks.

Production RAG Pipeline:
1. Chunking: Recursive Character or Semantic Chunking (e.g. 512 tokens with 50-token overlap).
2. Hybrid Search: Combines Keyword Search (BM25) for exact terms + Vector Search (Embeddings) for concepts using Reciprocal Rank Fusion (RRF).
3. Re-Ranking: Uses a Cross-Encoder (e.g., Cohere ReRank) to evaluate the top 20 candidate chunks against the user query and select the top 3-5 most relevant chunks for the prompt context.`,
      keyConcepts: [
        'Semantic Chunking: Splitting along topic transitions.',
        'Hybrid Search: BM25 (Keywords) + Vector Embeddings (Semantics).',
        'Cross-Encoder Re-Ranking: Final relevance re-ordering.'
      ],
      jsExampleCode: `import { OpenAI } from "openai";
import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });
const openai = new OpenAI();

async function productionRagQuery(userQuery: string, documentChunks: string[]) {
  // 1. Re-Rank top candidates using Cohere ReRank
  const rerankRes = await cohere.rerank({
    model: "rerank-english-v3.0",
    query: userQuery,
    documents: documentChunks,
    topN: 3
  });

  const topContext = rerankRes.results.map(r => documentChunks[r.index]).join("\n\n");

  // 2. Synthesize answer with context
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: \`Context:\n\${topContext}\` },
      { role: "user", content: userQuery }
    ]
  });

  return completion.choices[0].message.content;
}`,
      realWorldScenario: 'Enterprise RAG search matching precise product model numbers alongside natural language queries.'
    }
  },

  // --- AI AGENTS & MCP ---
  {
    id: 'agent-mcp-protocol',
    title: 'Model Context Protocol (MCP) & Agent Tool Integration',
    category: 'Autonomous AI Agents & Tool Calling',
    difficulty: 'Intermediate',
    summary: 'Standardizing AI client connections with tools, resources, and prompt templates.',
    answer: {
      simpleExplanation: `Model Context Protocol (MCP) is an open standard created by Anthropic that decouples AI models from tool implementations.

- MCP Client (Claude Code, Cursor, Custom Agent Host): Connects to MCP servers over stdio or HTTP (SSE).
- MCP Server: Exposes tools (functions), resources (data feeds), and prompts.
- Transports:
  - stdio: Subprocess IPC for local tools (zero network latency).
  - HTTP (SSE): Cloud microservices and multi-tenant SaaS.`,
      keyConcepts: [
        'MCP Tools: Executable functions with JSON schema parameters.',
        'MCP Resources: Readable data URIs (file://, db://).',
        'Dynamic Discovery: notifications/tools/list_changed.'
      ],
      jsExampleCode: `import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["./mcp-server.js"]
});

const client = new Client({ name: "DemoClient", version: "1.0.0" });
await client.connect(transport);

const tools = await client.listTools();
console.log("Discovered MCP Tools:", tools);`,
      realWorldScenario: 'Allowing AI coding assistants to query internal databases and trigger CI/CD pipelines safely.'
    }
  },

  // --- FINE-TUNING & PEFT ---
  {
    id: 'ft-sft-lora-qlora',
    title: 'Fine-Tuning: SFT, LoRA, and QLoRA',
    category: 'LLM Fine-Tuning & RAG Architecture',
    difficulty: 'Advanced',
    summary: 'Adapting base models with Supervised Fine-Tuning and Low-Rank Adaptation.',
    answer: {
      simpleExplanation: `- Supervised Fine-Tuning (SFT): Training a base model on prompt-response pairs to follow instructions.
- LoRA (Low-Rank Adaptation): Freezes base model weights and trains small low-rank decomposition matrices (A and B). Saves 99% VRAM.
- QLoRA: Quantizes the base model to 4-bit NormalFloat (NF4) and fine-tunes LoRA adapters, allowing a 70B model to be fine-tuned on a single consumer GPU.`,
      keyConcepts: [
        'SFT: Instruction tuning base models.',
        'LoRA Rank (r=8, 16): Controlling trainable adapter size.',
        'QLoRA: 4-bit base model quantization + LoRA training.'
      ],
      jsExampleCode: `// Serving LoRA Adapters dynamically in Node.js API
import { OpenAI } from "openai";

const openai = new OpenAI();

async function runFineTunedModel(prompt: string) {
  return await openai.chat.completions.create({
    model: "ft:gpt-4o-mini:enterprise:custom-adapter-v1",
    messages: [{ role: "user", content: prompt }]
  });
}`,
      realWorldScenario: 'Adapting open-source Llama-3 models to strictly follow company-specific legal formatting rules.'
    }
  },

  // --- VECTOR DATABASES ---
  {
    id: 'vec-embeddings-hnsw',
    title: 'Vector Databases, HNSW Indexing, and Embeddings',
    category: 'Vector Databases & Embeddings',
    difficulty: 'Intermediate',
    summary: 'Converting text to high-dimensional vectors and executing fast ANN similarity search.',
    answer: {
      simpleExplanation: `Embeddings map text strings to high-dimensional floating-point vectors (e.g. 1536 dimensions) where semantically similar concepts are located close together.

- Cosine Similarity: Measures the cosine of the angle between two vectors.
- HNSW (Hierarchical Navigable Small World): Organizes high-dimensional vectors into a multi-layer graph index for sub-10ms Approximate Nearest Neighbor (ANN) search.`,
      keyConcepts: [
        'Embeddings: Dense numerical representation of text semantics.',
        'HNSW Index: O(log N) fast vector graph search.',
        'Metadata Filtering: Pre-filtering vectors by tenant or category.'
      ],
      jsExampleCode: `import { OpenAI } from "openai";

const openai = new OpenAI();

async function generateEmbeddings(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });

  return response.data[0].embedding; // Returns 1536 float values
}`,
      realWorldScenario: 'Building semantic search engines across millions of customer support tickets.'
    }
  }
];

export const allAiEngineerGroups: AiEngineerTopicGroup[] = [
  {
    id: 'group-agents',
    title: 'Autonomous AI Agents & Tool Calling',
    questionCount: 25,
    description: 'ReAct agent loops, MCP tools, function calling, stateful graphs, memory, and multi-agent coordination.',
    questions: allAiEngineerQuestions.filter(q => q.category === 'Autonomous AI Agents & Tool Calling')
  },
  {
    id: 'group-eval',
    title: 'LLM Evaluation & Guardrails',
    questionCount: 16,
    description: 'LLM-as-a-Judge, prompt injection defenses, PII filtering, faithfulness scoring, and red teaming.',
    questions: allAiEngineerQuestions.filter(q => q.category === 'LLM Evaluation & Guardrails')
  },
  {
    id: 'group-rag',
    title: 'LLM Fine-Tuning & RAG Architecture',
    questionCount: 30,
    description: 'Hybrid search, re-ranking, chunking, GraphRAG, LoRA, QLoRA, and prompt engineering.',
    questions: allAiEngineerQuestions.filter(q => q.category === 'LLM Fine-Tuning & RAG Architecture')
  },
  {
    id: 'group-vector',
    title: 'Vector Databases & Embeddings',
    questionCount: 22,
    description: 'HNSW indexing, ANN search, cosine distance, embedding dimensions, and quantization.',
    questions: allAiEngineerQuestions.filter(q => q.category === 'Vector Databases & Embeddings')
  }
];
