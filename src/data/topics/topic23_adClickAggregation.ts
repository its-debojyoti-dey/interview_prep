import { SystemDesignTopic } from '../../types/systemDesign';

export const adClickAggregationTopic: SystemDesignTopic = {
  id: 'ad-click-aggregation',
  title: 'Ad Click Event Aggregation (Google Ads)',
  subtitle: 'Real-Time Stream Processing & Fraud Detection',
  category: 'Search & Analytics',
  difficulty: 'Hard',
  frequencyRank: 23,
  editorial: {
    companies: ['Google (Google Ads)', 'Meta (Meta Ads)', 'Amazon Ads', 'Trade Desk', 'TikTok'],
    overview: 'Design an ad click event aggregation pipeline capable of processing billions of click events per day in real time for advertiser billing, click-through-rate (CTR) metrics, and bot fraud detection.',
    introduction: `Online advertising platforms like Google Ads bill advertisers billions of dollars based on user ad clicks.

Key challenges include processing high-throughput event streams in real time, handling late-arriving events, ensuring exactly-once processing semantics for billing correctness, and filtering out fraudulent bot clicks (click farm fraud).`,
    requirements: {
      functional: [
        'Ingest ad impression and click events from web browsers and mobile apps.',
        'Aggregate click counts by Ad ID, Advertiser ID, and 1-minute / 1-hour time windows.',
        'Detect and filter out invalid click fraud (bot clicks, rapid duplicate clicks).',
        'Provide real-time analytics dashboards for advertisers.'
      ],
      nonFunctional: [
        'Exactly-Once Processing Semantics for billing accuracy: Zero double-billing.',
        'High ingestion throughput: Handle 100,000 ad clicks per second.',
        'Low latency: Aggregated analytics available in < 1 minute.',
        'High availability and fault tolerance across worker node crashes.'
      ],
      outOfScope: ['Physical billboard vinyl poster printing']
    },
    keyQuestions: {
      assumptions: [
        '1 Billion Ad Clicks per day; 10 Billion Impressions per day',
        '100,000 Click events per second peak QPS',
        'Event payload size = 1 KB (Click ID, Ad ID, User IP, Timestamp, User-Agent)'
      ],
      calculations: [
        { label: 'Click Stream Bandwidth', value: '100 MB / sec', desc: '100,000 clicks/sec * 1 KB payload' },
        { label: 'Daily Event Data Storage', value: '1 TB / day', desc: '1 Billion clicks * 1 KB' },
        { label: 'Streaming Aggregation Window', value: '1-Minute Tumbling Window', desc: 'Flink sliding / tumbling window size' }
      ]
    },
    dataModel: {
      overview: 'Event Log Bus (Kafka) + Stream Processing Engine (Apache Flink) + OLAP Columnar DB (ClickHouse / Druid).',
      entities: [
        {
          name: 'ad_click_aggregates',
          description: '1-Minute aggregated ad metrics OLAP table.',
          fields: [
            { name: 'ad_id', type: 'BIGINT', desc: 'Ad campaign ID' },
            { name: 'window_start', type: 'TIMESTAMP', desc: 'Start timestamp of 1-min window' },
            { name: 'click_count', type: 'BIGINT', desc: 'Valid click total' },
            { name: 'fraud_click_count', type: 'BIGINT', desc: 'Detected bot clicks' },
            { name: 'total_cost', type: 'DECIMAL(12,4)', desc: 'Total advertiser cost' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'Lightweight Ad Click Tracking Beacon API.',
      endpoints: [
        {
          method: 'POST',
          path: '/v1/ad/click',
          params: '{ "adId": "ad_999", "clickId": "clk_123", "timestamp": 1787827200, "ip": "1.2.3.4" }',
          statusCode: '204 No Content',
          description: 'Ingests click event beacon.'
        }
      ]
    },
    basicImplementation: {
      title: 'Direct Database INSERT per Click',
      description: 'Web server receives click -> Immediately executes `INSERT INTO ad_clicks VALUES (...)` in MySQL. Batch cron job runs hourly `COUNT(*)` queries.',
      drawbacks: [
        'Database crashes under 100,000 concurrent INSERT queries per second.',
        'Delayed billing analytics (advertisers wait hours to see budget spend).',
        'No click fraud filtering.'
      ]
    },
    advancedImplementation: {
      title: 'Kafka Event Log Bus + Apache Flink Stream Aggregator + ClickHouse OLAP DB',
      description: `1. Ingestion Layer (Kafka): Click tracking servers push raw click events into Kafka topic \`raw-ad-clicks\` partitioned by \`ad_id\`.

2. Stream Processing (Apache Flink):
   - Apache Flink consumes Kafka topic using 1-minute Tumbling Windows.
   - Watermarking: Flink uses Watermarks to handle late-arriving events (e.g. mobile clicks buffered offline and sent 5 minutes late).

3. Fraud Detection Engine:
   - Flink evaluates sliding window rules per IP / User-Agent (e.g., > 10 clicks on same ad from same IP in 10 seconds -> Flag as Click Fraud).

4. Exactly-Once Processing (Two-Phase Commit):
   - Flink uses Chandy-Lamport Checkpointing to guarantee Exactly-Once state updates into ClickHouse OLAP database.`,
      components: [
        { name: 'Click Collector API', role: 'Beacon Ingestion', details: 'Validates & pushes raw click events to Kafka.' },
        { name: 'Kafka Cluster', role: 'Stream Bus', details: 'Buffers 100,000 click events/sec partitioned by ad_id.' },
        { name: 'Apache Flink Engine', role: 'Stateful Stream Processor', details: 'Executes 1-minute tumbling window aggregations & watermarks.' },
        { name: 'Fraud Detection Engine', role: 'Bot Filter', details: 'Applies IP frequency & pattern fraud rules.' },
        { name: 'ClickHouse / Druid OLAP DB', role: 'Columnar Analytics Store', details: 'Fast sub-second analytical dashboard queries.' }
      ]
    },
    flows: [
      {
        title: 'Click Aggregation Pipeline Flow',
        description: 'End-to-end stream aggregation process.',
        steps: [
          'User clicks advertisement banner on web page.',
          'Browser sends POST /v1/ad/click beacon to Collector API.',
          'Collector appends event to Kafka topic `raw-ad-clicks`.',
          'Apache Flink reads event stream, checks IP fraud rules, and assigns event to 1-minute Tumbling Window.',
          'When window closes (plus watermark delay), Flink emits aggregated record `{ adId: 999, clicks: 1420, fraud: 15 }`.',
          'Flink writes aggregated summary atomically into ClickHouse OLAP database for advertiser billing dashboard.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Handling Late-Arriving Events (Watermarks)', details: 'A mobile user clicking an ad inside a subway tunnel may lose connection and submit the event 10 minutes later. Flink Watermarks allow bounded out-of-order event processing without dropping metrics.' },
      { topic: 'ClickHouse Columnar Storage', details: 'ClickHouse stores data column-by-column rather than row-by-row, compressing metrics 10x and scanning billions of rows in milliseconds.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'Why is Apache Flink preferred over basic batch SQL queries for ad click billing aggregation?',
      options: [
        'Flink processes streaming data in real time with Tumbling Windows, watermarks for late events, and Chandy-Lamport exactly-once processing guarantees',
        'Flink is written in HTML',
        'Flink deletes all click data after 5 seconds',
        'Flink requires zero CPU'
      ],
      correctAnswerIndex: 0,
      explanation: 'Flink provides stateful stream processing with exactly-once guarantees, handling late-arriving events gracefully while updating advertiser dashboards in sub-minute real time.'
    },
    {
      id: 'q2',
      question: 'What mechanism in stream processing handles events that arrive late due to mobile network delays?',
      options: ['Watermarks', 'Deleting late events', 'Pausing the internet', 'Random numbers'],
      correctAnswerIndex: 0,
      explanation: 'Watermarks define a temporal threshold for event-time processing, allowing the system to wait for a specified grace period before finalizing window calculations.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'client', label: 'User Browser App', type: 'client', description: 'Triggers ad click beacon', x: 40, y: 160 },
      { id: 'collector', label: 'Click Collector API', type: 'service', description: 'Validates & publishes raw click events', x: 240, y: 160 },
      { id: 'kafka', label: 'Kafka Event Topic', type: 'queue', description: 'Buffers 100K raw clicks/sec', x: 440, y: 160 },
      { id: 'flink', label: 'Apache Flink Engine', type: 'service', description: '1-min Tumbling Windows & Fraud Filtering', x: 660, y: 160 },
      { id: 'clickhouse', label: 'ClickHouse OLAP DB', type: 'db', description: 'Columnar analytical database for billing dashboards', x: 880, y: 160 }
    ],
    connections: [
      { from: 'client', to: 'collector', label: 'POST /ad/click' },
      { from: 'collector', to: 'kafka', label: 'Publish Raw Event' },
      { from: 'kafka', to: 'flink', label: 'Consume Stream' },
      { from: 'flink', to: 'clickhouse', label: 'Write 1-Min Window Aggregates' }
    ]
  }
};
