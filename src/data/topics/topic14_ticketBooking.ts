import { SystemDesignTopic } from '../../types/systemDesign';

export const ticketBookingTopic: SystemDesignTopic = {
  id: 'ticket-booking',
  title: 'Ticket Booking System (Ticketmaster)',
  subtitle: 'Concert Seat Reservation & Anti-Double-Booking',
  category: 'Distributed Systems',
  difficulty: 'Hard',
  frequencyRank: 14,
  editorial: {
    companies: ['Ticketmaster', 'Live Nation', 'StubHub', 'BookMyShow', 'Airbnb'],
    overview: 'Design a concert ticket reservation platform capable of handling massive flash sales (e.g. Taylor Swift concert tickets) without double-booking seats or crashing under traffic spikes.',
    introduction: `Ticket booking platforms experience extreme traffic spikes when high-demand concert tickets go on sale. Millions of users attempt to reserve the exact same seat within the exact same second.

Key challenges include concurrency control (pessimistic vs optimistic locking), temporary seat reservation holds with TTL expiration, anti-scalping rate limits, and ACID transaction isolation.`,
    requirements: {
      functional: [
        'Users can view interactive venue seat maps and real-time seat availability.',
        'Users can place a temporary hold on a specific seat (e.g. reserved for 10 minutes while completing payment).',
        'Users can purchase reserved seats via credit card payment.',
        'If payment fails or timer expires (10 mins), seat is automatically released back to available pool.'
      ],
      nonFunctional: [
        'Strict Consistency (CP in CAP theorem): ZERO double-booking allowed under any condition.',
        'Scalable to handle 100,000 requests per second during flash sale launches.',
        'Low latency seat map browsing (< 100ms).'
      ],
      outOfScope: ['Physical paper ticket printing']
    },
    keyQuestions: {
      assumptions: [
        'Venue capacity: 50,000 seats',
        'Flash Sale Launch: 1 Million users attempting to buy 50,000 seats within 5 minutes',
        'Peak concurrency QPS: 100,000 QPS'
      ],
      calculations: [
        { label: 'Seat Inventory Storage', value: '15 MB RAM', desc: '50,000 seats * 300 bytes seat metadata' },
        { label: 'Hold Expiration TTL', value: '600 Seconds', desc: '10-minute temporary seat reservation lock window' },
        { label: 'DB Isolation Requirement', value: 'Serializable / Repeatable Read', desc: 'Prevents race conditions & dirty reads' }
      ]
    },
    dataModel: {
      overview: 'RDBMS (PostgreSQL) with strict transaction isolation + Redis distributed locks.',
      entities: [
        {
          name: 'seats',
          description: 'Concert venue seat inventory state table.',
          fields: [
            { name: 'seat_id', type: 'BIGINT PRIMARY KEY', desc: 'Unique seat identifier' },
            { name: 'show_id', type: 'BIGINT', desc: 'Concert show event ID' },
            { name: 'seat_number', type: 'VARCHAR(16)', desc: 'Section A, Row 12, Seat 4' },
            { name: 'status', type: 'VARCHAR(16)', desc: 'AVAILABLE | RESERVED | BOOKED' },
            { name: 'reserved_by_user', type: 'BIGINT', desc: 'User ID holding seat lock' },
            { name: 'reserved_until', type: 'TIMESTAMP', desc: 'Hold expiration timestamp' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'RESTful booking API with transactional locks.',
      endpoints: [
        {
          method: 'POST',
          path: '/v1/seats/reserve',
          params: '{ "showId": "101", "seatIds": [1001, 1002] }',
          statusCode: '200 OK / 409 Conflict',
          description: 'Attempts temporary 10-minute seat lock hold.'
        },
        {
          method: 'POST',
          path: '/v1/bookings/confirm-payment',
          params: '{ "reservationId": "res_999", "paymentToken": "tok_xyz" }',
          statusCode: '200 OK',
          description: 'Finalizes payment and converts status from RESERVED to BOOKED.'
        }
      ]
    },
    basicImplementation: {
      title: 'Standard SQL UPDATE Query without Locks',
      description: 'Executes `UPDATE seats SET status = "RESERVED" WHERE seat_id = 1001 AND status = "AVAILABLE"`.',
      drawbacks: [
        'Race conditions under high concurrency: Two parallel threads executing UPDATE at the exact same millisecond can both read status = "AVAILABLE" before either writes, resulting in double-booking!'
      ]
    },
    advancedImplementation: {
      title: 'Pessimistic DB Locking (`SELECT FOR UPDATE`) + Redis TTL Reservation Lock + Virtual Queue (FairQueue)',
      description: `1. Virtual Queueing Room (FairQueue): During high-demand ticket launches, an API Gateway places incoming users into a Fair Queue (Kafka / Redis ZSET) based on entry timestamp. Users are admitted in batch rates (e.g. 500 users/sec) to shield backend DB from 100,000 QPS spikes.

2. Anti-Double-Booking Concurrency Control:
   - Redis Distributed Lock (Redlock): User acquiring seat executes atomic Redis SET command: \`SET seat:1001:lock user_123 NX PX 600000\` (10 min expiration).
   - SQL Pessimistic Row Lock: Booking Service starts SQL transaction with \`SELECT * FROM seats WHERE seat_id = 1001 FOR UPDATE;\`. This locks the row at database level, forcing concurrent threads to wait until transaction commits.

3. Automatic Expiration (TTL): If user closes browser or payment fails, Redis TTL expires after 10 minutes and a background Worker resets SQL seat status back to AVAILABLE.`,
      components: [
        { name: 'Virtual Waiting Room (Queue)', role: 'Traffic Shaper', details: 'Holds 1M users in fair queue & controls admission rate.' },
        { name: 'Booking Service API', role: 'Reservation Engine', details: 'Executes transactional seat holds.' },
        { name: 'Redis Distributed Lock Cluster', role: 'In-memory Fast Seat Lock', details: 'Holds 10-minute seat TTL locks.' },
        { name: 'PostgreSQL Primary DB', role: 'ACID Datastore', details: 'Enforces SELECT FOR UPDATE row-level locks.' },
        { name: 'Payment Gateway Integration', role: 'Stripe Adapter', details: 'Processes credit card payments during 10-min window.' }
      ]
    },
    flows: [
      {
        title: 'Seat Reservation Flow',
        description: 'User selecting and locking a concert seat.',
        steps: [
          'User clicks seat #1001 on venue interactive map.',
          'Client submits POST /v1/seats/reserve.',
          'Booking Service attempts Redis `SET seat:1001:lock user_123 NX PX 600000`. If key exists, return HTTP 409 Seat Unavailable.',
          'Service opens PostgreSQL SQL transaction: `SELECT * FROM seats WHERE seat_id = 1001 FOR UPDATE`.',
          'Verifies seat.status == AVAILABLE.',
          'Updates SQL seat.status = RESERVED, reserved_until = NOW() + 10 mins. Commits transaction.',
          'Returns 10-minute countdown timer screen to user.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Optimistic vs Pessimistic Locking', details: 'Optimistic Locking uses version numbers (`UPDATE seats SET status="RESERVED", version=2 WHERE seat_id=1001 AND version=1`). Excellent for low conflict. High conflict ticket flash sales require Pessimistic Locking (`SELECT FOR UPDATE`) or Virtual Queuing.' },
      { topic: 'Bots & Scalping Prevention', details: 'Enforce CAPTCHA verification + account purchase limits (max 4 tickets per credit card).' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'Which SQL statement prevents two concurrent database transactions from double-booking the exact same seat?',
      options: [
        'SELECT * FROM seats WHERE seat_id = 1001 FOR UPDATE;',
        'SELECT * FROM seats WHERE seat_id = 1001;',
        'INSERT INTO seats VALUES (1001);',
        'DROP TABLE seats;'
      ],
      correctAnswerIndex: 0,
      explanation: '`SELECT FOR UPDATE` acquires an exclusive pessimistic row-level lock in SQL, forcing subsequent concurrent transactions to block until the lock is released.'
    },
    {
      id: 'q2',
      question: 'What is the role of a Virtual Waiting Room queue during a high-demand ticket launch (e.g. Taylor Swift tickets)?',
      options: [
        'It absorbs massive traffic bursts (e.g. 1M users) and admits users to the booking system at a controlled steady rate to prevent database crashes',
        'It increases ticket prices automatically',
        'It cancels all credit card transactions',
        'It generates fake seat maps'
      ],
      correctAnswerIndex: 0,
      explanation: 'Virtual Waiting Rooms act as traffic limiters, queueing users fairly by entry time and metering traffic flow so backend database servers operate at peak capacity without crashing.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'client', label: 'User Browser App', type: 'client', description: 'Selects seat & initiates checkout', x: 40, y: 160 },
      { id: 'vroom', label: 'Virtual Waiting Room', type: 'queue', description: 'Queues 1M users & admits 500/sec', x: 220, y: 160 },
      { id: 'api', label: 'Booking API Service', type: 'service', description: 'Executes transactional seat holds', x: 440, y: 160 },
      { id: 'redis', label: 'Redis Distributed Lock', type: 'cache', description: 'Fast 10-minute TTL lock (SET NX PX)', x: 660, y: 80 },
      { id: 'db', label: 'PostgreSQL Primary DB', type: 'db', description: 'ACID store enforcing SELECT FOR UPDATE', x: 660, y: 240 },
      { id: 'stripe', label: 'Payment Gateway', type: 'service', description: 'Processes credit card checkout', x: 860, y: 160 }
    ],
    connections: [
      { from: 'client', to: 'vroom', label: '1. Enter Sale' },
      { from: 'vroom', to: 'api', label: '2. Rate Limited Admission' },
      { from: 'api', to: 'redis', label: '3. Atomic Lock Check (SET NX)' },
      { from: 'api', to: 'db', label: '4. SELECT FOR UPDATE Transaction' },
      { from: 'api', to: 'stripe', label: '5. Complete Payment' },
      { from: 'stripe', to: 'db', label: '6. Confirm Status = BOOKED' }
    ]
  }
};
