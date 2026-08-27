import { SystemDesignTopic } from '../../types/systemDesign';

export const socialMediaTopic: SystemDesignTopic = {
  id: 'social-media',
  title: 'Social Media Platform (Instagram)',
  subtitle: 'Photo & Video Sharing with User Graph & Feed',
  category: 'Distributed Systems',
  difficulty: 'Hard',
  frequencyRank: 10,
  editorial: {
    companies: ['Meta', 'ByteDance', 'Snap', 'Pinterest', 'Twitter/X'],
    overview: 'Design a social media platform like Instagram supporting photo/video uploads, user follow graphs, activity feeds, likes, comments, and story updates.',
    introduction: `Instagram serves over 2 Billion monthly active users sharing billions of photos and videos daily.

Key architecture features include distributed storage for photo assets (S3/Haystack), graph relationship management (TAO / MySQL Sharding), feed delivery, and high-performance read caching.`,
    requirements: {
      functional: [
        'Users can upload photos and videos with captions and tags.',
        'Users can follow/unfollow other profiles.',
        'Users can view their personalized home feed of posts from accounts they follow.',
        'Users can like and comment on posts in real-time.'
      ],
      nonFunctional: [
        'High availability and durability for photo media.',
        'Fast post view latency (< 200ms).',
        'Scalable to handle 500 Million DAU and 100 Million daily photo uploads.',
        'Eventual consistency for like/comment counters.'
      ],
      outOfScope: ['AR Face Filter creation tool']
    },
    keyQuestions: {
      assumptions: [
        '500 Million DAU',
        '100 Million photo uploads per day (Average size 2 MB per image)',
        '2 Billion likes per day'
      ],
      calculations: [
        { label: 'Photo Storage / day', value: '200 TB / day', desc: '100M images * 2 MB average file size' },
        { label: '5-Year Storage', value: '365 PB', desc: '200 TB/day * 365 * 5 years' },
        { label: 'Like Writes QPS', value: '23,000 QPS', desc: '2 Billion likes / 86400 seconds' }
      ]
    },
    dataModel: {
      overview: 'Graph storage engine (Meta TAO) for social links combined with Cassandra/CockroachDB for posts and S3 for binary photos.',
      entities: [
        {
          name: 'posts',
          description: 'Photo and caption metadata.',
          fields: [
            { name: 'post_id', type: 'BIGINT PRIMARY KEY', desc: 'Snowflake 64-bit ID' },
            { name: 'user_id', type: 'BIGINT', desc: 'Author user ID' },
            { name: 'image_url', type: 'VARCHAR(512)', desc: 'CDN URL link to photo asset' },
            { name: 'caption', type: 'TEXT', desc: 'Post text caption' },
            { name: 'like_count', type: 'BIGINT', desc: 'Aggregated like counter' },
            { name: 'created_at', type: 'TIMESTAMP', desc: 'Timestamp' }
          ]
        },
        {
          name: 'likes',
          description: 'Post like relationship.',
          fields: [
            { name: 'post_id', type: 'BIGINT', desc: 'Target post ID' },
            { name: 'user_id', type: 'BIGINT', desc: 'Liking user ID' },
            { name: 'created_at', type: 'TIMESTAMP', desc: 'Timestamp' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'GraphQL or RESTful API endpoints.',
      endpoints: [
        {
          method: 'POST',
          path: '/v1/posts',
          params: '{ "imageUrl": "s3://bucket/img.jpg", "caption": "Hello world" }',
          statusCode: '201 Created',
          description: 'Publishes a new photo post.'
        },
        {
          method: 'POST',
          path: '/v1/posts/{postId}/likes',
          params: '',
          statusCode: '200 OK',
          description: 'Toggles or adds a like on a post.'
        }
      ]
    },
    basicImplementation: {
      title: 'Monolithic MySQL DB + Local Media Folder',
      description: 'Images uploaded directly to web server local disk. MySQL records posts, follows, likes, and comments with standard foreign key SQL JOINs.',
      drawbacks: [
        'Local disk runs out of space immediately.',
        'Database crashes under SQL join queries when computing timeline feeds across millions of users.',
        'Single point of failure.'
      ]
    },
    advancedImplementation: {
      title: 'Separated Media Storage (S3 + CDN) + Distributed Graph Cache (TAO / Redis) + Async Counter Buffer',
      description: `1. Media Storage: Photos are uploaded via CDN pre-signed URLs directly to Object Storage (AWS S3). Images are auto-compressed into multiple web formats (WebP/AVIF) and cached at CDN edge locations worldwide.

2. Feed & Graph Cache: User follow relationships and feed lists are cached in Memcached/Redis cluster using Meta TAO graph pattern (Objects + Associations).

3. Like Counter Buffering: High-frequency like actions bypass direct DB writes. Likes hit a Redis counter cache immediately and produce asynchronous events to Kafka. A stream processor flushes batched like counts to persistent storage every 10 seconds.`,
      components: [
        { name: 'Photo CDN (Cloudflare)', role: 'Asset Delivery', details: 'Caches compressed web photo formats worldwide.' },
        { name: 'Media Upload S3', role: 'Object Blob Store', details: 'Holds original high-res photo assets.' },
        { name: 'TAO / Redis Cache Cluster', role: 'Social Graph & Feed Cache', details: 'Stores user nodes and follow edges in memory.' },
        { name: 'Post DB (Cassandra / PostgreSQL Sharded)', role: 'Metadata Datastore', details: 'Stores post text, tags, and timestamps.' },
        { name: 'Kafka & Stream Counter', role: 'Async Like Aggregator', details: 'Batches like/comment counter increments to DB.' }
      ]
    },
    flows: [
      {
        title: 'Photo Post Upload Flow',
        description: 'Publishing a new photo post.',
        steps: [
          'Client requests upload pre-signed URL from API.',
          'Client uploads compressed image directly to S3.',
          'Client submits POST /v1/posts with image URL & caption.',
          'Post Service saves record to Sharded DB.',
          'Post Service triggers Fan-out Worker to insert post ID into active followers Redis timeline feeds.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Image Compression & Resizing', details: 'Client-side pre-compression combined with serverless Lambda edge workers generates 3 thumbnail variants (1080p, 640p, 150p thumbnail).' },
      { topic: 'Instagram Stories (24h Ephemeral Media)', details: 'Stories are stored in a dedicated Redis TTL cache set to auto-expire keys after 86,400 seconds (24 hours).' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'How does an architecture handle millions of concurrent post likes without locking database tables?',
      options: [
        'By buffering likes in an in-memory Redis cache and using Kafka to batch updates asynchronously to the persistent database',
        'By locking the post table for 1 second',
        'By rejecting likes over 100 per post',
        'By storing likes on user phone RAM'
      ],
      correctAnswerIndex: 0,
      explanation: 'In-memory counter incrementing combined with asynchronous batching removes database lock contention while preserving real-time UI updates.'
    },
    {
      id: 'q2',
      question: 'Where should user-uploaded high-resolution photo assets be stored in a social media architecture?',
      options: [
        'Distributed Object Storage (e.g. AWS S3) served via a Global Content Delivery Network (CDN)',
        'Inside MySQL BLOB columns',
        'On the web server local hard drive',
        'In Redis memory'
      ],
      correctAnswerIndex: 0,
      explanation: 'Object storage like S3 offers infinite scalability, durability, and cost efficiency for binary media files, while CDNs deliver them with sub-50ms latency.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'client', label: 'Instagram App Client', type: 'client', description: 'Uploads photos & views feed', x: 40, y: 160 },
      { id: 'lb', label: 'API Gateway', type: 'lb', description: 'Routes API traffic', x: 220, y: 160 },
      { id: 'cdn', label: 'CDN Edge Network', type: 'cdn', description: 'Caches images globally', x: 220, y: 300 },
      { id: 's3', label: 'AWS S3 Photo Store', type: 'storage', description: 'Stores raw & thumbnail photo assets', x: 440, y: 300 },
      { id: 'postSvc', label: 'Post Service', type: 'service', description: 'Handles post creation & likes', x: 440, y: 160 },
      { id: 'tao', label: 'Graph Cache (TAO / Redis)', type: 'cache', description: 'Social graph & feed cache', x: 660, y: 80 },
      { id: 'kafka', label: 'Kafka Like Stream', type: 'queue', description: 'Buffers like count increments', x: 660, y: 240 },
      { id: 'db', label: 'Sharded Cassandra DB', type: 'db', description: 'Persistent metadata store', x: 840, y: 240 }
    ],
    connections: [
      { from: 'client', to: 'lb', label: 'API Calls' },
      { from: 'client', to: 's3', label: 'Direct Image Upload' },
      { from: 'client', to: 'cdn', label: 'Fetch Images' },
      { from: 'lb', to: 'postSvc', label: 'Post / Like' },
      { from: 'postSvc', to: 'tao', label: 'Check Feed / Graph' },
      { from: 'postSvc', to: 'kafka', label: 'Async Like Event' },
      { from: 'kafka', to: 'db', label: 'Batch Write Counts' }
    ]
  }
};
