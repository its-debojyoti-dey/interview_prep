import { SystemDesignTopic } from '../../types/systemDesign';

export const rideSharingTopic: SystemDesignTopic = {
  id: 'ride-sharing',
  title: 'Ride Sharing Service (Uber, Lyft)',
  subtitle: 'Geospatial Indexing, Matching & Location Tracking',
  category: 'Distributed Systems',
  difficulty: 'Hard',
  frequencyRank: 12,
  editorial: {
    companies: ['Uber', 'Lyft', 'Grab', 'DiDi', 'Bolt'],
    overview: 'Design a real-time ride-matching and location-tracking system capable of matching riders with nearby drivers, updating driver GPS locations in real time, and dynamic surge pricing.',
    introduction: `Ride-sharing platforms process continuous GPS streams from millions of drivers and riders simultaneously.

Core technical challenges include high-frequency geospatial indexing (Google S2 / H3 Spatial Index), low-latency driver-rider matching algorithms, real-time ETA calculation, and dynamic surge pricing engines.`,
    requirements: {
      functional: [
        'Drivers can update their live GPS location every 4 seconds when online.',
        'Riders can request a ride by providing pickup and destination locations.',
        'Match rider with nearest available driver within 5 seconds.',
        'Calculate estimated trip fare and ETA.',
        'Real-time trip tracking on rider interactive map.'
      ],
      nonFunctional: [
        'Ultra-low match latency (< 3 seconds).',
        'Scalable location updates: Process 1 Million active driver location updates per second.',
        'High availability and consistent state tracking during driver network disconnections.'
      ],
      outOfScope: ['Vehicle physical maintenance scheduling']
    },
    keyQuestions: {
      assumptions: [
        '100 Million Active Riders; 5 Million Active Drivers',
        '1 Million online drivers broadcasting GPS every 4 seconds => 250,000 location writes/sec',
        '10 Million completed trips per day'
      ],
      calculations: [
        { label: 'Location Ingestion QPS', value: '250,000 QPS', desc: '1M drivers / 4 second ping interval' },
        { label: 'Geospatial Memory Footprint', value: '1.2 GB RAM', desc: 'In-memory Redis Geospatial H3 index' },
        { label: 'Location Stream Bandwidth', value: '25 MB / s', desc: '250K writes * 100 bytes payload' }
      ]
    },
    dataModel: {
      overview: 'In-memory Geospatial Index (Redis GEO / Uber H3 Grid) + Cassandra location log + PostgreSQL trip state machine.',
      entities: [
        {
          name: 'trips',
          description: 'Trip booking record.',
          fields: [
            { name: 'trip_id', type: 'UUID PRIMARY KEY', desc: 'Unique trip ID' },
            { name: 'rider_id', type: 'BIGINT', desc: 'Rider user ID' },
            { name: 'driver_id', type: 'BIGINT', desc: 'Assigned driver ID (nullable)' },
            { name: 'status', type: 'VARCHAR(32)', desc: 'REQUESTED | MATCHED | PICKUP | IN_TRANSIT | COMPLETED' },
            { name: 'pickup_location', type: 'POINT', desc: 'Latitude / Longitude point' },
            { name: 'dropoff_location', type: 'POINT', desc: 'Latitude / Longitude point' },
            { name: 'fare_amount', type: 'DECIMAL(10,2)', desc: 'Total trip cost' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'WebSocket connection for live driver GPS telemetry + REST API for trip requests.',
      endpoints: [
        {
          method: 'POST',
          path: '/v1/trips/request',
          params: '{ "pickupLat": 37.7749, "pickupLng": -122.4194, "vehicleType": "UberX" }',
          statusCode: '201 Created',
          description: 'Initiates ride request and triggers driver matching.'
        },
        {
          method: 'POST',
          path: 'wss://location.uber.com/driver/telemetry',
          params: '{ "driverId": "d123", "lat": 37.7750, "lng": -122.4190 }',
          statusCode: '101 Switching Protocols',
          description: 'Bi-directional WebSocket streaming driver GPS location every 4s.'
        }
      ]
    },
    basicImplementation: {
      title: 'Relational Spatial SQL Query (PostGIS)',
      description: 'Drivers write GPS coordinates to PostGIS database. Rider match queries execute `SELECT driver_id FROM drivers WHERE ST_DWithin(geom, rider_pickup, 5000)` on SQL DB.',
      drawbacks: [
        'Database crashes under 250,000 GPS update writes per second.',
        'High disk I/O locks render matching queries slow (> 5 seconds).'
      ]
    },
    advancedImplementation: {
      title: 'Geospatial In-Memory Index (Uber H3 / Google S2) + Distributed Location Ingestion Pipeline',
      description: `1. Spatial Indexing (Uber H3 Hexagonal Grid): The earth is divided into hexagonal grid cells. Each cell has a 64-bit ID. Searching nearby drivers is converted into a fast in-memory set lookup of adjacent cell IDs without trigonometric distance calculations!

2. Location Ingestion Pipeline: Drivers send GPS location via WebSockets to Location Gateway. Gateway publishes stream to Kafka. Location Workers update driver position in Redis GEO/H3 index in memory.

3. Match Engine (Stateful Worker): When rider requests trip, Match Engine identifies drivers in adjacent H3 cells within a 2km radius. Uses Distributed Lock (Redlock) to offer ride to nearest driver. If driver declines within 10s, offers to next closest driver.`,
      components: [
        { name: 'Location Gateway Cluster', role: 'WebSocket Ingestion', details: 'Terminates 1M driver TCP connections.' },
        { name: 'Kafka Location Stream', role: 'Telemetry Bus', details: 'Buffers 250K GPS events/sec.' },
        { name: 'Redis H3 Spatial Index', role: 'In-memory Location DB', details: 'Stores active driver H3 cell mappings.' },
        { name: 'Match Engine Service', role: 'Matching Dispatcher', details: 'Finds nearest driver & handles offer state machine.' },
        { name: 'Surge Pricing Engine', role: 'Dynamic Pricing', details: 'Calculates price multipliers based on rider demand vs driver density per H3 cell.' }
      ]
    },
    flows: [
      {
        title: 'Ride Request & Matching Flow',
        description: 'End-to-end trip booking.',
        steps: [
          'Rider requests ride via POST /v1/trips/request with pickup coordinates.',
          'Match Engine converts pickup Lat/Lng to Uber H3 Hexagon Cell ID (e.g. `8828308281fffff`).',
          'Match Engine queries Redis for online drivers in target H3 cell and 6 neighboring ring cells.',
          'Ranks drivers by ETA (distance + traffic speed).',
          'Dispatches dispatch offer push notification to top driver.',
          'If Driver Accepts within 10s: Update Trip Status = MATCHED. Notify Rider.',
          'If Driver Declines or Times Out: Dispatch offer to 2nd nearest driver.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Dynamic Surge Pricing', details: 'Monitors ratio of rider requests vs available drivers in an H3 cell. If demand ratio > 2.0, apply 1.5x surge multiplier to balance demand and attract drivers.' },
      { topic: 'Handling Network Drops', details: 'If driver WebSocket drops for < 30 seconds, mark driver status as UNCERTAIN but retain position in cache. If offline > 30s, drop driver from active spatial index.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'Why does Uber use Hexagonal Spatial Indexing (H3 Grid) instead of square lat/long grids for driver matching?',
      options: [
        'Hexagons have equal distance to all 6 adjacent neighboring cells, making radius search and distance calculations uniform and fast',
        'Hexagons take less memory on screen',
        'Square grids are illegal in GIS',
        'Hexagons double internet speed'
      ],
      correctAnswerIndex: 0,
      explanation: 'Unlike squares (where diagonal neighbors are further than edge neighbors), hexagonal cell centroids are equidistant to all 6 neighbors, simplifying proximity searches.'
    },
    {
      id: 'q2',
      question: 'How do we prevent two riders from being matched to the exact same driver simultaneously?',
      options: [
        'By acquiring a Distributed Lock (e.g. Redlock) on the driver ID while the match offer is pending',
        'By restarting the driver phone',
        'By allowing drivers to accept infinite trips',
        'By matching riders sequentially once per hour'
      ],
      correctAnswerIndex: 0,
      explanation: 'Acquiring a distributed lock on the driver ID ensures only one ride offer is extended to that driver at a time.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'driver', label: 'Driver App', type: 'client', description: 'Streams GPS location every 4s via WebSocket', x: 40, y: 100 },
      { id: 'rider', label: 'Rider App', type: 'client', description: 'Requests trip & views ETA', x: 40, y: 240 },
      { id: 'ws', label: 'Location Gateway Cluster', type: 'service', description: 'WebSocket telemetry receiver', x: 260, y: 100 },
      { id: 'kafka', label: 'Kafka GPS Stream', type: 'queue', description: 'Buffers 250K GPS updates/sec', x: 460, y: 100 },
      { id: 'redisH3', label: 'Redis H3 Spatial Index', type: 'cache', description: 'In-memory spatial index of active drivers', x: 660, y: 100 },
      { id: 'match', label: 'Match Engine Service', type: 'service', description: 'Finds nearest driver & handles offer state machine', x: 460, y: 240 },
      { id: 'tripDb', label: 'PostgreSQL Trip DB', type: 'db', description: 'Persistent trip booking records', x: 660, y: 240 }
    ],
    connections: [
      { from: 'driver', to: 'ws', label: 'GPS Stream' },
      { from: 'ws', to: 'kafka', label: 'Publish Stream' },
      { from: 'kafka', to: 'redisH3', label: 'Update H3 Cells' },
      { from: 'rider', to: 'match', label: 'POST /request' },
      { from: 'match', to: 'redisH3', label: '1. Query Nearby H3 Drivers' },
      { from: 'match', to: 'tripDb', label: '2. Save Trip State' },
      { from: 'match', to: 'driver', label: '3. Push Ride Offer' }
    ]
  }
};
