import { SystemDesignTopic } from '../../types/systemDesign';

export const tinyUrlTopic: SystemDesignTopic = {
  id: 'tiny-url',
  title: 'Tiny URL (URL Shortener)',
  subtitle: 'URL Shortening & Redirection Service',
  category: 'Distributed Systems',
  difficulty: 'Easy',
  frequencyRank: 1,
  editorial: {
    companies: ['Google', 'Amazon', 'Meta', 'Microsoft', 'Uber'],
    overview: 'Design a scalable URL shortener service that converts long URLs into unique short aliases and handles millions of high-throughput redirects per day.',
    introduction: `Tiny URL (URL shortener) is one of the most popular system design questions out there. On the surface it can appear as a very simple problem to solve, but it is possible to go deep on scalability, base conversion, key collision avoidance, and cache optimization which interviewers expect.

This design covers two architectures: a basic implementation (monolithic count-cache counter with collisions) and an advanced implementation (distributed range allocation using ZooKeeper, NoSQL sharding, and LRU cache).`,
    requirements: {
      functional: [
        'Given a long URL, generate a unique short alias (e.g., https://tinyurl.com/aB3x9Z).',
        'Given a short URL alias, redirect the user immediately to the original long URL.',
        'Users should optionally be able to specify a custom short link alias.',
        'Short links should have an optional expiration date.'
      ],
      nonFunctional: [
        'High availability: System must be 99.99% available for redirects.',
        'Very low latency: Short link redirect response time must be < 20ms.',
        'URL predictability: Short URLs should not be easily guessable to prevent enumeration attacks.',
        'High throughput: Support 1,000 writes/sec and 10,000 reads/sec.'
      ],
      outOfScope: [
        'Updating existing short URLs',
        'Deleting short URLs manually by non-admin users'
      ]
    },
    keyQuestions: {
      assumptions: [
        '1,000 URL creation requests per second (writes)',
        '10:1 Read to Write ratio => 10,000 redirect requests per second (reads)',
        'System operates for 10 years without link recycling.'
      ],
      calculations: [
        { label: 'Total URLs generated/year', value: '31.5 Billion', desc: '1,000 * 86,400 * 365 = ~31.5B URLs/year' },
        { label: 'Total URLs over 10 years', value: '315 Billion', desc: '31.5B * 10 = 315B total records stored' },
        { label: 'Storage required (10 yrs)', value: '157.5 GB', desc: '315B URLs * 500 bytes per URL record = ~157.5 TB storage' },
        { label: 'Read QPS', value: '10,000 QPS', desc: '10:1 ratio over 1,000 write QPS' },
        { label: 'Cache size (80/20 rule)', value: '86.4 GB RAM', desc: '20% of daily read volume cached: 0.2 * (10,000 * 86,400) * 500B' }
      ]
    },
    dataModel: {
      overview: 'Relational or Key-Value data model. High read volume makes NoSQL key-value store (Cassandra or DynamoDB) ideal.',
      entities: [
        {
          name: 'urls',
          description: 'Primary entity mapping short alias to long destination URL.',
          fields: [
            { name: 'short_key', type: 'VARCHAR(16) PRIMARY KEY', desc: 'Unique 7-character base62 key' },
            { name: 'long_url', type: 'VARCHAR(2048)', desc: 'Original target destination URL' },
            { name: 'user_id', type: 'VARCHAR(64)', desc: 'ID of creator account (nullable)' },
            { name: 'created_at', type: 'TIMESTAMP', desc: 'Creation timestamp' },
            { name: 'expires_at', type: 'TIMESTAMP', desc: 'Expiration timestamp (nullable)' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'Stateless RESTful API endpoints supporting standard HTTP status codes (301 Permanent vs 302 Temporary Redirect).',
      endpoints: [
        {
          method: 'POST',
          path: '/api/v1/create',
          params: '{ "longUrl": "string", "customAlias"?: "string", "expireDays"?: number }',
          statusCode: '201 Created',
          description: 'Accepts long URL and returns generated short URL string.'
        },
        {
          method: 'GET',
          path: '/{shortKey}',
          params: 'header: Host/User-Agent',
          statusCode: '301 Moved Permanently / 302 Found',
          description: 'Redirects client HTTP request to target long URL.'
        }
      ]
    },
    basicImplementation: {
      title: 'Monolithic Counter Cache + RDBMS',
      description: `Client requests a short URL -> Load Balancer forwards to Web Server -> Web Server increments a centralized Redis count cache -> Converts base10 counter to base62 string (e.g. 125 -> "cb") -> Saves mapping in MySQL table.`,
      drawbacks: [
        'Single point of failure at count cache and DB.',
        'Race conditions across distributed web servers requesting count updates.',
        'High latency bottleneck on centralized write counter.'
      ]
    },
    advancedImplementation: {
      title: 'Distributed Range Worker (Apache ZooKeeper) + Cassandra + Redis Cluster',
      description: `To prevent race conditions and eliminate single points of failure, Apache ZooKeeper allocates disjoint counter ranges (e.g. Server 1 gets 1M-2M, Server 2 gets 2M-3M). Each web server generates keys locally without locking or network overhead. Datastores are horizontally partitioned using Cassandra and Redis.`,
      components: [
        { name: 'Load Balancer (NGINX / AWS ALB)', role: 'Traffic Routing', details: 'Distributes incoming POST and GET traffic across web server cluster using Round-Robin or Least Connections.' },
        { name: 'Apache ZooKeeper', role: 'Token Range Coordinator', details: 'Assigns unique ranges of numbers (e.g., 1,000,000 values per batch) to active application servers upon startup.' },
        { name: 'Web Application Servers', role: 'Base62 Converter & Handler', details: 'Converts assigned sequential ID to Base62 string (0-9, a-z, A-Z) producing 7-char hash without hash collision risk.' },
        { name: 'Distributed Cache (Redis Cluster)', role: 'Read Accelerator', details: 'Caches top 20% hot links with LRU eviction policy to satisfy 90%+ read requests with sub-5ms latency.' },
        { name: 'NoSQL Database (Apache Cassandra)', role: 'Persistent Storage', details: 'Provides horizontal scale, fast key lookups, zero single point of failure, and append-heavy throughput.' }
      ]
    },
    flows: [
      {
        title: 'Create Short URL Flow',
        description: 'Flow of converting long URL to short URL.',
        steps: [
          'Client sends POST /api/v1/create with long URL.',
          'Load balancer routes request to available Web Server.',
          'Web server checks local counter range assigned by ZooKeeper. Increments counter.',
          'Web server converts counter value to 7-character Base62 string.',
          'Web server writes mapping (shortKey -> longUrl) into Cassandra DB and Redis Cache.',
          'Returns 201 Created with short URL to client.'
        ]
      },
      {
        title: 'Redirect URL Flow',
        description: 'Flow of user opening short link in browser.',
        steps: [
          'User clicks or navigates to https://tinyurl.com/aB3x9Z.',
          'Load balancer forwards GET /aB3x9Z to Web Server.',
          'Web server queries Redis Cache for key "aB3x9Z".',
          'If Cache Hit: Return HTTP 301/302 Redirect with Location header immediately.',
          'If Cache Miss: Query Cassandra DB, populate Redis Cache, and return HTTP 301/302 Redirect.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'HTTP 301 vs 302 Redirects', details: '301 Permanent Redirect allows client browser to cache redirect locally (reduces server load, but loses analytics). 302 Temporary Redirect forces every request through server (enables accurate click tracking).' },
      { topic: 'Security & Guessability', details: 'Sequential base62 short keys can be enumerated by attackers. Appending a random 2-character salt or shuffling base62 alphabet masks sequential patterns.' },
      { topic: 'Rate Limiting & DDoS Defense', details: 'Enforce IP-based and User-based rate limiting via Token Bucket algorithm in API Gateway.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'How many unique URLs can be represented by a 7-character Base62 encoded string?',
      options: ['3.5 Trillion (62^7)', '56 Billion (62^6)', '100 Billion (10^7)', '1 Trillion (62^5)'],
      correctAnswerIndex: 0,
      explanation: 'Base62 consists of 26 lowercase + 26 uppercase + 10 digits = 62 total characters. 62^7 = ~3.52 Trillion unique strings.'
    },
    {
      id: 'q2',
      question: 'What is the primary role of Apache ZooKeeper in the advanced URL shortener architecture?',
      options: [
        'Assigning non-overlapping counter ranges to Web Servers to avoid collisions without lock contention',
        'Storing long URL records directly',
        'Caching popular short links in memory',
        'Performing load balancing across web servers'
      ],
      correctAnswerIndex: 0,
      explanation: 'ZooKeeper acts as a central coordinator that dispenses disjoint numerical ID ranges (e.g. 1M-2M) to web servers so each server can generate unique short keys independently.'
    },
    {
      id: 'q3',
      question: 'Why choose HTTP 302 over HTTP 301 for short link redirection when analytics are required?',
      options: [
        'HTTP 302 prevents browsers from caching the redirect, forcing requests to hit your servers so click metrics can be recorded',
        'HTTP 302 is faster than HTTP 301',
        'HTTP 301 is not supported by modern web browsers',
        'HTTP 302 encrypts the long URL payload'
      ],
      correctAnswerIndex: 0,
      explanation: 'HTTP 301 allows browser-side caching, bypassing the server on subsequent clicks. HTTP 302 directs every click to the shortener server, enabling accurate click analytics.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'client', label: 'Client / Browser', type: 'client', description: 'User browser requesting link creation or redirection', x: 50, y: 180 },
      { id: 'lb', label: 'API Gateway / LB', type: 'lb', description: 'AWS ALB / NGINX handling SSL termination & rate limiting', x: 220, y: 180 },
      { id: 'app', label: 'Web Application Cluster', type: 'service', description: 'Stateless Node/Go/Java app servers converting Base62 keys', x: 420, y: 180 },
      { id: 'zk', label: 'Apache ZooKeeper', type: 'zookeeper', description: 'Distributes unique ID ranges (e.g., 1M-2M batch) to app instances', x: 420, y: 50 },
      { id: 'cache', label: 'Redis Cluster (LRU)', type: 'cache', description: 'In-memory cache for top 20% hot long-url mappings', x: 640, y: 100 },
      { id: 'db', label: 'Cassandra NoSQL DB', type: 'db', description: 'Partitioned write-heavy datastore storing short_key -> long_url', x: 640, y: 260 }
    ],
    connections: [
      { from: 'client', to: 'lb', label: 'HTTP Request' },
      { from: 'lb', to: 'app', label: 'Route Request' },
      { from: 'app', to: 'zk', label: 'Fetch ID Range' },
      { from: 'app', to: 'cache', label: '1. Check / Set Cache' },
      { from: 'app', to: 'db', label: '2. DB Query / Persistence' }
    ]
  }
};
