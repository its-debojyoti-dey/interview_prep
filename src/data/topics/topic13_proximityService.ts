import { SystemDesignTopic } from '../../types/systemDesign';

export const proximityServiceTopic: SystemDesignTopic = {
  id: 'proximity-service',
  title: 'Proximity Service (Yelp)',
  subtitle: 'Nearby Search & Geohash Indexing',
  category: 'Distributed Systems',
  difficulty: 'Medium',
  frequencyRank: 13,
  editorial: {
    companies: ['Yelp', 'Google Maps', 'TripAdvisor', 'DoorDash', 'Foursquare'],
    overview: 'Design a proximity search service to discover nearby places of interest (restaurants, gas stations, cafes) within a given radius based on user location.',
    introduction: `Proximity services allow users to search for points of interest (POIs) near a specific location (e.g. "Find coffee shops within 2 km of my location").

The core architectural problem is efficiently querying 2D spatial coordinates (latitude and longitude) over millions of static business records using Geohash or Quadtree spatial indexing algorithms.`,
    requirements: {
      functional: [
        'Search for nearby places within a specified radius (e.g. 500m, 2km, 10km).',
        'Filter search results by category (e.g. Italian Restaurant), rating, and price level.',
        'View detailed profile information, photos, and reviews for a specific business.',
        'Business owners can add or update business profile details.'
      ],
      nonFunctional: [
        'Low search latency (< 50ms per query).',
        'High availability and read performance.',
        'Support 500 Million total places worldwide and 50,000 search QPS.',
        'High read-to-write ratio (1000:1 read heavy — business listings change infrequently).'
      ],
      outOfScope: ['Real-time indoor navigation']
    },
    keyQuestions: {
      assumptions: [
        '500 Million total registered business listings worldwide',
        '100 Million daily active search users => 50,000 read search QPS',
        'Infrequent updates (100 business write additions/updates per second)'
      ],
      calculations: [
        { label: 'Total Business Storage', value: '250 GB', desc: '500M places * 500 bytes metadata per record' },
        { label: 'Geohash Index Size', value: '16 GB RAM', desc: '500M places indexed by 6-character Geohash string' },
        { label: 'Cache Hit Ratio Target', value: '90%', desc: 'Popular city grid search results cached in Redis' }
      ]
    },
    dataModel: {
      overview: 'Spatial Geohash index in Redis/Elasticsearch combined with MySQL relational store for business metadata.',
      entities: [
        {
          name: 'businesses',
          description: 'Business entity table.',
          fields: [
            { name: 'business_id', type: 'BIGINT PRIMARY KEY', desc: 'Unique business ID' },
            { name: 'name', type: 'VARCHAR(256)', desc: 'Business name' },
            { name: 'latitude', type: 'DOUBLE', desc: 'Latitude coordinate' },
            { name: 'longitude', type: 'DOUBLE', desc: 'Longitude coordinate' },
            { name: 'geohash', type: 'VARCHAR(12) INDEX', desc: 'Geohash spatial code (e.g. "9q9hv")' },
            { name: 'category', type: 'VARCHAR(64)', desc: 'Restaurant | Gas | Hospital' },
            { name: 'rating', type: 'DECIMAL(2,1)', desc: 'Average user review rating' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'RESTful search API.',
      endpoints: [
        {
          method: 'GET',
          path: '/v1/search/nearby',
          params: '?lat=37.7749&lng=-122.4194&radius_km=2&category=restaurant',
          statusCode: '200 OK',
          description: 'Returns array of nearby business objects within radius.'
        }
      ]
    },
    basicImplementation: {
      title: 'SQL Boundary Box Query',
      description: 'Executes `SELECT * FROM business WHERE lat BETWEEN (y1, y2) AND lng BETWEEN (x1, x2)` on relational database.',
      drawbacks: [
        'Combining two separate 1D indexes (lat index AND lng index) is inefficient in relational databases.',
        'Requires scanning thousands of non-matching records, causing high search latency (> 300ms).'
      ]
    },
    advancedImplementation: {
      title: 'Geohash Spatial Indexing + Read-Heavy Redis Cache + Elasticsearch',
      description: `1. Geohash Indexing: Converts 2D (Lat, Lng) coordinates into a 1D alphanumeric string (e.g. \`9q9hvu\`).
   - 6-character Geohash covers ~1.2 km x 0.6 km area box.
   - Searching nearby places requires querying the target Geohash string + 8 surrounding neighbor grid cells (\`geohash IN ("9q9hvu", "9q9hvv", ...)\`).

2. Quadtree / R-Tree In-Memory Cache: Stores hierarchical Quadtree spatial grid in server RAM. Each leaf node holds list of business IDs inside a 2D bounding box.

3. Read Optimization: Because business listings change rarely, search results per Geohash grid cell are cached in Redis with a 24-hour TTL, achieving sub-10ms response times.`,
      components: [
        { name: 'Search Service API Gateway', role: 'Query Gateway', details: 'Converts (Lat, Lng) to Geohash string.' },
        { name: 'Redis Geohash Cache', role: 'In-memory Spatial Cache', details: 'Caches business listings by 6-char Geohash key.' },
        { name: 'Elasticsearch Cluster', role: 'Full-Text & Spatial Search Engine', details: 'Handles complex multi-filter queries (e.g., Geohash + Rating > 4.5 + Open Now).' },
        { name: 'MySQL Master DB', role: 'Source of Truth DB', details: 'Stores permanent business metadata.' }
      ]
    },
    flows: [
      {
        title: 'Nearby Search Flow',
        description: 'Executing user location search.',
        steps: [
          'User client submits GET /v1/search/nearby?lat=37.7749&lng=-122.4194&radius_km=2.',
          'Search Service encodes (37.7749, -122.4194) into 6-character Geohash `9q9hvu`.',
          'Calculates 8 surrounding neighbor Geohash codes.',
          'Queries Redis Cache for keys `[geohash_9q9hvu, geohash_9q9hvv, ...]`.',
          'If Cache Hit: Filters matching business list by exact distance formula (Haversine formula) and returns JSON.',
          'If Cache Miss: Queries Elasticsearch, populates Redis cache, and returns response.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Geohash Boundary Edge Edge-case', details: 'Two points right next to each other across a grid boundary can have completely different Geohash prefixes. Querying the 8 surrounding neighbor Geohashes resolves this edge case completely.' },
      { topic: 'Quadtree vs Geohash', details: 'Geohash uses fixed grid sizes regardless of population density. Quadtree dynamically sub-divides dense urban areas (New York City) into smaller sub-quadrants while leaving sparse rural areas as large boxes.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'How does Geohash solve the 2D spatial search problem in standard 1D databases?',
      options: [
        'By encoding 2D latitude and longitude coordinates into a single 1D interleaved binary/alphanumeric string',
        'By deleting longitude values',
        'By converting coordinates to IP addresses',
        'By rounding all numbers to integers'
      ],
      correctAnswerIndex: 0,
      explanation: 'Geohash interleaves bits of latitude and longitude into a single string representation, turning 2D spatial queries into 1D prefix string matches.'
    },
    {
      id: 'q2',
      question: 'Why must a Geohash search query inspect the target Geohash grid cell AND its 8 surrounding neighbor grid cells?',
      options: [
        'Because two places can be physically adjacent (e.g. 5 meters apart) but lie on opposite sides of a Geohash grid boundary line',
        'Because 8 is a lucky number',
        'To prevent memory leak',
        'Because Geohashes expire every 8 seconds'
      ],
      correctAnswerIndex: 0,
      explanation: 'Points near a grid edge may share a border with a different Geohash prefix. Including the 8 surrounding neighbor cells guarantees no close places are missed.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'client', label: 'Rider / Mobile App', type: 'client', description: 'Sends Lat, Lng search query', x: 40, y: 160 },
      { id: 'lb', label: 'API Gateway', type: 'lb', description: 'Routes search traffic', x: 220, y: 160 },
      { id: 'svc', label: 'Proximity Search Service', type: 'service', description: 'Encodes Geohash & computes Haversine distance', x: 440, y: 160 },
      { id: 'redis', label: 'Redis Geohash Cache', type: 'cache', description: 'Caches business lists by Geohash grid key', x: 660, y: 80 },
      { id: 'es', label: 'Elasticsearch Cluster', type: 'service', description: 'Full-text + spatial multi-filter query', x: 660, y: 240 },
      { id: 'db', label: 'MySQL Metadata DB', type: 'db', description: 'Persistent business details master', x: 840, y: 240 }
    ],
    connections: [
      { from: 'client', to: 'lb', label: 'GET /search/nearby' },
      { from: 'lb', to: 'svc', label: 'Route Request' },
      { from: 'svc', to: 'redis', label: '1. Check 9 Geohash Cells' },
      { from: 'svc', to: 'es', label: '2. On Miss: ES Spatial Query' },
      { from: 'es', to: 'db', label: 'Fetch Metadata' },
      { from: 'svc', to: 'redis', label: '3. Populate Cache' }
    ]
  }
};
