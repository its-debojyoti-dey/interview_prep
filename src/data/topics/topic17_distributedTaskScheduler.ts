import { SystemDesignTopic } from '../../types/systemDesign';

export const distributedTaskSchedulerTopic: SystemDesignTopic = {
  id: 'distributed-task-scheduler',
  title: 'Distributed Task Scheduler',
  subtitle: 'Job Queue, Cron Engine & Distributed Execution',
  category: 'Infrastructure & Security',
  difficulty: 'Hard',
  frequencyRank: 17,
  editorial: {
    companies: ['Google', 'Airbnb (Airflow)', 'Uber (Cadence/Temporal)', 'Amazon', 'Meta'],
    overview: 'Design a distributed background task scheduling platform capable of executing billions of one-time and recurring cron jobs reliably with strict SLA guarantees.',
    introduction: `Distributed Task Schedulers power background batch processing, automated emails, periodic report generation, data pipelines, and scheduled system maintenance.

Key engineering requirements include high timer accuracy, exactly-once or at-least-once execution guarantees, worker task-stealing, and handling worker node crashes gracefully.`,
    requirements: {
      functional: [
        'Schedule tasks for future execution at a specific timestamp (e.g. run at 2026-12-31 23:59:59).',
        'Support recurring cron schedules (e.g. run every 5 minutes: `*/5 * * * *`).',
        'Execute distributed tasks across a pool of dynamic worker nodes.',
        'Track task status (SCHEDULED, RUNNING, COMPLETED, FAILED, RETRYING).'
      ],
      nonFunctional: [
        'High availability and zero lost tasks.',
        'High precision timing (< 1-second delay from target schedule time).',
        'Scalable to execute 1 Billion background tasks per day (~10,000 tasks/sec).',
        'Fault tolerance: Automatic re-execution of failed tasks on healthy worker nodes.'
      ],
      outOfScope: ['Manual CPU assembly debugging']
    },
    keyQuestions: {
      assumptions: [
        '1 Billion tasks scheduled per day',
        '10,000 tasks executed per second average (50,000 peak QPS)',
        'Task execution duration ranges from 100ms to 30 minutes'
      ],
      calculations: [
        { label: 'Timer Scan Precision', value: '1 Second Window', desc: 'Time wheel or delayed queue polls active timers every second' },
        { label: 'Storage size per task record', value: '500 Bytes', desc: 'Task payload parameters & metadata' },
        { label: 'Daily Task Metadata Storage', value: '500 GB / day', desc: '1 Billion tasks * 500 bytes' }
      ]
    },
    dataModel: {
      overview: 'Time-partitioned datastore (Cassandra / PostgreSQL) combined with Redis Delayed Queue / Hierarchical Timing Wheel.',
      entities: [
        {
          name: 'scheduled_tasks',
          description: 'Task schedule registry table.',
          fields: [
            { name: 'task_id', type: 'UUID PRIMARY KEY', desc: 'Unique task ID' },
            { name: 'task_type', type: 'VARCHAR(64)', desc: 'EMAIL_SEND | REPORT_GEN | CLEANUP' },
            { name: 'payload', type: 'JSONB', desc: 'Execution parameter arguments' },
            { name: 'scheduled_at', type: 'TIMESTAMP INDEX', desc: 'Target execution timestamp' },
            { name: 'cron_expression', type: 'VARCHAR(32)', desc: 'Cron rule string (nullable)' },
            { name: 'status', type: 'VARCHAR(16)', desc: 'SCHEDULED | RUNNING | COMPLETED | FAILED' },
            { name: 'retry_count', type: 'INT', desc: 'Attempt count' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'gRPC or REST API for submitting scheduled jobs.',
      endpoints: [
        {
          method: 'POST',
          path: '/v1/tasks/schedule',
          params: '{ "taskType": "EMAIL_SEND", "payload": { "to": "user@example.com" }, "scheduledAt": "2026-08-28T10:00:00Z" }',
          statusCode: '201 Created',
          description: 'Schedules background job for delayed execution.'
        }
      ]
    },
    basicImplementation: {
      title: 'Database Polling Loop',
      description: 'Single thread running `SELECT * FROM tasks WHERE scheduled_at <= NOW() AND status = "SCHEDULED"` every second on a SQL database.',
      drawbacks: [
        'Massive SQL table scan bottleneck when table contains millions of future tasks.',
        'Single point of failure and race conditions if multiple scheduler nodes poll the database simultaneously.'
      ]
    },
    advancedImplementation: {
      title: 'Hierarchical Timing Wheel / Redis Sorted Set + Distributed Worker Pool (Kafka / RabbitMQ)',
      description: `1. Hierarchical Timing Wheel / Redis ZSET Scheduler:
   - Schedule future tasks in Redis Sorted Set: \`ZADD scheduled_tasks <timestamp> <task_id>\`.
   - Poller Workers query \`ZRANGEBYSCORE scheduled_tasks 0 <current_timestamp>\` every second.
   - Using Redis Lua script guarantees atomic retrieval and popping of ready tasks.

2. Decoupled Execution Queue (Kafka / RabbitMQ):
   - When a task reaches its scheduled execution time, the Poller moves the task payload into a Kafka execution topic.

3. Distributed Worker Pool & Heartbeats:
   - Worker nodes pull task execution jobs from Kafka.
   - Workers update Redis heartbeat key (\`task:123:heartbeat\`) every 10s during long execution.
   - If a worker node crashes mid-execution, the Heartbeat Monitor detects missing pings and re-enqueues the task for another worker!`,
      components: [
        { name: 'Scheduler API', role: 'Task Producer', details: 'Accepts new scheduled tasks & writes to DB.' },
        { name: 'Redis Sorted Set (ZSET)', role: 'Delay Timer Index', details: 'Holds tasks ordered by execution epoch timestamp.' },
        { name: 'Poller Service (Leader Election)', role: 'Timer Scanner', details: 'Scans ZSET every second & pops ready tasks to Kafka.' },
        { name: 'Execution Queue (Kafka)', role: 'Work Queue Bus', details: 'Buffers tasks ready for immediate execution.' },
        { name: 'Worker Nodes', role: 'Task Executors', details: 'Executes actual business logic & reports task status.' }
      ]
    },
    flows: [
      {
        title: 'Task Scheduling & Execution Flow',
        description: 'Submitting and executing a delayed task.',
        steps: [
          'Client calls POST /v1/tasks/schedule with target execution timestamp (e.g. Epoch 1787827200).',
          'API writes record to PostgreSQL DB and adds to Redis ZSET `ZADD scheduled_tasks 1787827200 task_123`.',
          'Poller Service runs `ZRANGEBYSCORE scheduled_tasks 0 <now>` every 1s.',
          'Pops `task_123` from Redis and publishes task to Kafka topic `execute-tasks`.',
          'Available Worker Node consumes task from Kafka, updates status = RUNNING.',
          'Worker completes business logic, updates status = COMPLETED.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Hierarchical Timing Wheel Algorithm', details: 'Timing Wheels (Hashed and Hierarchical) organize timers into memory slots (Hours -> Minutes -> Seconds) like a clock dial, achieving O(1) insertion and O(1) timer expiry processing.' },
      { topic: 'Exactly-Once vs At-Least-Once Delivery', details: 'Network partitions make strict exactly-once execution impossible in distributed environments. Systems enforce At-Least-Once execution combined with Idempotent Task Handlers.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'Which data structure allows adding delayed tasks at arbitrary timestamps and popping expired tasks efficiently in O(log N) time?',
      options: [
        'Redis Sorted Set (ZSET) indexed by epoch timestamp',
        'Basic FIFO Queue',
        'Unsorted Array',
        'HTML Table'
      ],
      correctAnswerIndex: 0,
      explanation: 'Redis Sorted Sets order elements by score (epoch timestamp), allowing `ZRANGEBYSCORE 0 current_time` queries to instantly find all tasks ready for execution.'
    },
    {
      id: 'q2',
      question: 'How does a distributed task scheduler handle a worker node crashing in the middle of executing a 10-minute task?',
      options: [
        'Worker nodes send periodic heartbeats to Redis; if heartbeats stop, a watchdog service re-assigns the task to another healthy worker',
        'The task is lost forever',
        'The entire system shuts down',
        'The user receives a phone call'
      ],
      correctAnswerIndex: 0,
      explanation: 'Heartbeat monitoring detects worker node crashes. When a heartbeat times out, the task coordinator resets task state and re-enqueues it for another worker node.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'client', label: 'App Client', type: 'client', description: 'Submits delayed task schedule', x: 40, y: 160 },
      { id: 'api', label: 'Scheduler API', type: 'service', description: 'Persists task to DB & Redis', x: 220, y: 160 },
      { id: 'zset', label: 'Redis ZSET Delay Index', type: 'cache', description: 'Orders tasks by scheduled epoch timestamp', x: 440, y: 80 },
      { id: 'poller', label: 'Poller Service (Timer)', type: 'service', description: 'Scans ZSET every 1s & pops ready tasks', x: 440, y: 240 },
      { id: 'kafka', label: 'Kafka Work Queue', type: 'queue', description: 'Buffers ready execution tasks', x: 660, y: 240 },
      { id: 'workers', label: 'Worker Node Cluster', type: 'service', description: 'Executes tasks & sends heartbeats', x: 860, y: 240 }
    ],
    connections: [
      { from: 'client', to: 'api', label: 'POST /tasks/schedule' },
      { from: 'api', to: 'zset', label: '1. ZADD timestamp task_id' },
      { from: 'poller', to: 'zset', label: '2. ZRANGEBYSCORE 0 <now>' },
      { from: 'poller', to: 'kafka', label: '3. Push Ready Tasks' },
      { from: 'kafka', to: 'workers', label: '4. Consume & Execute' }
    ]
  }
};
