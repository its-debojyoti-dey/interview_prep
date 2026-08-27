import { SystemDesignTopic } from '../../types/systemDesign';

export const hotelReservationTopic: SystemDesignTopic = {
  id: 'hotel-reservation',
  title: 'Hotel Reservation System (Airbnb, Booking.com)',
  subtitle: 'Calendar Availability & Overbooking Management',
  category: 'Distributed Systems',
  difficulty: 'Medium',
  frequencyRank: 15,
  editorial: {
    companies: ['Airbnb', 'Booking.com', 'Expedia', 'Marriott', 'Trip.com'],
    overview: 'Design a hotel room and property booking platform supporting date-range availability searches, room inventory reservations, dynamic pricing, and multi-tenant hotel management.',
    introduction: `Hotel reservation platforms allow users to search for available rooms across specific check-in and check-out date ranges (e.g., July 1 to July 5).

Unlike single-seat event ticketing, hotel reservations operate on date intervals. The core challenge is preventing double-booking across overlapping stay dates while processing high search traffic.`,
    requirements: {
      functional: [
        'Search available hotel rooms by location and date range (check-in / check-out).',
        'View room details, amenities, pricing, and real-time date availability.',
        'Reserve a room for selected date range with temporary hold.',
        'Cancel or modify existing reservations within allowed policy windows.'
      ],
      nonFunctional: [
        'Zero overbooking: Never reserve the same room type beyond physical room capacity for any date.',
        'Low search latency (< 100ms per query).',
        'Scalable to 1 Million hotels, 100 Million rooms, and 50,000 QPS search traffic.',
        'ACID transactions for booking confirmations.'
      ],
      outOfScope: ['Physical room key card lock integration']
    },
    keyQuestions: {
      assumptions: [
        '500,000 Hotels; 100 Million total rooms worldwide',
        '10 Million daily active search users',
        'Search QPS: 30,000 QPS; Booking QPS: 500 QPS'
      ],
      calculations: [
        { label: 'Date Inventory Records', value: '36.5 Billion rows', desc: '100M rooms * 365 days forward availability calendar' },
        { label: 'Compressed Inventory Storage', value: '1.2 TB', desc: 'Storing room type daily counts instead of individual room rows' },
        { label: 'Search Cache Target', value: '90%', desc: 'Caching daily room counts per hotel in Redis' }
      ]
    },
    dataModel: {
      overview: 'Aggregated Room Type Inventory Model (storing total available count per room type per day) to avoid storing 36 Billion individual room rows.',
      entities: [
        {
          name: 'room_type_inventory',
          description: 'Daily available inventory counter per room type per date.',
          fields: [
            { name: 'hotel_id', type: 'BIGINT', desc: 'Hotel ID' },
            { name: 'room_type_id', type: 'BIGINT', desc: 'Standard | Deluxe | Suite' },
            { name: 'date', type: 'DATE', desc: 'Calendar date (e.g. 2026-07-01)' },
            { name: 'total_rooms', type: 'INT', desc: 'Total physical rooms owned (e.g. 50)' },
            { name: 'reserved_count', type: 'INT', desc: 'Number of currently reserved rooms' }
          ]
        },
        {
          name: 'reservations',
          description: 'Confirmed guest booking record.',
          fields: [
            { name: 'reservation_id', type: 'UUID PRIMARY KEY', desc: 'Unique booking reference' },
            { name: 'user_id', type: 'BIGINT', desc: 'Guest user ID' },
            { name: 'hotel_id', type: 'BIGINT', desc: 'Hotel ID' },
            { name: 'room_type_id', type: 'BIGINT', desc: 'Room type ID' },
            { name: 'check_in', type: 'DATE', desc: 'Start date' },
            { name: 'check_out', type: 'DATE', desc: 'End date' },
            { name: 'status', type: 'VARCHAR(16)', desc: 'HOLD | CONFIRMED | CANCELLED' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'REST API for date range search and atomic booking.',
      endpoints: [
        {
          method: 'GET',
          path: '/v1/hotels/search',
          params: '?city=SanFrancisco&check_in=2026-07-01&check_out=2026-07-05&guests=2',
          statusCode: '200 OK',
          description: 'Returns list of available hotels with room pricing for date range.'
        },
        {
          method: 'POST',
          path: '/v1/reservations/reserve',
          params: '{ "hotelId": 101, "roomTypeId": 5, "checkIn": "2026-07-01", "checkOut": "2026-07-05" }',
          statusCode: '201 Created / 409 Fully Booked',
          description: 'Attempts atomic date-range room reservation.'
        }
      ]
    },
    basicImplementation: {
      title: 'Per-Room Date Table with Overlap Checks',
      description: 'Stores start/end dates for every reservation. Search queries run `WHERE NOT (check_in >= existing_checkout OR check_out <= existing_checkin)`.',
      drawbacks: [
        'Expensive SQL queries scanning millions of reservation rows on every search.',
        'High risk of double-booking when 10 users simultaneously attempt to book the last available room for overlapping dates.'
      ]
    },
    advancedImplementation: {
      title: 'Aggregated Daily Room Inventory Table + SQL Optimistic/Pessimistic Locking + Redis Cache',
      description: `1. Room Type Inventory Model: Instead of tracking individual room IDs, track total room count per room type per day (\`room_type_inventory\`).
   - Checking availability for July 1 to July 5 requires verifying that \`reserved_count < total_rooms\` for all 4 dates (July 1, 2, 3, 4).

2. Atomic Reservation Transaction:
   - Execute SQL statement:
     \`\`\`sql
     UPDATE room_type_inventory
     SET reserved_count = reserved_count + 1
     WHERE room_type_id = 5
       AND date IN ('2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04')
       AND reserved_count < total_rooms;
     \`\`\`
   - If affected row count == 4 (all dates updated), reservation succeeds!
   - If affected row count < 4 (one date is fully booked), rollback transaction immediately!

3. Redis Date-Bitmap Cache: Cache daily room availability as bit vectors in Redis for fast search filtering.`,
      components: [
        { name: 'Hotel Search API', role: 'Search Gateway', details: 'Queries Redis availability cache.' },
        { name: 'Reservation Service', role: 'Booking State Machine', details: 'Executes atomic inventory updates.' },
        { name: 'Redis Room Availability Cache', role: 'In-memory Search Accelerator', details: 'Caches daily room counts per hotel.' },
        { name: 'PostgreSQL Primary DB', role: 'ACID Inventory Datastore', details: 'Enforces atomic multi-date row updates.' }
      ]
    },
    flows: [
      {
        title: 'Room Reservation Flow',
        description: 'Booking a hotel room across dates.',
        steps: [
          'User submits POST /v1/reservations/reserve for check-in 2026-07-01 to 2026-07-05.',
          'Reservation Service starts PostgreSQL transaction.',
          'Executes UPDATE on `room_type_inventory` incrementing `reserved_count` WHERE `reserved_count < total_rooms` for all 4 target dates.',
          'If 4 rows updated: Insert reservation record into `reservations` table with status=HOLD (15 min payment window). Commit transaction.',
          'If < 4 rows updated: Rollback transaction and return 409 Fully Booked error.',
          'Upon successful credit card payment: Update reservation status = CONFIRMED.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Handling Overbooking Intentionally', details: 'Airlines and hotels deliberately overbook by 5% to account for cancellations (no-shows). In system design, overbooking threshold can be configured per hotel policy (`total_rooms * 1.05`).' },
      { topic: 'Dynamic Seasonal Pricing Engine', details: 'Price per night varies by demand, season, and day of week. Calculate price dynamically by joining room base price with dynamic pricing rate rules.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'Why store a daily "room_type_inventory" table instead of querying individual room reservations for availability searches?',
      options: [
        'It reduces 36+ Billion individual room rows into lightweight daily counters, enabling single atomic SQL UPDATE queries for date ranges',
        'It deletes old hotel records',
        'It converts currency rates automatically',
        'Because PostgreSQL cannot store dates'
      ],
      correctAnswerIndex: 0,
      explanation: 'Aggregating counts by room type per date reduces database volume drastically and allows verifying availability across multi-day stays using single atomic SQL queries.'
    },
    {
      id: 'q2',
      question: 'How does the SQL atomic UPDATE query verify that ALL target stay dates have available rooms without double-booking?',
      options: [
        'By checking affected row count: If updated rows equal total nights stayed, all dates succeeded; otherwise rollback transaction',
        'By locking the user phone',
        'By sending an email',
        'By ignoring fully booked dates'
      ],
      correctAnswerIndex: 0,
      explanation: 'Checking if affected row count equals number of target stay dates guarantees every single night was available before committing the transaction.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'client', label: 'Guest Mobile / Web App', type: 'client', description: 'Searches dates & books rooms', x: 40, y: 160 },
      { id: 'lb', label: 'API Gateway', type: 'lb', description: 'Routes search & booking API traffic', x: 220, y: 160 },
      { id: 'searchSvc', label: 'Search Service', type: 'service', description: 'Queries location & available date ranges', x: 440, y: 80 },
      { id: 'resSvc', label: 'Reservation Service', type: 'service', description: 'Executes atomic multi-date inventory updates', x: 440, y: 240 },
      { id: 'redis', label: 'Redis Availability Cache', type: 'cache', description: 'Caches daily room counts per hotel', x: 660, y: 80 },
      { id: 'db', label: 'PostgreSQL Primary DB', type: 'db', description: 'Stores room_type_inventory & reservations', x: 660, y: 240 }
    ],
    connections: [
      { from: 'client', to: 'lb', label: 'API Request' },
      { from: 'lb', to: 'searchSvc', label: 'GET /search' },
      { from: 'lb', to: 'resSvc', label: 'POST /reserve' },
      { from: 'searchSvc', to: 'redis', label: 'Check Date Availability' },
      { from: 'resSvc', to: 'db', label: 'Atomic UPDATE Inventory' },
      { from: 'resSvc', to: 'redis', label: 'Invalidate / Update Cache' }
    ]
  }
};
