import { SystemDesignTopic } from '../../types/systemDesign';

export const distributedQueueTopic: SystemDesignTopic = {
  id: 'distributed-message-queue',
  title: 'Distributed Message Queue',
  subtitle: 'Partitioned Append-Only Log & High-Throughput Streaming',
  category: 'Infrastructure & Security',
  difficulty: 'Hard',
  frequencyRank: 28,
  editorial: {
    companies: ['LinkedIn (Apache Kafka)', 'RabbitMQ', 'Amazon (SQS / Kinesis)', 'Apache Pulsar'],
    overview: 'Design a high-throughput, distributed append-only log message queue system supporting producer publishing, consumer group subscriptions, message partitioning, zero-copy data transfer, and fault-tolerant log replication.',
    introduction: `Distributed message queues like Apache Kafka and RabbitMQ form the event-driven backbone of modern microservice architectures.

Key system design topics include partitioned append-only disk commit logs, Zero-Copy OS I/O (\`sendfile\`), consumer group offset management, leader-follower partition replication (ISR), and message delivery semantics.`,
    requirements: {
      functional: [
        'Producers can publish messages to named Topics partitioned by key.',
        'Consumer Groups can subscribe to Topics and consume messages in order per partition.',
        'Consumers track their read position using committed Offsets.',
        'Configurable message retention policy (e.g. retain log segments for 7 days).'
      ],
      nonFunctional: [
        'High Throughput: Process 2 Million messages per second (2 GB/s bandwidth).',
        'Low Latency: Sub-10ms pub-to-sub delivery.',
        'High Availability & Durability: Replicate partitions across 3 brokers (ISR - In-Sync Replicas).',
        'Message Ordering Guarantee: Strict message order maintained per partition.'
      ],
      outOfScope: ['Physical telegraph MORSE code translation']
    },
    keyQuestions: {
      assumptions: [
        '10 Billion messages published per day',
        'Average message payload size = 1 KB',
        '2 Million messages/sec peak write throughput'
      ],
      calculations: [
        { label: 'Write Throughput', value: '2 GB / sec', desc: '2M messages/sec * 1 KB payload' },
        { label: 'Daily Disk Log Storage', value: '10 TB / day', desc: '10B messages * 1 KB (before 3x replication)' },
        { label: 'Replicated Storage (3x)', value: '30 TB / day', desc: '10 TB * 3 in-sync replicas' }
      ]
    },
    dataModel: {
      overview: 'Append-Only Commit Log Segments on Disk + Index File mapping Message Offsets to File Byte Positions.',
      entities: [
        {
          name: 'log_segment',
          description: 'Disk commit log segment file (e.g. `00000000000.log`).',
          fields: [
            { name: 'offset', type: 'INT64', desc: 'Monotonically increasing 64-bit log index position' },
            { name: 'timestamp', type: 'INT64', desc: 'Unix epoch timestamp' },
            { name: 'key', type: 'BYTES', desc: 'Partition routing key' },
            { name: 'value', type: 'BYTES', desc: 'Message payload binary bytes' }
          ]
        },
        {
          name: 'index_segment',
          description: 'Memory-mapped sparse index file (e.g. `00000000000.index`).',
          fields: [
            { name: 'relative_offset', type: 'INT32', desc: 'Relative offset offset difference' },
            { name: 'physical_position', type: 'INT32', desc: 'Byte position in `.log` segment file' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'Low-level TCP binary wire protocol.',
      endpoints: [
        {
          method: 'POST',
          path: 'tcp://broker:9092 (Produce API)',
          params: 'ProduceRequest: { topic: "orders", partition: 2, messages: [{ key: "k1", value: "bytes" }] }',
          statusCode: 'ProduceResponse: { error_code: 0, base_offset: 1052 }',
          description: 'Publishes batch of messages to partition commit log.'
        },
        {
          method: 'GET',
          path: 'tcp://broker:9092 (Fetch API)',
          params: 'FetchRequest: { topic: "orders", partition: 2, fetch_offset: 1000, max_bytes: 1048576 }',
          statusCode: 'FetchResponse: { messages: [...] }',
          description: 'Fetches message batch from commit log using Zero-Copy.'
        }
      ]
    },
    basicImplementation: {
      title: 'Relational Database Message Table',
      description: 'Stores messages in SQL table `messages(id, topic, payload, is_consumed)`. Consumers poll `SELECT * FROM messages WHERE is_consumed = false`.',
      drawbacks: [
        'Database crashes under 2 Million INSERT/UPDATE operations per second.',
        'Random disk I/O degrades throughput dramatically.',
        'Lock contention on `is_consumed` flags.'
      ]
    },
    advancedImplementation: {
      title: 'Append-Only Sequential Disk Log + Zero-Copy OS `sendfile` + ISR Replication + KRaft / ZooKeeper Coordinator',
      description: `1. Sequential Disk I/O & Append-Only Log:
   - Sequential disk access is 100x faster than random disk access (comparable to RAM speed!).
   - Messages are appended strictly to the end of segment files (\`.log\`).
   - A Sparse Index file (\`.index\`) maps relative offsets to byte positions for binary search lookup.

2. OS Zero-Copy Optimization (\`sendfile\` Syscall):
   - Traditional data transfer copies data 4 times between OS Kernel Page Cache and User Application RAM.
   - Zero-Copy (\`sendfile\`) transfers data directly from OS Page Cache to Network NIC Buffer via DMA (Direct Memory Access), eliminating CPU memory copy overhead and doubling read throughput!

3. Partition Sharding & ISR Replication:
   - Topics are split into multiple Partitions.
   - Each Partition has 1 Leader Broker and N Follower Brokers (ISR - In-Sync Replicas).
   - KRaft / ZooKeeper manages leader election if a broker node fails.`,
      components: [
        { name: 'Producer SDK', role: 'Message Batcher', details: 'Batches messages & hashes keys to partition IDs.' },
        { name: 'Broker Partition Leader', role: 'Log Appender', details: 'Appends messages sequentially to `.log` file.' },
        { name: 'Zero-Copy OS PageCache', role: 'Read Transfer Engine', details: 'Uses `sendfile` syscall to stream log segments to Consumers.' },
        { name: 'In-Sync Replicas (ISR)', role: 'Log Replication', details: 'Follower brokers fetch & replicate leader commit log.' },
        { name: 'KRaft Controller / ZooKeeper', role: 'Metadata Manager', details: 'Coordinates cluster state & leader elections.' }
      ]
    },
    flows: [
      {
        title: 'Produce & Consume Message Flow',
        description: 'End-to-end event streaming cycle.',
        steps: [
          'Producer hashes message key `order_123` to calculate Partition 2.',
          'Producer sends ProduceRequest batch to Broker Leader of Partition 2.',
          'Leader appends messages sequentially to current `.log` segment file on disk.',
          'Follower Brokers replicate log segment bytes to satisfy \`acks=all\` requirement.',
          'Leader returns Success response with Base Offset to Producer.',
          'Consumer Group sends FetchRequest for Partition 2 at Offset 1000.',
          'Broker uses OS `sendfile` Zero-Copy to transmit log bytes directly from Page Cache to Network NIC buffer.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Delivery Semantics', details: '1. At-Most-Once (Commit offset before processing, risk message loss). 2. At-Least-Once (Commit offset after processing, risk duplicates - most common). 3. Exactly-Once (Kafka Transactional Producer + Idempotent Consumer).' },
      { topic: 'Log Compaction', details: 'For key-value state topics, Kafka Log Compaction retains only the latest message payload for each key, discarding older overwritten values.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'How does Zero-Copy data transfer (`sendfile` system call) optimize message queue read performance?',
      options: [
        'It transfers bytes directly from OS PageCache to Network NIC buffer via DMA, avoiding copying data into application memory space',
        'It compresses files into ZIP format',
        'It deletes data after reading',
        'It bypasses hard drives entirely'
      ],
      correctAnswerIndex: 0,
      explanation: 'Zero-Copy avoids copying data from Kernel space to User Application memory space, allowing OS kernel DMA engines to stream disk bytes straight to network cards at max NIC speeds.'
    },
    {
      id: 'q2',
      question: 'Why is Sequential Disk I/O so much faster than Random Disk I/O in distributed log architectures like Kafka?',
      options: [
        'Sequential I/O avoids disk head seek overhead and leverages OS kernel aggressive read-ahead page caching',
        'Random I/O requires internet connections',
        'Sequential I/O encrypts disk drives',
        'Hard drives cannot perform random reads'
      ],
      correctAnswerIndex: 0,
      explanation: 'Sequential disk appends eliminate physical disk head seek delays and maximize OS kernel pre-fetching, achieving transfer rates comparable to RAM.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'prod', label: 'Producer Client', type: 'client', description: 'Batches messages & routes key to partition', x: 40, y: 160 },
      { id: 'leader', label: 'Broker Leader (Partition 2)', type: 'service', description: 'Appends sequential logs to `.log` file', x: 280, y: 160 },
      { id: 'disk', label: 'Append-Only Commit Log', type: 'storage', description: 'Sequential disk `.log` & `.index` files', x: 280, y: 320 },
      { id: 'follower', label: 'Broker Follower (ISR)', type: 'service', description: 'Replicates commit log for 3x durability', x: 520, y: 320 },
      { id: 'zeroCopy', label: 'OS Zero-Copy (`sendfile`)', type: 'cache', description: 'Transfers PageCache directly to NIC buffer', x: 520, y: 160 },
      { id: 'cons', label: 'Consumer Group Client', type: 'client', description: 'Consumes log stream & commits offsets', x: 760, y: 160 }
    ],
    connections: [
      { from: 'prod', to: 'leader', label: '1. ProduceRequest (acks=all)' },
      { from: 'leader', to: 'disk', label: '2. Sequential Append' },
      { from: 'leader', to: 'follower', label: '3. ISR Replication' },
      { from: 'leader', to: 'zeroCopy', label: '4. Read PageCache' },
      { from: 'zeroCopy', to: 'cons', label: '5. Zero-Copy Stream to Consumer' }
    ]
  }
};
