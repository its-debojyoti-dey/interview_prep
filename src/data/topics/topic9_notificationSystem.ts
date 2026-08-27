import { SystemDesignTopic } from '../../types/systemDesign';

export const notificationSystemTopic: SystemDesignTopic = {
  id: 'notification-system',
  title: 'Notification System',
  subtitle: 'Multi-channel Push, SMS & Email Service',
  category: 'Distributed Systems',
  difficulty: 'Medium',
  frequencyRank: 9,
  editorial: {
    companies: ['Uber', 'Amazon', 'Meta', 'Airbnb', 'Twilio'],
    overview: 'Design a scalable multi-channel Notification System capable of delivering mobile push notifications, SMS messages, and emails to hundreds of millions of users reliably.',
    introduction: `Notifications keep users informed about critical updates (order status, payment receipts, breaking news, direct messages). A enterprise notification system must reliably aggregate requests across multiple backend microservices and route them through third-party providers (APNS, FCM, Twilio, SendGrid).

Key considerations include message rate limiting, template rendering, deduplication, retry queues, and user channel preferences.`,
    requirements: {
      functional: [
        'Support multiple notification channels: Mobile Push (iOS APNS / Android FCM), SMS, Email.',
        'Accept notification send requests from internal microservices.',
        'Support template rendering (e.g. "Hello {{name}}, your order {{order_id}} has shipped").',
        'Respect user notification preferences (e.g. User opts out of SMS promo notifications).'
      ],
      nonFunctional: [
        'High throughput: Support 10 Billion notifications per day (~100,000 QPS).',
        'Low delivery latency: Critical notifications (OTP/2FA) delivered in < 5 seconds.',
        'Reliability & At-Least-Once Delivery: Zero notification loss.',
        'Rate limiting per user to avoid spamming.'
      ],
      outOfScope: ['Physical postal mail delivery']
    },
    keyQuestions: {
      assumptions: [
        '10 Billion notifications per day',
        'Distribution: 70% Mobile Push, 20% Email, 10% SMS',
        '100,000 requests per second peak traffic'
      ],
      calculations: [
        { label: 'Total Daily Bandwidth', value: '5 TB / day', desc: '10B notifications * 500 bytes metadata per message' },
        { label: 'Push Notification Peak QPS', value: '70,000 QPS', desc: '70% of 100,000 peak QPS' },
        { label: 'Email Peak QPS', value: '20,000 QPS', desc: '20% of 100,000 peak QPS' }
      ]
    },
    dataModel: {
      overview: 'Relational or NoSQL store for tracking notification logs, user channel preferences, and device tokens.',
      entities: [
        {
          name: 'notification_logs',
          description: 'Delivery tracking status audit log.',
          fields: [
            { name: 'notification_id', type: 'UUID PRIMARY KEY', desc: 'Unique notification ID' },
            { name: 'user_id', type: 'BIGINT', desc: 'Recipient user ID' },
            { name: 'channel', type: 'VARCHAR(16)', desc: 'PUSH | SMS | EMAIL' },
            { name: 'status', type: 'VARCHAR(16)', desc: 'PENDING | SENT | FAILED | READ' },
            { name: 'provider', type: 'VARCHAR(32)', desc: 'APNS | FCM | TWILIO | SENDGRID' },
            { name: 'retry_count', type: 'INT', desc: 'Number of failed send retries' },
            { name: 'created_at', type: 'TIMESTAMP', desc: 'Creation timestamp' }
          ]
        },
        {
          name: 'user_preferences',
          description: 'User notification opt-in/opt-out settings.',
          fields: [
            { name: 'user_id', type: 'BIGINT PRIMARY KEY', desc: 'User ID' },
            { name: 'allow_push', type: 'BOOLEAN', desc: 'Opt-in mobile push' },
            { name: 'allow_sms', type: 'BOOLEAN', desc: 'Opt-in SMS' },
            { name: 'allow_email', type: 'BOOLEAN', desc: 'Opt-in marketing email' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'Internal gRPC / REST API consumed by backend services.',
      endpoints: [
        {
          method: 'POST',
          path: '/v1/notifications/send',
          params: '{ "userId": "123", "templateId": "ORDER_SHIPPED", "templateArgs": { "orderId": "999" }, "channels": ["PUSH", "EMAIL"] }',
          statusCode: '202 Accepted',
          description: 'Enqueues notification for asynchronous background processing.'
        }
      ]
    },
    basicImplementation: {
      title: 'Monolithic Synchronous Integration',
      description: 'Order Service calls Notification API -> Notification API synchronously makes HTTPS network requests directly to Apple APNS, FCM, or Twilio in a blocking thread.',
      drawbacks: [
        'Single point of failure: If Twilio or APNS experiences network slowness, the entire Order Service hangs and crashes.',
        'No retry mechanism for dropped network packets.',
        'High latency bottleneck on user API calls.'
      ]
    },
    advancedImplementation: {
      title: 'Decoupled Asynchronous Message Queues (Kafka) + Dedicated Worker Pools per Channel + Rate Limiting',
      description: `1. Asynchronous Ingestion: Backend services submit notification requests to an API Gateway which immediately validates payload schema, checks User Preference DB, and returns HTTP 202 Accepted.

2. Kafka Channel Isolation: Notifications are routed into dedicated message queue topics (\`push-topic\`, \`sms-topic\`, \`email-topic\`). A outage in Twilio (SMS) does not impact Apple Push (APNS) or Email delivery.

3. Worker Pool & Rate Limiter: Dedicated worker pools pull from Kafka, render dynamic templates, apply per-user rate limits (Redis Token Bucket), and invoke 3rd-party vendor SDKs.

4. Retry Dead Letter Queue (DLQ): Failed delivery attempts trigger exponential backoff retries. Unrecoverable failures move to a Dead Letter Queue for manual audit.`,
      components: [
        { name: 'Notification Service API', role: 'Ingestion & Validation', details: 'Validates requests & user preferences.' },
        { name: 'Kafka Topic Cluster', role: 'Channel Event Bus', details: 'Decouples push, sms, and email queues.' },
        { name: 'Push Worker Pool', role: 'APNS / FCM Sender', details: 'Delivers mobile push notifications.' },
        { name: 'SMS Worker Pool', role: 'Twilio Sender', details: 'Delivers SMS texts.' },
        { name: 'Email Worker Pool', role: 'SendGrid / SES Sender', details: 'Renders HTML templates & sends email.' },
        { name: 'Dead Letter Queue (DLQ)', role: 'Failure Handler', details: 'Captures failed messages for retry.' }
      ]
    },
    flows: [
      {
        title: 'Send Notification Flow',
        description: 'End-to-end notification delivery.',
        steps: [
          'Order Service submits POST /v1/notifications/send.',
          'Notification API checks User Preference Cache; drops message if user opted out.',
          'API checks Device Token DB for target push tokens.',
          'API publishes message payload to Kafka topic `push-notifications`. Returns 202 Accepted.',
          'Push Worker Pool consumes message, checks Redis rate limiter, and formats payload.',
          'Worker calls Apple APNS / Google FCM API.',
          'If successful: Write log status SENT. If failed: Re-queue with exponential backoff.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Deduplication (Idempotency)', details: 'Store `notification_id` or `idempotency_key` in Redis with 24-hour TTL to prevent sending duplicate order receipts during network retries.' },
      { topic: 'Third-Party Provider Failover', details: 'Maintain backup providers (e.g. Twilio primary, MessageBird fallback for SMS) to fail over automatically if primary vendor drops below 95% SLA.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'Why isolate different notification channels (Push, SMS, Email) into separate message queues (e.g. Kafka topics)?',
      options: [
        'To prevent an outage or slow response time in one 3rd-party vendor (e.g., SMS Twilio) from stalling delivery of other channels (e.g., APNS Push)',
        'Because Kafka requires 3 topics minimum',
        'SMS requires more memory than Email',
        'To force users to read emails'
      ],
      correctAnswerIndex: 0,
      explanation: 'Channel decoupling ensures third-party API slowness or failure in one vendor does not block or degrade delivery performance of other independent channels.'
    },
    {
      id: 'q2',
      question: 'What mechanism prevents sending duplicate push notifications when network retries occur?',
      options: [
        'Idempotency Key stored in Redis with TTL',
        'Deleting the user account',
        'Restarting the server every hour',
        'Random delay'
      ],
      correctAnswerIndex: 0,
      explanation: 'Checking an idempotency key (e.g., order_id + event) in Redis before processing ensures duplicate requests are recognized and ignored.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'service', label: 'Backend Services', type: 'service', description: 'Order / Auth / Social services', x: 40, y: 160 },
      { id: 'api', label: 'Notification API', type: 'lb', description: 'Validates & checks user preferences', x: 220, y: 160 },
      { id: 'prefs', label: 'User Preference DB', type: 'db', description: 'Opt-in/out & device token mapping', x: 220, y: 40 },
      { id: 'kafkaPush', label: 'Push Queue (Kafka)', type: 'queue', description: 'Push notification events', x: 440, y: 80 },
      { id: 'kafkaSms', label: 'SMS Queue (Kafka)', type: 'queue', description: 'SMS text events', x: 440, y: 180 },
      { id: 'kafkaEmail', label: 'Email Queue (Kafka)', type: 'queue', description: 'Email events', x: 440, y: 280 },
      { id: 'pushWorker', label: 'APNS/FCM Workers', type: 'service', description: 'Delivers to Apple & Google', x: 680, y: 80 },
      { id: 'smsWorker', label: 'Twilio Workers', type: 'service', description: 'Delivers SMS texts', x: 680, y: 180 },
      { id: 'emailWorker', label: 'SendGrid Workers', type: 'service', description: 'Delivers HTML emails', x: 680, y: 280 }
    ],
    connections: [
      { from: 'service', to: 'api', label: '1. Send Request' },
      { from: 'api', to: 'prefs', label: 'Check Preferences' },
      { from: 'api', to: 'kafkaPush', label: 'Publish Push' },
      { from: 'api', to: 'kafkaSms', label: 'Publish SMS' },
      { from: 'api', to: 'kafkaEmail', label: 'Publish Email' },
      { from: 'kafkaPush', to: 'pushWorker', label: 'Consume' },
      { from: 'kafkaSms', to: 'smsWorker', label: 'Consume' },
      { from: 'kafkaEmail', to: 'emailWorker', label: 'Consume' }
    ]
  }
};
