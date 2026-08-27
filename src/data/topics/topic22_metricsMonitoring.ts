import { SystemDesignTopic } from '../../types/systemDesign';

export const metricsMonitoringTopic: SystemDesignTopic = {
  id: 'metrics-monitoring',
  title: 'Metrics Monitoring and Alerting (Datadog, Prometheus)',
  subtitle: 'Time-Series Metrics Ingestion, Pull vs Push & Alert Rules',
  category: 'Infrastructure & Security',
  difficulty: 'Hard',
  frequencyRank: 22,
  editorial: {
    companies: ['Datadog', 'Prometheus / Grafana', 'Amazon (CloudWatch)', 'Google', 'Meta'],
    overview: 'Design a distributed metrics collection, time-series storage, dashboard visualization, and automated alerting platform capable of ingesting millions of telemetry datapoints per second.',
    introduction: `Observability platforms collect system metrics (CPU utilization, memory usage, API error rates, network QPS) from thousands of microservices and servers.

Key architectural challenges include high-throughput time-series data ingestion (TSDB), push vs pull metric collection models, downsampling historical data, and real-time alert rule evaluation engines.`,
    requirements: {
      functional: [
        'Collect counter, gauge, and histogram metric datapoints from servers and microservices.',
        'Store metric data in time-series database optimized for time range queries.',
        'Visualize metrics via custom dashboard graphs (e.g. CPU % over past 2 hours).',
        'Trigger automated alerts (PagerDuty, Slack, Email) when metric thresholds are breached (e.g., Error Rate > 5% for 3 mins).'
      ],
      nonFunctional: [
        'High ingestion throughput: Handle 10 Million metric datapoints per second.',
        'Low query latency for dashboards (< 200ms).',
        'Data retention: Keep raw data for 7 days, downsampled data for 1 year.',
        'Fault tolerance: Metrics collector failures must not crash target application services.'
      ],
      outOfScope: ['Log file text parsing (Logstash/Splunk ELK)']
    },
    keyQuestions: {
      assumptions: [
        '10,000 Monitored Server Hosts / Microservices',
        'Each host emits 1,000 metrics every 10 seconds => 1 Million datapoints/sec (10M peak)',
        'Storage footprint per metric point = 16 bytes (Timestamp 8B + Value 8B)'
      ],
      calculations: [
        { label: 'Raw Ingestion Bandwidth', value: '160 MB / sec', desc: '10M datapoints/sec * 16 bytes' },
        { label: 'Raw Storage / day', value: '13.8 TB / day', desc: '160 MB/sec * 86,400 seconds' },
        { label: 'Downsampled Storage (1 yr)', value: '5 TB total', desc: 'Aggregating 10s raw data to 1-hour rollups after 7 days' }
      ]
    },
    dataModel: {
      overview: 'Time-Series Database (Prometheus TSDB / VictoriaMetrics / InfluxDB) storing time-ordered float value arrays.',
      entities: [
        {
          name: 'metric_series',
          description: 'Metric series metadata identifier.',
          fields: [
            { name: 'series_id', type: 'BIGINT PRIMARY KEY', desc: 'Unique series ID' },
            { name: 'metric_name', type: 'VARCHAR(128)', desc: 'e.g. `http_requests_total`' },
            { name: 'labels', type: 'JSONB', desc: 'Tags e.g. `{ "env": "prod", "service": "payment" }`' }
          ]
        },
        {
          name: 'metric_datapoints',
          description: 'Time-series append-only compressed data block.',
          fields: [
            { name: 'series_id', type: 'BIGINT', desc: 'Target metric series ID' },
            { name: 'timestamp', type: 'BIGINT', desc: 'Unix epoch timestamp in milliseconds' },
            { name: 'value', type: 'DOUBLE', desc: 'Numerical metric value' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'Prometheus Pull `/metrics` scrape endpoint + Datadog Push Ingestion API.',
      endpoints: [
        {
          method: 'GET',
          path: '/metrics',
          params: '',
          statusCode: '200 OK',
          description: 'Exposes text-format metrics for Prometheus scraper pull.'
        },
        {
          method: 'POST',
          path: '/api/v1/series',
          params: '{ "series": [{ "metric": "cpu.idle", "points": [[1787827200, 95.5]], "tags": ["env:prod"] }] }',
          statusCode: '202 Accepted',
          description: 'Pushes metric datapoint batch to telemetry collector.'
        }
      ]
    },
    basicImplementation: {
      title: 'Relational Database Time Logging',
      description: 'Appends metrics to a standard MySQL table `metrics(timestamp, metric_name, value)`.',
      drawbacks: [
        'Database crashes under 10 Million write inserts per second.',
        'High disk space consumption (no Gorilla time-series compression algorithms).',
        'Extremely slow time-range aggregation queries.'
      ]
    },
    advancedImplementation: {
      title: 'Prometheus Pull Scraper / Agent Push + Kafka Buffer + TSDB (Gorilla Encoding) + Alert Manager',
      description: `1. Metric Collection Model (Pull vs Push):
   - Pull Model (Prometheus): Metrics Collector periodically scrapes \`/metrics\` HTTP endpoints exposed by monitored microservices every 10 seconds. Prevents microservices from being overwhelmed by metric sending logic.
   - Push Model (Datadog/StatsD): Lightweight agent on host pushes metric batches to Kafka queue.

2. Time-Series Storage Engine (Gorilla Compression):
   - Uses Facebook Gorilla TSDB compression algorithm:
     - Timestamps are compressed using Delta-of-Delta encoding (reduces 8-byte timestamps to ~1.37 bits!).
     - Double float values are compressed using XOR encoding relative to previous value.
   - Achieves 10x-12x memory compression efficiency!

3. Real-Time Alert Manager:
   - Alert Engine evaluates PromQL rule expressions (e.g. \`rate(http_errors[5m]) > 0.05\`) against TSDB sliding window data every 15 seconds. If condition holds true, dispatches notification to PagerDuty/Slack.`,
      components: [
        { name: 'Prometheus Pull Scraper / Agent', role: 'Metric Collector', details: 'Scrapes `/metrics` HTTP endpoints across server fleet.' },
        { name: 'Kafka Metrics Bus', role: 'Telemetry Buffer', details: 'Buffers 10 Million metric points/sec.' },
        { name: 'TSDB Storage Engine (VictoriaMetrics)', role: 'Time-Series Database', details: 'Stores Gorilla XOR compressed time-series blocks.' },
        { name: 'Alert Evaluation Engine', role: 'PromQL Rule Evaluator', details: 'Evaluates alert thresholds & triggers PagerDuty.' },
        { name: 'Grafana Dashboard Engine', role: 'Visualization UI', details: 'Renders real-time time-series graph charts.' }
      ]
    },
    flows: [
      {
        title: 'Metrics Scrape & Alert Flow',
        description: 'Collecting metrics and triggering alerts.',
        steps: [
          'Prometheus Scraper fetches GET `/metrics` from Payment Service target.',
          'Scraper receives text metrics payload (`http_requests_total{status="500"} 42`).',
          'Pushes metric datapoint batch to Kafka buffer topic `metrics-raw`.',
          'TSDB Ingestion Worker applies Gorilla XOR compression and writes data block to memory TSDB.',
          'Alert Manager evaluates rule `rate(http_requests_total{status="500"}[5m]) > 10`.',
          'Rule threshold breached -> Alert Manager dispatches PagerDuty incident alert to On-Call Engineer.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Data Downsampling & Compaction', details: 'After 7 days, background compaction workers aggregate raw 10-second data points into 1-hour resolution averages (min, max, avg, sum), reducing historical disk storage by 99%.' },
      { topic: 'Pull vs Push Architectural Comparison', details: 'Pull Model allows easy service discovery and target health checks. Push Model works better for short-lived ephemeral batch jobs (AWS Lambda serverless).' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'How does Facebook Gorilla compression reduce time-series database RAM storage by over 10x?',
      options: [
        'By using Delta-of-Delta encoding for timestamps and XOR floating-point encoding for values',
        'By deleting all odd numbers',
        'By rounding floats to zero',
        'By storing numbers as text files'
      ],
      correctAnswerIndex: 0,
      explanation: 'Gorilla TSDB uses Delta-of-Delta encoding for predictable timestamps and XOR bitwise difference encoding for float values, compressing 16-byte datapoints down to ~1.37 bytes.'
    },
    {
      id: 'q2',
      question: 'What is the primary advantage of the "Pull Model" (used by Prometheus) over the "Push Model"?',
      options: [
        'The central collector controls scrape rates, preventing app servers from becoming overloaded by telemetry tasks, and automatically detects host outages if scrape fails',
        'Pull Model requires zero network bandwidth',
        'Push Model is banned by cloud providers',
        'Pull Model converts metrics to HTML'
      ],
      correctAnswerIndex: 0,
      explanation: 'Pulling metrics puts control in the monitoring infrastructure hands, preventing application servers from crashing due to metric sending queues while providing built-in liveness checks.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'app', label: 'Monitored Microservices', type: 'client', description: 'Exposes `/metrics` endpoint on port 9090', x: 40, y: 160 },
      { id: 'scraper', label: 'Prometheus Scraper Agent', type: 'service', description: 'Scrapes metrics every 10s via HTTP GET', x: 240, y: 160 },
      { id: 'kafka', label: 'Kafka Telemetry Bus', type: 'queue', description: 'Buffers 10 Million datapoints/sec', x: 440, y: 160 },
      { id: 'tsdb', label: 'TSDB Storage Engine', type: 'db', description: 'Stores Gorilla compressed time-series data blocks', x: 660, y: 160 },
      { id: 'alert', label: 'Alert Manager Engine', type: 'service', description: 'Evaluates PromQL alert rules every 15s', x: 880, y: 80 },
      { id: 'grafana', label: 'Grafana Dashboard UI', type: 'service', description: 'Renders real-time time-series graphs', x: 880, y: 240 }
    ],
    connections: [
      { from: 'scraper', to: 'app', label: '1. Scrape GET /metrics' },
      { from: 'scraper', to: 'kafka', label: '2. Buffer Metrics Batch' },
      { from: 'kafka', to: 'tsdb', label: '3. Ingest Compressed Block' },
      { from: 'tsdb', to: 'alert', label: '4. Evaluate PromQL Rules' },
      { from: 'tsdb', to: 'grafana', label: '5. Query Dashboard Graphs' },
      { from: 'alert', to: 'app', label: 'Trigger PagerDuty Alert' }
    ]
  }
};
