import { SystemDesignTopic } from '../../types/systemDesign';

export const googleMapsTopic: SystemDesignTopic = {
  id: 'google-maps',
  title: 'Google Maps',
  subtitle: 'Map Tile Rendering, Routing & Shortest Path (Dijkstra/A*)',
  category: 'Distributed Systems',
  difficulty: 'Hard',
  frequencyRank: 27,
  editorial: {
    companies: ['Google', 'Apple (Apple Maps)', 'Uber', 'Baidu', 'Mapbox'],
    overview: 'Design a digital mapping and navigation service capable of serving vector map tiles worldwide, calculating optimal driving directions, and providing real-time turn-by-turn navigation.',
    introduction: `Google Maps serves over 1 Billion monthly active users searching addresses, viewing interactive map tiles, and routing turn-by-turn driving directions.

Key architectural topics include Vector Map Tile hierarchy (S2 Geometry), shortest path routing algorithms (A* Search & Contraction Hierarchies), location geocoding, and real-time traffic speed aggregation.`,
    requirements: {
      functional: [
        'Render interactive map view with smooth zoom levels and panning.',
        'Geocoding: Convert address strings to (Lat, Lng) coordinates and vice versa.',
        'Route Planning: Calculate shortest/fastest driving route between origin and destination points.',
        'Turn-by-Turn Navigation with real-time ETA updates based on traffic congestion.'
      ],
      nonFunctional: [
        'Fast map tile rendering (< 50ms tile delivery worldwide).',
        'Fast route calculation (< 1 second for 1,000 km route).',
        'Scalable to 1 Billion users and 50 Billion tile requests per day.',
        'High availability and global CDN distribution.'
      ],
      outOfScope: ['Submarine underwater sonar mapping']
    },
    keyQuestions: {
      assumptions: [
        '1 Billion Daily Active Users (DAU)',
        '50 Billion map tile requests per day',
        '500 Million route planning queries per day'
      ],
      calculations: [
        { label: 'Map Tile Storage (Vector)', value: '100 TB', desc: 'Pre-rendered vector tiles across 21 zoom levels' },
        { label: 'Road Network Graph Size', value: '50 GB RAM', desc: 'Global road segment graph (Nodes: Intersections, Edges: Roads)' },
        { label: 'Map Tile CDN Egress', value: '5.8 Gbps', desc: '50B tiles * 10 KB average vector tile size' }
      ]
    },
    dataModel: {
      overview: 'Directed Weighted Graph (In-Memory Routing Nodes) + Hierarchical Tile Store (S2 Cell Geometry in CDN).',
      entities: [
        {
          name: 'road_nodes',
          description: 'Intersection node in road network graph.',
          fields: [
            { name: 'node_id', type: 'BIGINT PRIMARY KEY', desc: 'Unique node ID' },
            { name: 'latitude', type: 'DOUBLE', desc: 'Latitude coordinate' },
            { name: 'longitude', type: 'DOUBLE', desc: 'Longitude coordinate' }
          ]
        },
        {
          name: 'road_edges',
          description: 'Road segment connecting two intersection nodes.',
          fields: [
            { name: 'edge_id', type: 'BIGINT PRIMARY KEY', desc: 'Unique edge ID' },
            { name: 'start_node_id', type: 'BIGINT', desc: 'Origin intersection' },
            { name: 'end_node_id', type: 'BIGINT', desc: 'Destination intersection' },
            { name: 'distance_meters', type: 'INT', desc: 'Physical road distance' },
            { name: 'speed_limit_kmh', type: 'INT', desc: 'Speed limit' },
            { name: 'current_speed_kmh', type: 'INT', desc: 'Real-time traffic live speed' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'Vector Tile CDN URL + Routing gRPC API.',
      endpoints: [
        {
          method: 'GET',
          path: 'https://tiles.maps.com/{zoom}/{x}/{y}.mvt',
          params: '',
          statusCode: '200 OK',
          description: 'Fetches Mapbox Vector Tile (MVT) binary for specific zoom grid.'
        },
        {
          method: 'POST',
          path: '/v1/directions',
          params: '{ "origin": { "lat": 37.7749, "lng": -122.4194 }, "destination": { "lat": 37.3382, "lng": -121.8863 } }',
          statusCode: '200 OK',
          description: 'Calculates fastest driving route and polyline geometry.'
        }
      ]
    },
    basicImplementation: {
      title: 'Dijkstra Algorithm over Relational DB',
      description: 'Executes standard Dijkstra algorithm querying SQL DB for road edges on every step of path finding.',
      drawbacks: [
        'Extremely slow: Running Dijkstra on a global graph of 100M nodes queries DB millions of times, taking 30+ seconds per route!',
        'Fails the 1-second routing latency target.'
      ]
    },
    advancedImplementation: {
      title: 'Vector Map Tiles (S2 Cell CDN) + Contraction Hierarchies (A* Search) + Traffic Stream',
      description: `1. Map Tile Rendering (S2 Geometry & MVT):
   - World map is divided into quadtree tiles across 21 zoom levels using Google S2 Geometry.
   - Vector Tiles (Mapbox Vector Tile format) store lightweight geometry coordinates (lines/polygons) instead of heavy PNG images, allowing client GPUs to render smooth 60fps maps.
   - Vector tiles are pre-generated and cached 99.9% at CDN edge locations.

2. Shortest Path Routing (Contraction Hierarchies):
   - Standard Dijkstra/A* is too slow for long-distance routing.
   - Contraction Hierarchies (CH) pre-computes "shortcut" edges over major highways (e.g. I-95).
   - Reduces routing search graph size from 100M local road nodes down to a few thousand highway shortcuts, calculating 1,000 km routes in < 50 milliseconds!

3. Real-Time Traffic Speed Stream:
   - Live location telemetry from active driver phones streams to Kafka.
   - Traffic Engine calculates real-time speed per road edge, dynamically updating weights in the Routing Graph memory.`,
      components: [
        { name: 'Tile CDN Network', role: 'Map Tile Delivery', details: 'Delivers 50B vector MVT map tiles/day.' },
        { name: 'Routing Engine (CH / A*)', role: 'Path Finder', details: 'Executes Contraction Hierarchies search in RAM.' },
        { name: 'Traffic Speed Aggregator', role: 'Live Speed Update', details: 'Updates road edge weights from driver GPS telemetry.' },
        { name: 'Geocoding Service (Elasticsearch)', role: 'Address Finder', details: 'Converts textual addresses to (Lat, Lng) coordinates.' }
      ]
    },
    flows: [
      {
        title: 'Route Calculation Flow',
        description: 'Generating driving directions between two points.',
        steps: [
          'User enters destination address string in search bar.',
          'Geocoding Service converts address to (37.3382, -121.8863) via Elasticsearch spatial index.',
          'Client submits POST /v1/directions with origin and destination coordinates.',
          'Routing Engine snaps origin & destination points to nearest road graph nodes.',
          'Routing Engine executes Contraction Hierarchies (CH) search in memory, using real-time traffic edge weights.',
          'Returns polyline geometry string, ETA duration, and step-by-step turn navigation instructions in < 100ms.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Hierarchical Road Networks', details: 'Route planner queries local streets only near origin and destination, switching to high-speed highway graph shortcuts for 95% of the route distance.' },
      { topic: 'Offline Map Downloading', details: 'Pre-downloads compressed S2 cell vector tiles and local CH routing graphs directly to phone storage for offline navigation.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'Why is Contraction Hierarchies (CH) algorithm used instead of standard Dijkstra for long-distance map routing?',
      options: [
        'It pre-computes highway shortcut edges, reducing route search graph size from millions of local street nodes to thousands of highway nodes for < 50ms response times',
        'It deletes all road traffic data',
        'It converts maps into text files',
        'It requires zero RAM'
      ],
      correctAnswerIndex: 0,
      explanation: 'Contraction Hierarchies pre-computes highway shortcuts, bypassing minor street evaluations and calculating long-distance routes up to 1,000x faster than raw Dijkstra.'
    },
    {
      id: 'q2',
      question: 'What is the primary advantage of Mapbox Vector Tiles (MVT) over traditional raster PNG map tiles?',
      options: [
        'Vector tiles store raw geometry lines/polygons in tiny binary files, allowing client GPUs to render sharp 60fps maps with zero pixelation during zoom',
        'Vector tiles use 100x more memory',
        'Vector tiles cannot be cached on CDNs',
        'PNG images are faster than vector math'
      ],
      correctAnswerIndex: 0,
      explanation: 'Vector tiles transfer lightweight coordinate data that client GPUs render dynamically, enabling instant theme styling, smooth 3D tilting, and sharp high-DPI scaling.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'client', label: 'Google Maps App', type: 'client', description: 'Renders MVT tiles & displays route', x: 40, y: 160 },
      { id: 'cdn', label: 'Tile CDN Edge', type: 'cdn', description: 'Caches pre-rendered vector S2 map tiles (99.9% hit rate)', x: 240, y: 80 },
      { id: 'api', label: 'Maps Gateway', type: 'lb', description: 'Routes geocoding & navigation queries', x: 240, y: 240 },
      { id: 'geo', label: 'Geocoding (Elasticsearch)', type: 'service', description: 'Converts address strings to (Lat, Lng)', x: 480, y: 160 },
      { id: 'router', label: 'Routing Engine (CH)', type: 'service', description: 'Contraction Hierarchies path finder in RAM', x: 480, y: 300 },
      { id: 'traffic', label: 'Traffic Speed Engine', type: 'service', description: 'Updates road edge weights from driver GPS', x: 700, y: 300 }
    ],
    connections: [
      { from: 'client', to: 'cdn', label: '1. GET /{z}/{x}/{y}.mvt' },
      { from: 'client', to: 'api', label: '2. POST /directions' },
      { from: 'api', to: 'geo', label: 'Geocode Address' },
      { from: 'api', to: 'router', label: 'Calculate Shortest Route' },
      { from: 'traffic', to: 'router', label: 'Update Edge Weights' }
    ]
  }
};
