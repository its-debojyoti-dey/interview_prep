import { SystemDesignTopic } from '../../types/systemDesign';

export const distributedCacheTopic: SystemDesignTopic = {
  id: 'distributed-cache',
  title: 'Distributed Cache',
  subtitle: 'Consistent Hashing, Eviction Policies & High Throughput In-Memory DB',
  category: 'Infrastructure & Security',
  difficulty: 'Hard',
  frequencyRank: 29,
  editorial: {
    companies: ['Redis Labs', 'Memcached', 'Amazon (ElastiCache)', 'Meta', 'Google'],
    overview: 'Design a high-performance Distributed In-Memory Cache system (e.g. Redis Cluster / Memcached) supporting sub-millisecond key-value lookups, consistent hashing sharding, cache eviction policies (LRU/LFU), and cache invalidation strategies.',
    introduction: `Distributed in-memory caches sit between application servers and persistent databases to offload read traffic and reduce API query latencies from hundreds of milliseconds to sub-milliseconds.

Key system design topics include Consistent Hashing with Virtual Nodes, Eviction Policies (LRU, LFU, TTL), Caching Strategies (Cache-Aside, Write-Through, Write-Behind), Cache Stampede (Thundering Herd) mitigation, and Redis Sentinel high availability.`,
    requirements: {
      functional: [
        'Store key-value pairs in memory (`SET key value ex 3600`).',
        'Retrieve key-value pairs with sub-millisecond latency (`GET key`).',
        'Support key TTL expiration and automatic memory eviction (LRU / LFU).',
        'Horizontally scale cache memory capacity by sharding keys across cluster nodes.'
      ],
      nonFunctional: [
        'Ultra-low latency: Sub-1 millisecond GET/SET response times.',
        'High Throughput: Process 1 Million requests per second per node.',
        'High availability and zero downtime during node additions/failures.',
        'Resilience against Cache Stampede and Cache Penetration attacks.'
      ],
      outOfScope: ['Floppy disk magnetic tape storage']
    },
    keyQuestions: {
      assumptions: [
        '10 Terabytes total cached data RAM size',
        '10 Million Requests Per Second (RPS) read/write traffic across cluster',
        'Average key size = 32 bytes; average value size = 2 KB'
      ],
      calculations: [
        { label: 'Total Cache Nodes', value: '160 Nodes', desc: '10 TB / 64 GB RAM per cache node' },
        { label: 'Cluster Bandwidth', value: '20 Gbps', desc: '10M RPS * 2 KB payload / 86400 seconds' },
        { label: 'Lookup Complexity', value: 'O(1) Time', desc: 'In-memory Hash Table lookup' }
      ]
    },
    dataModel: {
      overview: 'In-Memory Dict Hash Table + Doubly Linked List (LRU) + Min-Heap / TTL Hash Table.',
      entities: [
        {
          name: 'cache_entry',
          description: 'In-memory key-value dictionary node.',
          fields: [
            { name: 'key', type: 'VARCHAR(256)', desc: 'Cache key string' },
            { name: 'value', type: 'BYTES', desc: 'Serialized payload bytes' },
            { name: 'expires_at', type: 'INT64', desc: 'Epoch timestamp expiration (TTL)' },
            { name: 'prev_lru', type: 'PTR', desc: 'Pointer to previous node in LRU list' },
            { name: 'next_lru', type: 'PTR', desc: 'Pointer to next node in LRU list' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'Low-latency RESP (REdis Serialization Protocol) binary TCP protocol.',
      endpoints: [
        {
          method: 'POST',
          path: 'tcp://redis-cluster:6379 (RESP Protocol)',
          params: 'Command: SET user:123:profile "{...}" EX 3600',
          statusCode: '+OK',
          description: 'Sets key-value pair with 1-hour TTL.'
        },
        {
          method: 'GET',
          path: 'tcp://redis-cluster:6379 (RESP Protocol)',
          params: 'Command: GET user:123:profile',
          statusCode: '$142\r\n{...}\r\n',
          description: 'Fetches cached value payload in < 1ms.'
        }
      ]
    },
    basicImplementation: {
      title: 'Modulo Hash Sharding (`hash(key) % N`)',
      description: 'Routes keys to N cache servers using simple modulo math: `server_index = hash(key) % server_count`.',
      drawbacks: [
        'Catastrophic Cache Invalidations: Adding or removing a single cache node changes `server_count` from N to N+1, causing `hash(key) % N` to remap 99% of all keys to wrong servers, flushing the entire cache and crashing the underlying database (Cache Avalanche)!'
      ]
    },
    advancedImplementation: {
      title: 'Consistent Hashing with Virtual Nodes + LRU Eviction + Cache-Aside Pattern + Probabilistic Early Expiration',
      description: `1. Consistent Hashing with Virtual Nodes:
   - Maps both Cache Nodes and Keys to a 360-degree Hash Ring (\`0 to 2^32 - 1\`).
   - Keys are assigned to the first Cache Node encountered moving clockwise on the ring.
   - Virtual Nodes (100-200 vnodes per physical server) distribute keys uniformly across physical servers and prevent hot-spot skew.
   - Adding or removing a server remaps only \`1/N\` of keys, preserving 95%+ of cache state!

2. LRU Eviction Policy (Least Recently Used):
   - Combines a Hash Map (O(1) lookup) with a Doubly Linked List (O(1) eviction).
   - When RAM limit is reached, the node at the tail of the LRU linked list is evicted.

3. Mitigating Cache Stampede (Thundering Herd):
   - Use Mutex Lock (Redlock) or Probabilistic Early Expiration (XFetch algorithm) so only ONE worker thread recomputes an expired hot cache key while other requests serve stale cache data safely.`,
      components: [
        { name: 'Client Cache Library', role: 'Consistent Hash Router', details: 'Hashes keys to Virtual Nodes on Hash Ring.' },
        { name: 'Redis Node Cluster', role: 'In-Memory Key-Value Store', details: 'Executes O(1) in-memory GET/SET operations.' },
        { name: 'LRU Eviction Engine', role: 'Memory Governor', details: 'Evicts least recently used items when RAM fills.' },
        { name: 'Redis Sentinel / Cluster Bus', role: 'Failover Coordinator', details: 'Detects master node failure & promotes replicas.' },
        { name: 'Database Origin', role: 'Persistent System of Record', details: 'Source of truth database on cache miss.' }
      ]
    },
    flows: [
      {
        title: 'Cache-Aside Query Flow',
        description: 'Reading data through cache.',
        steps: [
          'Client calls `GET user:123:profile`.',
          'Client SDK hashes key `user:123:profile` using MD5/Murmur3.',
          'Locates target server on Consistent Hash Ring (e.g. Node 4).',
          'Sends GET command to Node 4 over TCP.',
          'If Cache Hit: Node 4 updates LRU linked list position to Head, returns value in < 1ms.',
          'If Cache Miss: Client queries PostgreSQL DB, populates Redis via `SET user:123:profile value EX 3600`, and returns result.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Caching Strategies Comparison', details: '1. Cache-Aside (App reads/writes cache directly - most common). 2. Write-Through (App writes to cache; cache synchronously writes to DB). 3. Write-Behind / Write-Back (Cache buffers writes & flushes asynchronously to DB for maximum write speed).' },
      { topic: 'Cache Avalanche Defense', details: 'Add random jitter (+/- 300 seconds) to TTL expiration times so millions of cached keys do not expire simultaneously at the exact same second.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'Why is Consistent Hashing with Virtual Nodes superior to Modulo Hashing (`hash(key) % N`) for distributed caching?',
      options: [
        'When a cache node is added or removed, Consistent Hashing remaps only 1/N of the keys, whereas Modulo Hashing invalidates 99% of all cached keys',
        'Consistent Hashing converts numbers to text',
        'Modulo Hashing is not supported in C++',
        'Consistent Hashing deletes all keys every 5 minutes'
      ],
      correctAnswerIndex: 0,
      explanation: 'Consistent Hashing minimizes key remapping when scaling cluster size up or down, preserving cache hit rates and protecting backend databases from crashing under traffic surges.'
    },
    {
      id: 'q2',
      question: 'How do you prevent a "Cache Avalanche" when thousands of cached database keys are set to expire at the same time?',
      options: [
        'Add a random TTL jitter (e.g. 3600 seconds +/- random 300s) to stagger expiration times',
        'Disable cache TTL expiration completely',
        'Restart all cache nodes simultaneously',
        'Increase database CPU count'
      ],
      correctAnswerIndex: 0,
      explanation: 'Adding random time jitter to TTLs spreads out key expirations over time, preventing sudden massive cache miss spikes on the underlying database.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'client', label: 'Application Microservice', type: 'client', description: 'Checks cache before querying database', x: 40, y: 160 },
      { id: 'ring', label: 'Consistent Hash Ring', type: 'lb', description: 'Maps key hash to Virtual Nodes on 360 ring', x: 260, y: 160 },
      { id: 'nodeA', label: 'Redis Server Node 1', type: 'cache', description: 'In-memory LRU Hash Table (RAM)', x: 500, y: 80 },
      { id: 'nodeB', label: 'Redis Server Node 2', type: 'cache', description: 'In-memory LRU Hash Table (RAM)', x: 500, y: 240 },
      { id: 'sentinel', label: 'Redis Sentinel / Failover', type: 'service', description: 'Monitors node health & promotes replicas', x: 740, y: 80 },
      { id: 'db', label: 'PostgreSQL Primary DB', type: 'db', description: 'Source of truth database on cache miss', x: 740, y: 240 }
    ],
    connections: [
      { from: 'client', to: 'ring', label: '1. GET key' },
      { from: 'ring', to: 'nodeA', label: '2. Route to Node 1' },
      { from: 'client', to: 'db', label: '3. On Miss: Query DB' },
      { from: 'client', to: 'nodeA', label: '4. SET key value EX 3600' },
      { from: 'sentinel', to: 'nodeA', label: 'Health Heartbeat' }
    ]
  }
};
