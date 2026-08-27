import { SystemDesignTopic } from '../../types/systemDesign';

export const messagingAppTopic: SystemDesignTopic = {
  id: 'messaging-app',
  title: 'Messaging App (WhatsApp, WeChat, Messenger)',
  subtitle: 'Real-time Chat & WebSockets Engine',
  category: 'Distributed Systems',
  difficulty: 'Hard',
  frequencyRank: 3,
  editorial: {
    companies: ['Meta', 'WhatsApp', 'Tencent', 'Apple', 'Slack'],
    overview: 'Design a real-time messaging application supporting 1-on-1 chat, group chat, delivery receipts, and online status indicators for 500M+ daily active users.',
    introduction: `Building a real-time instant messaging platform like WhatsApp or Signal requires persistent bidirectional connections (WebSockets/TCP), message queuing, offline message synchronization, and end-to-end encryption.

The key design challenge is maintaining millions of persistent WebSocket connections while guaranteeing message delivery ordering and low latency (< 100ms).`,
    requirements: {
      functional: [
        'Supports 1-on-1 private messaging and group messaging.',
        'Real-time message delivery when user is online.',
        'Store messages offline and deliver when user re-connects.',
        'Message state indicators: Sent, Delivered, Read.',
        'Online / Offline presence indicator.'
      ],
      nonFunctional: [
        'Ultra-low latency message delivery (< 100ms globally).',
        'Strict message ordering per conversation channel.',
        'High availability and zero message loss guaranteed.',
        'Support 500 Million DAU and 50 Billion messages per day.'
      ],
      outOfScope: ['Voice & Video Calling (WebRTC)', 'Large file transfer (>100MB)']
    },
    keyQuestions: {
      assumptions: [
        '500 Million DAU sending average 100 messages/day => 50 Billion messages/day',
        'Peak QPS: 50B / 86400 * 2 (peak multiplier) = ~1,150,000 messages/sec',
        'Average message size: 200 bytes'
      ],
      calculations: [
        { label: 'Daily Message Storage', value: '10 TB / day', desc: '50B messages * 200 bytes' },
        { label: '10-Year Storage', value: '36.5 PB', desc: '10 TB/day * 365 days * 10 years' },
        { label: 'Concurrent WebSocket Connections', value: '50 Million', desc: 'Assuming 10% active concurrent connected clients' }
      ]
    },
    dataModel: {
      overview: 'NoSQL datastore (HBase or Cassandra) partitioned by `chat_id` for horizontal scaling and sequential time writes.',
      entities: [
        {
          name: 'messages',
          description: 'Primary message store table.',
          fields: [
            { name: 'chat_id', type: 'BIGINT (PARTITION KEY)', desc: 'Group ID or concatenated user IDs' },
            { name: 'message_id', type: 'BIGINT (CLUSTERING KEY)', desc: 'Monotonically increasing time-sorted ID' },
            { name: 'sender_id', type: 'BIGINT', desc: 'User ID of sender' },
            { name: 'content', type: 'TEXT', desc: 'Encrypted message text payload' },
            { name: 'status', type: 'SMALLINT', desc: '0: Sent, 1: Delivered, 2: Read' },
            { name: 'created_at', type: 'TIMESTAMP', desc: 'Server received timestamp' }
          ]
        },
        {
          name: 'user_presence',
          description: 'In-memory presence status map.',
          fields: [
            { name: 'user_id', type: 'BIGINT PRIMARY KEY', desc: 'User ID' },
            { name: 'status', type: 'VARCHAR(16)', desc: 'online | offline | away' },
            { name: 'last_active', type: 'TIMESTAMP', desc: 'Heartbeat timestamp' },
            { name: 'server_id', type: 'VARCHAR(64)', desc: 'IP/ID of connected Chat WebSocket server' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'WebSocket connection protocol for bi-directional live traffic + REST API for media upload and history backup.',
      endpoints: [
        {
          method: 'POST',
          path: 'wss://gateway.chat.com/ws/connect',
          params: 'Headers: Bearer JWT Token',
          statusCode: '101 Switching Protocols',
          description: 'Upgrades connection from HTTP to persistent WebSocket.'
        },
        {
          method: 'GET',
          path: '/v1/chats/{chatId}/messages',
          params: '?last_message_id=12345&limit=50',
          statusCode: '200 OK',
          description: 'Fetch historical messages for a chat channel.'
        }
      ]
    },
    basicImplementation: {
      title: 'HTTP Long Polling + RDBMS',
      description: 'Clients poll server every few seconds via HTTP GET requests. Messages are written to a centralized SQL DB.',
      drawbacks: [
        'Massive HTTP header overhead and server resource exhaustion.',
        'High database lock contention on message insert queries.',
        'Poor latency (message delays up to polling interval).'
      ]
    },
    advancedImplementation: {
      title: 'Stateful WebSocket Gateway Cluster + Session Location Service (Redis) + Cassandra DB',
      description: `Clients maintain persistent TCP WebSockets with WebSocket Servers. 

A Session Server tracks which WebSocket server holds the socket for any given user. When User A sends a message to User B:
1. User A sends message over WebSocket to WS-Server-1.
2. WS-Server-1 saves message to Cassandra DB.
3. WS-Server-1 checks Redis Session Cache to locate User B's connected WS-Server (e.g. WS-Server-4).
4. If User B is Online: Route message via internal MQ (Kafka/RabbitMQ) to WS-Server-4, which pushes it down User B's active WebSocket.
5. If User B is Offline: Push notification service triggers APNS/FCM alert. When User B reconnects, pending messages are pulled from Cassandra.`,
      components: [
        { name: 'WebSocket Server Cluster', role: 'Stateful Gateway', details: 'Maintains open TCP sockets with mobile/web clients.' },
        { name: 'Session Service (Redis Cluster)', role: 'Connection Registry', details: 'Maps active user_id -> ws_server_ip for fast routing.' },
        { name: 'Message Store (Apache Cassandra)', role: 'Scalable History Store', details: 'Handles heavy write workloads partitioned by chat_id.' },
        { name: 'Push Notification Service', role: 'Offline Delivery', details: 'Integrates with Apple APNS and Google FCM for offline devices.' },
        { name: 'Presence Service', role: 'Status Heartbeat', details: 'Tracks client heartbeat pings every 5 seconds.' }
      ]
    },
    flows: [
      {
        title: 'Send & Deliver Message Flow',
        description: 'End-to-end messaging pipeline.',
        steps: [
          'User A sends message payload over WebSocket to WS Server 1.',
          'WS Server 1 assigns Snowflake message_id and saves to Cassandra.',
          'WS Server 1 sends acknowledgment (ACK) back to User A (Single Checkmark).',
          'WS Server 1 queries Session Store (Redis) for User B location.',
          'Redis returns User B is connected to WS Server 4.',
          'WS Server 1 forwards message to WS Server 4 via internal message queue.',
          'WS Server 4 pushes message down User B active WebSocket.',
          'User B device receives message and sends ACK back; status updates to Delivered (Double Checkmark).'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'End-to-End Encryption (E2EE)', details: 'Signal Protocol with Double Ratchet Algorithm guarantees secrecy even if database is compromised.' },
      { topic: 'Group Messaging Optimization', details: 'For small groups (<100 members), send message copy to each recipient queue. For large channels (>10,000 members), use publish-subscribe channel queues.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'Which protocol is best suited for real-time bi-directional chat applications?',
      options: ['WebSockets (TCP)', 'Standard HTTP/1.1 GET polling', 'UDP Broadcast', 'SMTP'],
      correctAnswerIndex: 0,
      explanation: 'WebSockets provide full-duplex, low-latency, persistent bidirectional communication over a single TCP connection, ideal for chat.'
    },
    {
      id: 'q2',
      question: 'How does the system deliver messages when the recipient user is offline?',
      options: [
        'Stores message in Cassandra DB and sends a Push Notification via APNS/FCM; fetches unread messages when user reconnects',
        'Drops the message',
        'Keeps the WebSocket connection retrying continuously forever',
        'Sends an SMS message'
      ],
      correctAnswerIndex: 0,
      explanation: 'Offline messages are persisted in Cassandra and delivered asynchronously when the user reconnects, while sending an immediate push notification via Apple APNS or Google FCM.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'clientA', label: 'User A (Online)', type: 'client', description: 'Sender client on WS connection', x: 40, y: 120 },
      { id: 'clientB', label: 'User B (Online)', type: 'client', description: 'Receiver client on WS connection', x: 40, y: 260 },
      { id: 'ws1', label: 'WS Gateway Server 1', type: 'service', description: 'Handles User A connection', x: 300, y: 120 },
      { id: 'ws2', label: 'WS Gateway Server 2', type: 'service', description: 'Handles User B connection', x: 300, y: 260 },
      { id: 'redis', label: 'Session Registry (Redis)', type: 'cache', description: 'Maps user_id -> ws_server_ip', x: 520, y: 80 },
      { id: 'db', label: 'Cassandra DB', type: 'db', description: 'Persistent chat message history', x: 520, y: 300 },
      { id: 'push', label: 'FCM / APNS Push', type: 'service', description: 'Offline notification service', x: 720, y: 190 }
    ],
    connections: [
      { from: 'clientA', to: 'ws1', label: 'WebSocket Push' },
      { from: 'ws1', to: 'redis', label: 'Lookup User B Server' },
      { from: 'ws1', to: 'db', label: 'Save Message' },
      { from: 'ws1', to: 'ws2', label: 'MQ Forward' },
      { from: 'ws2', to: 'clientB', label: 'Deliver Message' },
      { from: 'ws1', to: 'push', label: 'If User B Offline' }
    ]
  }
};
