import { SystemDesignTopic } from '../../types/systemDesign';

export const rateLimiterTopic: SystemDesignTopic = {
  id: 'rate-limiter',
  title: 'Rate Limiter',
  subtitle: 'API Throttling & DDoS Guard',
  category: 'Infrastructure & Security',
  difficulty: 'Medium',
  frequencyRank: 4,
  editorial: {
    companies: ['Stripe', 'Google', 'Amazon', 'Cloudflare', 'Lyft'],
    overview: 'Design an API Rate Limiter to limit the number of requests a client can submit within a specified time frame, shielding backend services from traffic spikes and malicious DDoS attacks.',
    introduction: `An API Rate Limiter controls the rate of traffic sent by a client or service. In HTTP APIs, it limits requests per IP address or user ID (e.g. 100 requests per minute).

If the limit is exceeded, excess requests are rejected immediately with HTTP 429 Too Many Requests status code.`,
    requirements: {
      functional: [
        'Limit requests based on client identifier (IP address, User ID, or API Key).',
        'Return HTTP status code 429 (Too Many Requests) when limit is exceeded.',
        'Support configurable rules (e.g., 5 requests/sec for guest, 1,000 requests/sec for tier-1 user).',
        'Include standard rate-limiting HTTP headers (X-Ratelimit-Remaining, X-Ratelimit-Limit, X-Ratelimit-Retry-After).'
      ],
      nonFunctional: [
        'Minimal latency impact (< 2ms added per request).',
        'Memory efficiency: Store millions of client counters with low memory footprint.',
        'High availability and resilience: Rate limiter failure should default to fallback open mode.',
        'Distributed accuracy across horizontally scaled servers.'
      ],
      outOfScope: ['WAF Web Application Firewall deep packet inspection']
    },
    keyQuestions: {
      assumptions: [
        '1 Million active daily API users',
        'Average 10,000 API QPS peak traffic',
        'Rate limit rules stored in memory'
      ],
      calculations: [
        { label: 'Total active tracking keys', value: '1 Million keys', desc: '1M active users/IPs' },
        { label: 'Memory size in Redis', value: '120 MB', desc: '1M keys * 120 bytes per key structure in Redis' },
        { label: 'Max allowable latency budget', value: '< 2 ms', desc: 'Must add virtually zero overhead to API calls' }
      ]
    },
    dataModel: {
      overview: 'In-memory Redis hash or sorted set datastructures using Lua scripts for atomic increments.',
      entities: [
        {
          name: 'rate_limit_rules',
          description: 'Configuration rules stored in config service or Redis.',
          fields: [
            { name: 'rule_id', type: 'VARCHAR(64) PRIMARY KEY', desc: 'Rule key identifier' },
            { name: 'client_tier', type: 'VARCHAR(32)', desc: 'guest | tier1 | tier2' },
            { name: 'time_window_sec', type: 'INT', desc: 'Duration window (e.g. 60 sec)' },
            { name: 'max_requests', type: 'INT', desc: 'Allowed count (e.g. 100)' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'Middleware proxy or API gateway filter injected into HTTP request pipeline.',
      endpoints: [
        {
          method: 'GET',
          path: '/api/v1/*',
          params: 'Headers: X-API-Key or Authorization Bearer',
          statusCode: '200 OK / 429 Too Many Requests',
          description: 'Every incoming API request is filtered by rate limiter middleware.'
        }
      ]
    },
    basicImplementation: {
      title: 'Fixed Window Counter in Redis',
      description: 'Divides time into fixed 1-minute windows. Uses Redis `INCR` key like `rate_user123_minute45`. If counter > 100, reject request.',
      drawbacks: [
        'Window Boundary Problem: Double allowable traffic can burst across the edge of adjacent minutes (e.g. 100 requests at 00:59 + 100 requests at 01:01 = 200 requests within 2 seconds).'
      ]
    },
    advancedImplementation: {
      title: 'Sliding Window Counter with Redis & Atomic Lua Scripting',
      description: `Combines Fixed Window Counters with a sliding weight calculation derived from the previous window's count.

Formula: Current Window Count + (Previous Window Count * (1 - Progress % of Current Window)).

Executing this calculation atomically inside Redis using a Lua script prevents race conditions across multi-threaded web workers while maintaining ultra-fast execution time (< 1ms).`,
      components: [
        { name: 'API Gateway (Envoy / Kong)', role: 'Enforcement Point', details: 'Executes rate limiter plugin before passing request to upstream microservices.' },
        { name: 'Redis Cache Cluster', role: 'In-memory Counter Store', details: 'Stores counter state with TTL auto-eviction.' },
        { name: 'Rate Limit Config Service', role: 'Rules Engine', details: 'Reloads throttling rule changes dynamically without downtime.' }
      ]
    },
    flows: [
      {
        title: 'Rate Limit Filter Flow',
        description: 'Processing API request through rate limiter.',
        steps: [
          'Client request reaches API Gateway.',
          'Gateway extracts client key (User ID / IP).',
          'Gateway executes atomic Redis Lua script passing client key and current timestamp.',
          'Redis calculates sliding window count.',
          'If Count <= Limit: Redis increments counter, returns remaining quota. Gateway forwards request to backend service.',
          'If Count > Limit: Gateway halts request, sets `Retry-After` header, and returns HTTP 429 Too Many Requests.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Common Rate Limiting Algorithms', details: '1. Token Bucket (smooth bursts), 2. Leaky Bucket (fixed rate output), 3. Fixed Window Counter (simple, burst issue), 4. Sliding Window Log (accurate, high memory), 5. Sliding Window Counter (accurate, low memory).' },
      { topic: 'Distributed Concurrency (Race Conditions)', details: 'Avoid read-modify-write race conditions in Redis by using Lua scripts or Redis Transactions (MULTI/EXEC).' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'What is the main limitation of the Fixed Window Counter algorithm for rate limiting?',
      options: [
        'It allows twice the allowed request limit to pass through around the boundary of adjacent time windows',
        'It uses too much memory',
        'It requires complex machine learning models',
        'It cannot handle IP addresses'
      ],
      correctAnswerIndex: 0,
      explanation: 'A traffic spike at the end of window N and the start of window N+1 allows up to 2x max requests within a short time interval.'
    },
    {
      id: 'q2',
      question: 'Which algorithm provides a smooth constant output rate regardless of input burst size?',
      options: ['Leaky Bucket', 'Fixed Window', 'Token Bucket', 'Random Drop'],
      correctAnswerIndex: 0,
      explanation: 'The Leaky Bucket algorithm processes requests at a fixed constant rate using a FIFO queue, smoothing out all bursts.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'client', label: 'Client App', type: 'client', description: 'Makes API request', x: 40, y: 160 },
      { id: 'gw', label: 'API Gateway (Kong/Envoy)', type: 'lb', description: 'Intersects request & runs Rate Limit plugin', x: 260, y: 160 },
      { id: 'redis', label: 'Redis Cluster (Lua Script)', type: 'cache', description: 'Executes atomic sliding window counter check', x: 480, y: 80 },
      { id: 'backend', label: 'Backend Microservices', type: 'service', description: 'Target business API logic', x: 480, y: 260 },
      { id: 'config', label: 'Rule Config DB', type: 'db', description: 'Rate limit rule policies', x: 680, y: 80 }
    ],
    connections: [
      { from: 'client', to: 'gw', label: 'HTTP Request' },
      { from: 'gw', to: 'redis', label: '1. Check & Increment Counter' },
      { from: 'redis', to: 'gw', label: '2. Allowed (Pass / 429)' },
      { from: 'gw', to: 'backend', label: '3. If Allowed -> Forward' },
      { from: 'config', to: 'gw', label: 'Load Rules' }
    ]
  }
};
