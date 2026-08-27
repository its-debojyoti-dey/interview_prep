import { SystemDesignTopic } from '../../types/systemDesign';

export const datingAppTopic: SystemDesignTopic = {
  id: 'dating-app',
  title: 'Dating App (Tinder)',
  subtitle: 'Geospatial Swiping, Mutual Match & Recommendation Engine',
  category: 'Distributed Systems',
  difficulty: 'Medium',
  frequencyRank: 18,
  editorial: {
    companies: ['Match Group (Tinder)', 'Bumble', 'Hinge', 'Meta'],
    overview: 'Design a location-based dating application supporting profile swiping (Like / Pass), instant mutual match detection, recommendation decks, and real-time chat initialization.',
    introduction: `Dating platforms like Tinder process billions of swipe actions daily. The system must quickly serve location-filtered recommendation decks, register swipes, and evaluate mutual matches instantaneously.

Key design problems involve high-volume swipe ingestion (write-heavy), double-blind match evaluation, spatial proximity filtering, and recommendation candidate ranking.`,
    requirements: {
      functional: [
        'User can view a recommendation deck of potential matches near their current location.',
        'User can swipe RIGHT (Like) or LEFT (Pass) on a candidate profile.',
        'Instant mutual match alert when User A and User B both swipe RIGHT on each other.',
        'Matched users can initiate 1-on-1 chat messaging.'
      ],
      nonFunctional: [
        'Ultra-fast swipe processing (< 50ms per swipe action).',
        'Instant mutual match notification (< 500ms).',
        'Scalable to 50 Million DAU and 2 Billion daily swipes.',
        'High availability and location privacy protections.'
      ],
      outOfScope: ['Automated AI photo rating advice']
    },
    keyQuestions: {
      assumptions: [
        '50 Million Daily Active Users (DAU)',
        'Average 40 swipes per user per day => 2 Billion swipes/day',
        'Mutual Match Rate: ~1.5% of positive swipes result in mutual match'
      ],
      calculations: [
        { label: 'Swipe Ingestion QPS', value: '23,000 QPS average (100,000 peak)', desc: '2 Billion swipes / 86400 seconds' },
        { label: 'Daily Swipe Data', value: '100 GB / day', desc: '2B swipes * 50 bytes tuple' },
        { label: 'Redis Match Cache RAM', value: '16 GB RAM', desc: 'In-memory Set storing positive swipes' }
      ]
    },
    dataModel: {
      overview: 'Fast In-Memory Key-Value store (Redis Sets) for swipe checks + NoSQL (Cassandra) for permanent swipe history.',
      entities: [
        {
          name: 'swipes',
          description: 'Swipe action recording table.',
          fields: [
            { name: 'user_id', type: 'BIGINT', desc: 'Swiping user ID (User A)' },
            { name: 'target_id', type: 'BIGINT', desc: 'Target candidate user ID (User B)' },
            { name: 'action', type: 'VARCHAR(8)', desc: 'LIKE | PASS | SUPERLIKE' },
            { name: 'created_at', type: 'TIMESTAMP', desc: 'Swipe timestamp' }
          ]
        },
        {
          name: 'matches',
          description: 'Confirmed mutual match record.',
          fields: [
            { name: 'match_id', type: 'UUID PRIMARY KEY', desc: 'Unique match ID' },
            { name: 'user1_id', type: 'BIGINT', desc: 'User 1 ID' },
            { name: 'user2_id', type: 'BIGINT', desc: 'User 2 ID' },
            { name: 'created_at', type: 'TIMESTAMP', desc: 'Match timestamp' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'REST API for deck fetching and swipe actions.',
      endpoints: [
        {
          method: 'GET',
          path: '/v1/deck/candidates',
          params: '?lat=37.7749&lng=-122.4194&radius_km=25&limit=20',
          statusCode: '200 OK',
          description: 'Fetches recommendation deck of candidate profiles.'
        },
        {
          method: 'POST',
          path: '/v1/swipes',
          params: '{ "targetUserId": 999, "action": "LIKE" }',
          statusCode: '200 OK',
          description: 'Records swipe action and returns `{ isMatch: boolean }`.'
        }
      ]
    },
    basicImplementation: {
      title: 'SQL Relational Queries with Join',
      description: 'Stores swipes in MySQL. When User A swipes right on User B, execute `SELECT * FROM swipes WHERE user_id = B AND target_id = A AND action = "LIKE"`.',
      drawbacks: [
        'High database CPU locks when querying millions of row pairs on every single swipe.',
        'High latency (> 300ms) causes UI stuttering during fast profile swiping.'
      ]
    },
    advancedImplementation: {
      title: 'Redis In-Memory Swipe Set + Asynchronous Match Worker + Pre-computed Recommendation Deck',
      description: `1. Fast Swipe Engine (Redis Set):
   - When User A likes User B, write to Redis Set \`user_A:likes\` -> add User B.
   - Instantly check if User A exists in Redis Set \`user_B:likes\` (\`SISMEMBER user_B:likes user_A\`).
   - If \`SISMEMBER\` returns TRUE -> IT IS A MUTUAL MATCH! Trigger Match Notification immediately!
   - This check runs in O(1) time taking < 2ms in RAM!

2. Pre-computed Candidate Recommendation Decks:
   - Generating candidate recommendations dynamically during swipe scrolling is too slow.
   - Recommendation Workers run in background: Query Geohash index for nearby active users, filter out already swiped profiles, rank by attractiveness score (Elo/ML rating), and push 50 candidate IDs into user Redis Recommendation Deck queue.`,
      components: [
        { name: 'Swipe Service API', role: 'Swipe Ingestion', details: 'Executes O(1) Redis set checks for mutual matches.' },
        { name: 'Redis Swipe Cache Cluster', role: 'In-memory Match Lookup', details: 'Stores active user likes sets.' },
        { name: 'Match Notification Service', role: 'Real-time Alert', details: 'Pushes WebSocket / Push alert "It\'s a Match!".' },
        { name: 'Recommendation Engine Worker', role: 'Deck Pre-computation', details: 'Pre-calculates candidate profile decks using spatial filters.' },
        { name: 'Cassandra DB', role: 'Permanent History Store', details: 'Asynchronously records all historical swipe records.' }
      ]
    },
    flows: [
      {
        title: 'Swipe & Match Check Flow',
        description: 'Processing a right swipe action.',
        steps: [
          'User A swipes RIGHT on User B (POST /v1/swipes).',
          'Swipe Service executes Redis `SADD user_A:likes user_B`.',
          'Swipe Service checks Redis `SISMEMBER user_B:likes user_A`.',
          'If Match Found (Returns True): Create match record in DB, publish event to WebSocket Push Service. Return `{ isMatch: true }` to both clients.',
          'If No Match (Returns False): Return `{ isMatch: false }`. Publish async swipe record event to Kafka for Cassandra storage.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Location Privacy Protection', details: 'Never expose raw exact (lat, long) coordinates of users in API responses. Obfuscate location by rounding to grid centers or adding random 500-meter noise.' },
      { topic: 'Recommendation Deck Refreshing', details: 'When user deck drops below 5 profiles, triggers background worker to generate next batch of 50 candidates.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'How does the system evaluate a mutual match (both users liked each other) in O(1) time under 2ms?',
      options: [
        'By using Redis Sets and running an O(1) SISMEMBER check on the target user\'s likes set',
        'By scanning a MySQL database table',
        'By calling a third-party API',
        'By asking users in a chat room'
      ],
      correctAnswerIndex: 0,
      explanation: 'Checking set membership in Redis (`SISMEMBER`) executes in O(1) time in memory, instantly determining if the other user had previously swiped right.'
    },
    {
      id: 'q2',
      question: 'Why are recommendation candidate decks pre-computed in background queues instead of generated on-the-fly during scrolling?',
      options: [
        'On-the-fly geospatial filtering and swipe history exclusion queries are too slow to keep up with fast profile swiping speeds',
        'Pre-computing saves phone battery',
        'Because Tinder requires 50 profiles minimum',
        'Dynamic search is disabled at night'
      ],
      correctAnswerIndex: 0,
      explanation: 'Pre-computing candidate decks ensures users enjoy zero-latency scrolling, while background workers handle heavy spatial filtering and recommendation scoring.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'client', label: 'Tinder Mobile App', type: 'client', description: 'Swipes profiles & views match alerts', x: 40, y: 160 },
      { id: 'api', label: 'Swipe Service API', type: 'service', description: 'Executes O(1) Redis match checks', x: 240, y: 160 },
      { id: 'redisLikes', label: 'Redis Swipe Cache', type: 'cache', description: 'Stores user likes sets (O(1) SISMEMBER)', x: 480, y: 80 },
      { id: 'push', label: 'Match Push Service', type: 'service', description: 'Pushes instant "It\'s a Match!" alert', x: 700, y: 80 },
      { id: 'recs', label: 'Recommendation Workers', type: 'service', description: 'Pre-calculates nearby candidate decks', x: 480, y: 240 },
      { id: 'db', label: 'Cassandra History DB', type: 'db', description: 'Stores permanent swipe & match records', x: 700, y: 240 }
    ],
    connections: [
      { from: 'client', to: 'api', label: 'POST /swipes (LIKE)' },
      { from: 'api', to: 'redisLikes', label: '1. SADD user_A & SISMEMBER user_B' },
      { from: 'api', to: 'push', label: '2. If Match: Trigger Alert' },
      { from: 'client', to: 'recs', label: 'Fetch Candidate Deck' },
      { from: 'api', to: 'db', label: 'Async Log History' }
    ]
  }
};
