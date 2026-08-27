import { SystemDesignTopic } from '../../types/systemDesign';

export const flashSaleTopic: SystemDesignTopic = {
  id: 'flash-sale',
  title: 'Flash Sale System',
  subtitle: 'High-Concurrency Inventory De-stocking & Rate Limiting',
  category: 'Distributed Systems',
  difficulty: 'Hard',
  frequencyRank: 26,
  editorial: {
    companies: ['Alibaba (Single\'s Day)', 'Xiaomi', 'Amazon (Prime Day)', 'Flipkart (Big Billion Days)', 'Shopee'],
    overview: 'Design a high-concurrency Flash Sale e-commerce system capable of selling out limited inventory items (e.g. 10,000 iPhones) to millions of concurrent buyers within seconds without inventory overselling or database crashes.',
    introduction: `Flash sale events (e.g. Alibaba Single's Day) generate extreme traffic spikes. Millions of users click "Buy Now" at the exact same second (e.g. 12:00:00 AM).

Key design challenges include overselling prevention (inventory consistency), static content CDN caching, virtual queuing (traffic shedding), rate limiting (anti-bot protection), and atomic in-memory inventory decrementing.`,
    requirements: {
      functional: [
        'Display flash sale product countdown timer and real-time remaining stock count.',
        'Users can click "Buy Now" to attempt securing a flash sale item.',
        'Create temporary 15-minute order reservation hold.',
        'Process payment and finalize order confirmation.'
      ],
      nonFunctional: [
        'ZERO Overselling: Under no circumstances can total sold items exceed available stock (e.g. strictly max 10,000 units).',
        'Extreme Traffic Absorption: Handle 1 Million requests per second (RPS) peak burst.',
        'High availability: System must not crash under 100x traffic spike.',
        'Low latency checkout response (< 200ms).'
      ],
      outOfScope: ['Physical warehouse packaging box assembly']
    },
    keyQuestions: {
      assumptions: [
        '10,000 Flash Sale Units available',
        '1 Million users clicking "Buy Now" within 5 seconds of sale start',
        'Peak traffic QPS: 500,000 QPS'
      ],
      calculations: [
        { label: 'Inventory Reservation RAM', value: '5 MB RAM', desc: 'Lua script atomic counter in Redis' },
        { label: 'Traffic Drop Rate (Virtual Queue)', value: '99%', desc: 'Rejecting 990,000 requests immediately after 10,000 stock is claimed' },
        { label: 'CDN Offload Ratio', value: '99.5%', desc: 'Static HTML/CSS/Images served 100% from CDN edge' }
      ]
    },
    dataModel: {
      overview: 'Redis In-Memory Atomic Decr Counter + PostgreSQL Order Database.',
      entities: [
        {
          name: 'flash_sale_inventory',
          description: 'Flash sale item stock counter.',
          fields: [
            { name: 'item_id', type: 'BIGINT PRIMARY KEY', desc: 'Item ID' },
            { name: 'total_stock', type: 'INT', desc: 'Initial stock (e.g. 10,000)' },
            { name: 'available_stock', type: 'INT', desc: 'Remaining available stock' },
            { name: 'sale_start_time', type: 'TIMESTAMP', desc: 'Sale start timestamp' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'REST API protected by Rate Limiter & Token Bucket filters.',
      endpoints: [
        {
          method: 'POST',
          path: '/v1/flash-sale/orders',
          params: '{ "itemId": 101, "captchaToken": "tok_xyz" }',
          statusCode: '200 OK / 410 Gone (Sold Out)',
          description: 'Attempts atomic flash sale stock deduction.'
        }
      ]
    },
    basicImplementation: {
      title: 'Direct SQL Database UPDATE',
      description: 'Executes `UPDATE inventory SET stock = stock - 1 WHERE item_id = 101 AND stock > 0`.',
      drawbacks: [
        'Database row lock bottleneck: 500,000 concurrent SQL connections trying to update the exact same database row causes instant connection pool starvation and database crash.',
        'High latency (> 10 seconds) for users.'
      ]
    },
    advancedImplementation: {
      title: 'CDN Static Decoupling + Redis Lua Script Pre-Deduction + Token Bucket Gatekeeper + Async Order Queue',
      description: `1. CDN Static Decoupling:
   - Product details, images, and countdown timer JavaScript are cached 100% at CDN edge locations. Zero backend server hits for page loads!

2. Rate Limiting & CAPTCHA:
   - Dynamic Buy Button: "Buy Now" API URL contains a random secret token generated at sale start to prevent automated bot scripts from pre-submitting requests.
   - Interactive CAPTCHA puzzle filters out automated bot networks.

3. Atomic Redis In-Memory Pre-Deduction (Lua Script):
   - Pre-load flash sale stock count into Redis: \`SET flash_stock:101 10000\`.
   - Incoming request executes atomic Redis Lua Script:
     \`\`\`lua
     local stock = redis.call('get', KEYS[1])
     if tonumber(stock) > 0 then
         redis.call('decr', KEYS[1])
         return 1 -- Success
     else
         return 0 -- Sold Out
     end
     \`\`\`
   - Runs in < 1ms in RAM! Once stock hits 0, subsequent 990,000 incoming requests are rejected immediately at gateway without touching database!

4. Async Order Queue (Kafka):
   - The 10,000 successful users receive a reservation token and their order creation tasks are pushed to Kafka. Database processes 10,000 order creation inserts smoothly at 500 QPS.`,
      components: [
        { name: 'CDN Edge Network', role: 'Static Asset Shield', details: 'Serves static HTML/JS countdown page.' },
        { name: 'Gateway Token Bucket', role: 'Rate Limiter & Bot Filter', details: 'Filters out automated bot traffic.' },
        { name: 'Redis Stock Cache (Lua)', role: 'Atomic Pre-Deduction Engine', details: 'Decrements stock in RAM in < 1ms; drops traffic when 0.' },
        { name: 'Kafka Order Queue', role: 'Async Order Bus', details: 'Buffers 10,000 order creation tasks for DB.' },
        { name: 'MySQL DB Cluster', role: 'Order Persistence', details: 'Stores permanent paid order records.' }
      ]
    },
    flows: [
      {
        title: 'Flash Sale Purchase Flow',
        description: 'Executing a flash sale buy request.',
        steps: [
          'Sale Starts at 12:00:00 AM. User solves CAPTCHA and clicks "Buy Now".',
          'API Gateway validates CAPTCHA token and user session.',
          'Gateway executes atomic Redis Lua script `DECR flash_stock:101`.',
          'If Redis returned 1 (Stock Available): Push order creation message to Kafka. Return HTTP 200 `{ status: "RESERVED", token: "order_tok" }`.',
          'If Redis returned 0 (Sold Out): Return HTTP 410 Sold Out immediately (< 5ms response time).',
          'Kafka Order Worker consumes message and inserts order into MySQL DB.',
          'User completes credit card payment within 15-minute hold window.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Handling Unpaid Stock Auto-Recovery', details: 'If a user reserves stock in Redis but fails to pay within 15 minutes, a background cleanup worker executes Redis \`INCR flash_stock:101\` to return the unit back to the available pool.' },
      { topic: 'Dynamic Gateway URL Hashing', details: 'Hide the purchase endpoint URL until sale start time (e.g. \`/api/buy/\${MD5(item_id + sale_secret)}\`) so malicious users cannot reverse engineer API requests.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'How does an atomic Redis Lua Script eliminate database row lock bottlenecks during a 500,000 QPS flash sale launch?',
      options: [
        'By decrementing the item stock in RAM in < 1ms; once stock hits 0, all remaining 990,000 incoming requests are rejected immediately at gateway without touching the database',
        'By storing orders on user phone RAM',
        'By turning off the database',
        'By doubling product price'
      ],
      correctAnswerIndex: 0,
      explanation: 'Executing atomic stock decrementing in Redis RAM filters out 99% of excess traffic in milliseconds, ensuring only the exact available stock count ever reaches the persistent database.'
    },
    {
      id: 'q2',
      question: 'Why hide the Flash Sale purchase API endpoint URL behind a dynamic hash generated at sale start time?',
      options: [
        'To prevent malicious bot scripts from pre-submitting automated purchase API calls before the sale officially opens',
        'To make the website URL look pretty',
        'To hide product prices',
        'To encrypt user passwords'
      ],
      correctAnswerIndex: 0,
      explanation: 'Dynamic URL hashing prevents automated scripts from guessing or hardcoding the purchase endpoint ahead of time.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'client', label: 'Flash Sale App Client', type: 'client', description: 'Clicks "Buy Now" at 12:00:00 AM', x: 40, y: 160 },
      { id: 'cdn', label: 'CDN Edge Shield', type: 'cdn', description: 'Serves static HTML/JS countdown page (99.5% offload)', x: 220, y: 80 },
      { id: 'gw', label: 'API Gateway & CAPTCHA', type: 'lb', description: 'Filters bot scripts & checks rate limits', x: 220, y: 240 },
      { id: 'redis', label: 'Redis Stock Cache (Lua Script)', type: 'cache', description: 'Atomic DECR in < 1ms (Rejects when stock == 0)', x: 480, y: 240 },
      { id: 'kafka', label: 'Kafka Order Queue', type: 'queue', description: 'Buffers 10,000 order tasks for DB', x: 700, y: 240 },
      { id: 'db', label: 'MySQL Primary DB', type: 'db', description: 'Persists order records smoothly', x: 900, y: 240 }
    ],
    connections: [
      { from: 'client', to: 'cdn', label: 'Load Page' },
      { from: 'client', to: 'gw', label: 'POST /flash-sale/orders' },
      { from: 'gw', to: 'redis', label: '1. Atomic Lua DECR' },
      { from: 'redis', to: 'gw', label: '2. If Stock > 0 (Success)' },
      { from: 'gw', to: 'kafka', label: '3. Push Order Task' },
      { from: 'kafka', to: 'db', label: '4. Write Order to DB' }
    ]
  }
};
