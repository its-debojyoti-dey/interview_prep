import { SystemDesignTopic } from '../../types/systemDesign';

export const topKLeaderboardTopic: SystemDesignTopic = {
  id: 'top-k-leaderboard',
  title: 'Top-K Leaderboard',
  subtitle: 'Real-time Gaming & Score Ranking System',
  category: 'Distributed Systems',
  difficulty: 'Medium',
  frequencyRank: 8,
  editorial: {
    companies: ['Riot Games', 'Electronic Arts', 'Duolingo', 'Amazon', 'Epic Games'],
    overview: 'Design a real-time leaderboard service capable of ranking millions of users or game players based on scores, supporting fast score updates and top-K rank queries.',
    introduction: `Real-time leaderboards are widely used in online gaming, competitive coding, and fitness applications (e.g. Strava, Duolingo). The system must process millions of score additions per second and instantly return the top 100 players or a user's exact current rank.

Using traditional relational SQL database queries (\`ORDER BY score DESC LIMIT 100\`) fails dramatically under scale.`,
    requirements: {
      functional: [
        'Update a player\'s score when they win a game or complete a task.',
        'Fetch Top K (e.g., Top 100) global leaderboard players with scores.',
        'Fetch exact numerical rank of a specific player (e.g. Player X is ranked #4,521).',
        'Support periodic reset intervals (Daily, Weekly, Monthly Leaderboards).'
      ],
      nonFunctional: [
        'Real-time ranking updates with low query latency (< 10ms).',
        'Scalable to 100 Million active players and 50,000 score updates per second.',
        'High availability with persistent durability of final scores.'
      ],
      outOfScope: ['Anti-cheat memory verification']
    },
    keyQuestions: {
      assumptions: [
        '100 Million total registered players; 10 Million Daily Active Users',
        '50,000 score write updates per second during peak tournament events',
        '10,000 leaderboard read requests per second'
      ],
      calculations: [
        { label: 'Redis Memory Footprint', value: '3.2 GB RAM', desc: '100M members * 32 bytes per Redis Sorted Set entry' },
        { label: 'Rank Lookup Time', value: 'O(log N)', desc: 'Redis Sorted Set uses SkipList algorithm' },
        { label: 'Max allowable latency', value: '< 10 ms', desc: 'In-memory Redis lookup provides < 2ms latency' }
      ]
    },
    dataModel: {
      overview: 'Redis Sorted Set (ZSET) in-memory data structure backed by persistent PostgreSQL write logs.',
      entities: [
        {
          name: 'user_scores',
          description: 'Persistent RDBMS player score backup.',
          fields: [
            { name: 'user_id', type: 'BIGINT PRIMARY KEY', desc: 'Player ID' },
            { name: 'username', type: 'VARCHAR(64)', desc: 'Gamer tag' },
            { name: 'score', type: 'BIGINT', desc: 'Current score count' },
            { name: 'updated_at', type: 'TIMESTAMP', desc: 'Last score update time' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'REST or gRPC endpoints for updating scores and querying top ranks.',
      endpoints: [
        {
          method: 'POST',
          path: '/v1/leaderboard/scores',
          params: '{ "userId": "123", "pointsDelta": 50 }',
          statusCode: '200 OK',
          description: 'Adds points to player current total score.'
        },
        {
          method: 'GET',
          path: '/v1/leaderboard/top',
          params: '?k=100',
          statusCode: '200 OK',
          description: 'Returns array of top K player ranks and scores.'
        },
        {
          method: 'GET',
          path: '/v1/leaderboard/users/{userId}/rank',
          params: '',
          statusCode: '200 OK',
          description: 'Returns player relative rank position.'
        }
      ]
    },
    basicImplementation: {
      title: 'Relational Database SQL Queries',
      description: 'Stores scores in a MySQL table `scores(user_id, score)`. Fetches top 100 via `SELECT * FROM scores ORDER BY score DESC LIMIT 100`.',
      drawbacks: [
        'High disk I/O and table scan locks when sorting 100M rows on every request.',
        'Calculating relative rank for a specific user requires counting all rows above them (`SELECT COUNT(*) WHERE score > X`), taking seconds to execute.'
      ]
    },
    advancedImplementation: {
      title: 'Distributed Redis Sorted Sets (SkipList + Hash Table) + Sharded Range Buckets',
      description: `1. Redis Sorted Set (ZSET): Redis implements ZSET using a combination of a Hash Table (for O(1) score lookup) and a SkipList (for O(log N) element insertion and rank calculation).

2. Operations:
   - \`ZADD leaderboard <score> <user_id>\` / \`ZINCRBY leaderboard <points> <user_id>\`
   - \`ZREVRANGE leaderboard 0 99 WITHSCORES\` (Fetches top 100 players instantly in O(log N + K) time).
   - \`ZREVRANK leaderboard <user_id>\` (Returns zero-indexed rank in O(log N) time).

3. Sharding across Redis Cluster: If user base scales to billions, players can be partitioned into score range buckets (e.g. Bucket 1: 0-1000 pts, Bucket 2: 1001-2000 pts). Querying Top K only hits the highest score bucket.`,
      components: [
        { name: 'API Gateway', role: 'Request Router', details: 'Accepts game client score updates.' },
        { name: 'Leaderboard Service', role: 'Business Logic', details: 'Updates Redis ZSET & pushes write log to Kafka.' },
        { name: 'Redis Cluster (ZSET)', role: 'In-Memory Rank Engine', details: 'Holds player SkipList rankings.' },
        { name: 'Kafka & DB Persister', role: 'Async Persistence', details: 'Flushes score updates asynchronously to PostgreSQL for durability.' }
      ]
    },
    flows: [
      {
        title: 'Score Update Flow',
        description: 'Player earns points in game.',
        steps: [
          'Game server fires POST /v1/leaderboard/scores with userId and +50 points.',
          'Leaderboard Service calls Redis `ZINCRBY leaderboard 50 user_123`.',
          'Redis updates SkipList in < 1ms.',
          'Service produces `score-updated` event to Kafka topic for async DB backup.'
        ]
      },
      {
        title: 'Fetch Top 100 Leaderboard Flow',
        description: 'Displaying global leaderboard screen.',
        steps: [
          'Client sends GET /v1/leaderboard/top?k=100.',
          'Leaderboard Service calls Redis `ZREVRANGE leaderboard 0 99 WITHSCORES`.',
          'Redis returns sorted array of 100 user IDs and scores in 2ms.',
          'Service fetches usernames for 100 IDs from cache and returns JSON.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Handling Tie-Breakers', details: 'If two players have equal scores, sort by who achieved the score first by encoding timestamp into fractional decimal score (e.g. Score = Points + (1 - Timestamp/10^13)).' },
      { topic: 'Periodic Reset (Weekly Leaderboards)', details: 'Maintain Redis keys named with timestamp prefixes (e.g. `leaderboard:2026:week34`). Old keys expire via TTL.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'Which underlying data structures are combined inside Redis Sorted Sets (ZSET) to enable fast rank lookups?',
      options: [
        'Hash Table and SkipList',
        'B+ Tree and Array',
        'Linked List and Binary Heap',
        'Bloom Filter and Trie'
      ],
      correctAnswerIndex: 0,
      explanation: 'Redis ZSET combines a Hash Table (for O(1) user score lookup) with a SkipList (for O(log N) sorted ordering and rank queries).'
    },
    {
      id: 'q2',
      question: 'What is the time complexity to fetch the Top K leaderboard items using Redis ZREVRANGE?',
      options: ['O(log N + K)', 'O(N^2)', 'O(N log N)', 'O(1)'],
      correctAnswerIndex: 0,
      explanation: 'Traversing the SkipList to find the starting node takes O(log N), and reading K elements takes O(K), resulting in total complexity O(log N + K).'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'client', label: 'Game Client', type: 'client', description: 'Submits score update & requests rank', x: 40, y: 160 },
      { id: 'lb', label: 'API Gateway', type: 'lb', description: 'Routes leaderboard traffic', x: 220, y: 160 },
      { id: 'svc', label: 'Leaderboard Service', type: 'service', description: 'Executes ZSET operations', x: 420, y: 160 },
      { id: 'redis', label: 'Redis Cluster (ZSET)', type: 'cache', description: 'In-memory SkipList ranking engine', x: 640, y: 80 },
      { id: 'kafka', label: 'Kafka Event Stream', type: 'queue', description: 'Async score persistence queue', x: 640, y: 240 },
      { id: 'db', label: 'PostgreSQL DB', type: 'db', description: 'Persistent backup score storage', x: 820, y: 240 }
    ],
    connections: [
      { from: 'client', to: 'lb', label: 'API Request' },
      { from: 'lb', to: 'svc', label: 'Route Request' },
      { from: 'svc', to: 'redis', label: '1. ZINCRBY / ZREVRANGE' },
      { from: 'svc', to: 'kafka', label: '2. Async Persistence Event' },
      { from: 'kafka', to: 'db', label: '3. Write to Storage' }
    ]
  }
};
