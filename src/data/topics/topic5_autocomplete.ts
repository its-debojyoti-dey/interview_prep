import { SystemDesignTopic } from '../../types/systemDesign';

export const autocompleteTopic: SystemDesignTopic = {
  id: 'autocomplete',
  title: 'Autocomplete System (Google Search)',
  subtitle: 'Type-Ahead & Prefix Search Engine',
  category: 'Search & Analytics',
  difficulty: 'Medium',
  frequencyRank: 5,
  editorial: {
    companies: ['Google', 'Amazon', 'Microsoft', 'Uber', 'LinkedIn'],
    overview: 'Design a real-time search autocomplete (type-ahead) system that returns the top 5 most relevant and popular search suggestions as a user types characters into a search bar.',
    introduction: `Search autocomplete is an essential feature of modern search engines. As a user types a query (e.g. "sys..."), the system returns top matching search suggestions (e.g. "system design", "system32", "systematic") in under 100 milliseconds.

The core challenge involves efficient prefix matching over billions of search terms using Trie data structures and distributed caching.`,
    requirements: {
      functional: [
        'Returns top 5 popular search query suggestions matching the entered prefix.',
        'Suggestions should update dynamically after each character keystroke.',
        'Filter out offensive, NSFW, or banned search terms.',
        'Ranking should be based on search term popularity (frequency).'
      ],
      nonFunctional: [
        'Ultra-fast response latency: < 100ms per keystroke (ideally ~30ms).',
        'High availability and fault tolerance.',
        'Scalable to handle 5 Billion search queries per day (~50,000 QPS).',
        'Real-time frequency updates from offline log aggregation pipelines.'
      ],
      outOfScope: ['Multi-language auto-translation']
    },
    keyQuestions: {
      assumptions: [
        '100 Million daily active users making 50 search queries/day => 5 Billion searches/day',
        'Average query length = 20 characters => 20 keystrokes per search',
        'Total keystroke QPS = (5B * 20) / 86400 = ~1,150,000 QPS peak'
      ],
      calculations: [
        { label: 'Keystroke QPS', value: '1.15 Million QPS', desc: '5B queries * 20 keystrokes' },
        { label: 'Trie Memory Footprint', value: '30 GB RAM', desc: 'Storing 100M unique terms with prefix pointers' },
        { label: 'Cache Hit Rate Target', value: '95%', desc: 'Using browser local cache + CDN edge cache to drop backend QPS by 90%+' }
      ]
    },
    dataModel: {
      overview: 'Specialized in-memory Trie (Prefix Tree) data structure where each node stores the top 5 suggestions for its prefix string.',
      entities: [
        {
          name: 'trie_node',
          description: 'In-memory Node structure for Prefix Search.',
          fields: [
            { name: 'character', type: 'CHAR', desc: 'Node letter (e.g. "a")' },
            { name: 'top_5_suggestions', type: 'ARRAY<STRING>', desc: 'Pre-computed top 5 search terms' },
            { name: 'children', type: 'MAP<CHAR, NODE_PTR>', desc: 'Pointers to child nodes' }
          ]
        },
        {
          name: 'frequency_table',
          description: 'Offline database recording historical search term counts.',
          fields: [
            { name: 'query', type: 'VARCHAR(256) PRIMARY KEY', desc: 'Search query term' },
            { name: 'frequency', type: 'BIGINT', desc: 'Total historical search count' },
            { name: 'updated_at', type: 'TIMESTAMP', desc: 'Last update time' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'Lightweight HTTP GET REST API.',
      endpoints: [
        {
          method: 'GET',
          path: '/v1/autocomplete',
          params: '?q=sys&limit=5',
          statusCode: '200 OK',
          description: 'Returns array of top 5 string suggestions for query string `q`.'
        }
      ]
    },
    basicImplementation: {
      title: 'SQL Database LIKE Query',
      description: 'Executes `SELECT query FROM search_terms WHERE query LIKE "sys%" ORDER BY frequency DESC LIMIT 5;` on MySQL database.',
      drawbacks: [
        'Full table scan or index scan over millions of rows on every keystroke.',
        'Extremely high database latency (> 500ms), failing the 100ms requirement.'
      ]
    },
    advancedImplementation: {
      title: 'Distributed Trie Cache Server + Offline MapReduce/Spark Aggregation Pipeline',
      description: `1. In-Memory Trie Optimization: Standard Trie traversal requires searching child nodes down to leaf nodes, which is O(k + n log n). By pre-computing and caching the top 5 query results directly inside every Trie Node, lookup time drops to O(k) where k = length of prefix string.

2. Browser & CDN Caching: Responses are cached at the edge (CDN) and browser local storage for 1 hour ("Cache-Control: max-age=3600"), reducing backend server traffic by 80%+.

3. Offline Aggregation Pipeline: Analytics collectors stream search logs to Kafka. Apache Spark/MapReduce aggregates search query frequencies weekly and builds updated Trie Snapshots, which are reloaded into memory atomically.`,
      components: [
        { name: 'Browser / Client Cache', role: 'Edge Filtering', details: 'Caches previous keystroke results locally in memory.' },
        { name: 'Trie Cache Service (Redis / C++ In-Memory)', role: 'Low-Latency Prefix Lookup', details: 'Holds pre-computed Trie in RAM.' },
        { name: 'Kafka & Spark Pipeline', role: 'Frequency Aggregator', details: 'Aggregates search log streams to compute top query frequencies.' },
        { name: 'Trie DB (Key-Value Document Store)', role: 'Persistent Trie Snapshot', details: 'Stores serialized weekly Trie structures.' }
      ]
    },
    flows: [
      {
        title: 'Query Suggestion Flow',
        description: 'Handling user input in search bar.',
        steps: [
          'User types "s" -> "sy" -> "sys" in search bar.',
          'Browser checks local cache for "sys". If miss, calls GET /v1/autocomplete?q=sys.',
          'CDN checks edge cache for key "sys". If hit, returns immediately.',
          'If CDN miss, API Gateway forwards request to Trie Cache Server.',
          'Trie Cache Server traverses node pointers for "s" -> "y" -> "s".',
          'Reads pre-computed `top_5_suggestions` list from node "s" and returns JSON response instantly (< 10ms).'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Trie Partitioning / Sharding', details: 'Sharding Trie servers by prefix letter (e.g. Server A handles A-M, Server B handles N-Z) or using consistent hashing on prefix string.' },
      { topic: 'Filtering & Moderation', details: 'Maintain an in-memory Bloom Filter containing banned words to censor inappropriate suggestions before returning to user.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'How do we reduce Trie traversal time from O(k + n log n) to O(k) in a production autocomplete system?',
      options: [
        'By pre-computing and storing the top 5 search suggestions directly inside every Trie node',
        'By running database indexes on every character',
        'By using binary search trees instead of Tries',
        'By converting all strings to numbers'
      ],
      correctAnswerIndex: 0,
      explanation: 'Caching the top K results directly on every Trie node allows instant O(k) retrieval without traversing all child nodes down to the leaves.'
    },
    {
      id: 'q2',
      question: 'Why is an offline analytics pipeline (e.g., Spark/MapReduce) used to update query frequencies instead of real-time database writes?',
      options: [
        'Real-time frequency updates on every search would overload the database with millions of concurrent write locks',
        'Offline processing is cheaper',
        'Spark is required for Trie data structures',
        'Search frequencies never change'
      ],
      correctAnswerIndex: 0,
      explanation: 'Updating frequency counters in real-time for millions of search queries per second causes intense lock contention. Offline batch processing handles log aggregation efficiently.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'client', label: 'User Browser', type: 'client', description: 'Search bar input with local cache', x: 40, y: 160 },
      { id: 'cdn', label: 'CDN Edge Cache', type: 'cdn', description: 'Caches prefix responses', x: 220, y: 160 },
      { id: 'lb', label: 'Load Balancer', type: 'lb', description: 'Routes search requests', x: 400, y: 160 },
      { id: 'trie', label: 'Trie Server Cluster', type: 'service', description: 'In-memory Trie nodes with top-5 precomputed', x: 600, y: 100 },
      { id: 'kafka', label: 'Kafka Log Stream', type: 'queue', description: 'Captures search click logs', x: 600, y: 260 },
      { id: 'spark', label: 'Spark Batch Pipeline', type: 'service', description: 'Aggregates weekly query frequencies', x: 780, y: 260 }
    ],
    connections: [
      { from: 'client', to: 'cdn', label: '1. GET /autocomplete?q=sys' },
      { from: 'cdn', to: 'lb', label: '2. On CDN Miss' },
      { from: 'lb', to: 'trie', label: '3. Lookup Prefix' },
      { from: 'trie', to: 'kafka', label: '4. Async Log Query' },
      { from: 'kafka', to: 'spark', label: '5. Aggregate Counts' },
      { from: 'spark', to: 'trie', label: '6. Update Trie Snapshot' }
    ]
  }
};
