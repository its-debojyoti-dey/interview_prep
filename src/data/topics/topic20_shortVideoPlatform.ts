import { SystemDesignTopic } from '../../types/systemDesign';

export const shortVideoPlatformTopic: SystemDesignTopic = {
  id: 'short-video-platform',
  title: 'Short-Form Video Platform (TikTok, YouTube Shorts)',
  subtitle: 'Infinite Scroll, Real-Time Recommendation & Video Pre-fetching',
  category: 'Distributed Systems',
  difficulty: 'Hard',
  frequencyRank: 20,
  editorial: {
    companies: ['ByteDance (TikTok)', 'Google (YouTube Shorts)', 'Meta (Instagram Reels)', 'Snapchat'],
    overview: 'Design a short-form video streaming and discovery platform featuring infinite vertical scrolling, personalized recommendation feed generation, fast video playback pre-fetching, and creator uploads.',
    introduction: `TikTok revolutionized social media with its AI-driven "For You Page" (FYP) recommendation feed and instant vertical video swipe interface.

Key technical challenges include ultra-low latency video start times (< 100ms), personalized real-time machine learning recommendations (Monolith recommendation engine), pre-fetching next video segments in client memory, and handling petabyte-scale video transcoding.`,
    requirements: {
      functional: [
        'Users can swipe vertically through an endless personalized video feed.',
        'Creators can record, edit, and upload short videos (15s to 60s).',
        'Users can like, comment, share, and bookmark videos.',
        'Real-time personalized recommendation algorithms adapted to user watch time signals.'
      ],
      nonFunctional: [
        'Zero buffering delay on vertical swipe (< 50ms video start time).',
        'Scalable to 1 Billion Daily Active Users (DAU).',
        'Process 50 Billion video views per day.',
        'High real-time recommendation scoring latency (< 10ms per candidate).'
      ],
      outOfScope: ['Physical studio lighting hardware']
    },
    keyQuestions: {
      assumptions: [
        '1 Billion DAU spending average 60 minutes per day',
        '50 Billion video views per day (Average short video length: 15 seconds, size: 5 MB compressed)',
        '10 Million new video uploads per day'
      ],
      calculations: [
        { label: 'Video CDN Egress Bandwidth', value: '23.1 Tbps', desc: '50B views * 5 MB / 86400 seconds' },
        { label: 'New Video Storage / day', value: '50 TB / day', desc: '10M uploads * 5 MB average size' },
        { label: 'Client Pre-fetch Window', value: '3 Videos ahead', desc: 'Pre-downloads first 2 seconds of next 3 videos in memory' }
      ]
    },
    dataModel: {
      overview: 'Feature Store (Redis / ByteDance Monolith) for real-time user behavior + Cassandra for video metadata + S3/CDN for MP4 segments.',
      entities: [
        {
          name: 'short_videos',
          description: 'Short video record metadata.',
          fields: [
            { name: 'video_id', type: 'BIGINT PRIMARY KEY', desc: 'Snowflake 64-bit ID' },
            { name: 'author_id', type: 'BIGINT', desc: 'Creator user ID' },
            { name: 'video_url', type: 'VARCHAR(512)', desc: 'CDN MP4 URL' },
            { name: 'duration_sec', type: 'DECIMAL(4,2)', desc: 'Video duration' },
            { name: 'like_count', type: 'BIGINT', desc: 'Like total' },
            { name: 'created_at', type: 'TIMESTAMP', desc: 'Creation timestamp' }
          ]
        },
        {
          name: 'user_watch_signals',
          description: 'Real-time user engagement log stream.',
          fields: [
            { name: 'user_id', type: 'BIGINT', desc: 'Viewer ID' },
            { name: 'video_id', type: 'BIGINT', desc: 'Video ID' },
            { name: 'watch_time_ms', type: 'INT', desc: 'Milliseconds watched' },
            { name: 'completion_rate', type: 'FLOAT', desc: '% of video completed (e.g. 1.0 = 100%)' },
            { name: 'swiped_away_fast', type: 'BOOLEAN', desc: 'Skipped in < 1 second' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'gRPC / REST API for fetching FYP recommendation candidate batches.',
      endpoints: [
        {
          method: 'GET',
          path: '/v1/feed/fyp',
          params: '?count=10',
          statusCode: '200 OK',
          description: 'Fetches next 10 recommended short video items tailored to user.'
        },
        {
          method: 'POST',
          path: '/v1/telemetry/watch-signal',
          params: '{ "videoId": 101, "watchTimeMs": 14200, "completed": true }',
          statusCode: '200 OK',
          description: 'Streams real-time watch behavior to recommendation ML model.'
        }
      ]
    },
    basicImplementation: {
      title: 'Chronological SQL Database Feed',
      description: 'Queries latest uploaded short videos `SELECT * FROM videos ORDER BY created_at DESC LIMIT 10`. Client downloads full video file when swiped into view.',
      drawbacks: [
        'No personalization: Shows the exact same videos to all users regardless of interest.',
        'High swipe buffering delay: User sees loading spinner on every vertical swipe.'
      ]
    },
    advancedImplementation: {
      title: 'Real-Time Recommendation Engine (Monolith) + Dual-Buffer Pre-fetching + Edge CDN Chunking',
      description: `1. Recommendation Pipeline (For You Page):
   - Candidate Generation (Recall): Retrieves top 1,000 candidate videos using vector similarity search (FAISS / HNSW) matching user interest vector.
   - Deep Learning Ranking (Heavy Ranker): Neural network scores candidates based on probability of watch completion P(Complete), P(Like), and P(Share).
   - Diversity & Freshness Filter: Prevents showing 5 consecutive videos from the same creator.

2. Client-Side Dual-Buffer Pre-fetching:
   - When viewing Video #1, the mobile app silently downloads the first 2 seconds (the initial GOP cluster) of Video #2, Video #3, and Video #4 into device RAM!
   - When user swipes down, Video #2 plays INSTANTLY in 0ms without buffering!`,
      components: [
        { name: 'FYP Feed API', role: 'Recommendation Gateway', details: 'Returns personalized ranked video lists.' },
        { name: 'Vector Search Engine (FAISS/Milvus)', role: 'Candidate Recall Engine', details: 'Recalls top 1,000 similar candidate videos.' },
        { name: 'Real-Time ML Ranker (Monolith)', role: 'Neural Scoring Engine', details: 'Scores P(WatchCompletion) & P(Like) in < 10ms.' },
        { name: 'CDN Video Edge', role: 'Initial Segment Delivery', details: 'Delivers first 2-second video GOP chunks.' },
        { name: 'Kafka Telemetry Pipeline', role: 'Real-Time Signal Ingestion', details: 'Streams watch time metrics directly to online training model.' }
      ]
    },
    flows: [
      {
        title: 'Vertical Swipe & Pre-fetch Flow',
        description: 'User swiping through TikTok FYP feed.',
        steps: [
          'Client opens app and calls GET /v1/feed/fyp to fetch 10 video metadata objects.',
          'App starts playing Video 1.',
          'App background thread issues HTTP GET for initial 2-second MP4 chunks of Video 2, 3, and 4 to local RAM cache.',
          'User swipes down to Video 2 -> App plays pre-fetched RAM buffer instantly (0ms delay).',
          'App sends watch time telemetry POST /v1/telemetry/watch-signal (e.g. 100% watched).',
          'ML Model updates user real-time interest vector dynamically.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Watch Time as Primary ML Signal', details: 'Unlike Facebook where "Likes" drive recommendations, TikTok relies on granular watch time (did user re-watch the video 2x, or skip within 0.5s?).' },
      { topic: 'Audio/Sound Reuse', details: 'Tracks original audio clips across millions of video creations by mapping `sound_id` relationships in a graph index.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'How does TikTok achieve zero buffering delay (0ms latency) when a user swipes vertically to the next video?',
      options: [
        'By silently pre-fetching and caching the first 2 seconds of the next 3 upcoming videos into device RAM',
        'By lowering video resolution to 100 pixels',
        'By storing all videos on the phone',
        'By disabling video audio'
      ],
      correctAnswerIndex: 0,
      explanation: 'Pre-downloading the initial video segment (GOP) of upcoming videos in background memory guarantees instant playback when the user swipes.'
    },
    {
      id: 'q2',
      question: 'What is the most critical real-time user behavior signal used by TikTok recommendation neural networks?',
      options: [
        'Granular Watch Time and Video Completion Rate (re-watching vs skipping in < 1 second)',
        'User profile picture size',
        'Phone model brand',
        'Battery percentage'
      ],
      correctAnswerIndex: 0,
      explanation: 'Watch time completion rate is the highest-fidelity implicit signal of user engagement, outperforming explicit likes.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'client', label: 'TikTok Client App', type: 'client', description: 'Vertical swipe UI & pre-fetch RAM buffer', x: 40, y: 160 },
      { id: 'fypApi', label: 'FYP Feed API', type: 'lb', description: 'Fetches candidate recommendation batches', x: 240, y: 160 },
      { id: 'faiss', label: 'Vector Recall (FAISS)', type: 'service', description: 'Retrieves top 1000 candidate videos by interest vector', x: 480, y: 80 },
      { id: 'ranker', label: 'Real-Time ML Ranker', type: 'service', description: 'Scores P(Completion) using deep neural net', x: 480, y: 240 },
      { id: 'cdn', label: 'CDN Edge Network', type: 'cdn', description: 'Delivers 2s initial video GOP chunks', x: 700, y: 160 },
      { id: 'kafka', label: 'Kafka Telemetry Bus', type: 'queue', description: 'Streams watch time & swipe signals to online ML model', x: 240, y: 300 }
    ],
    connections: [
      { from: 'client', to: 'fypApi', label: '1. GET /feed/fyp' },
      { from: 'fypApi', to: 'faiss', label: 'Recall Candidates' },
      { from: 'faiss', to: 'ranker', label: 'Rank Candidates' },
      { from: 'client', to: 'cdn', label: '2. Pre-fetch Next 3 Video Chunks' },
      { from: 'client', to: 'kafka', label: '3. Stream Watch Telemetry' }
    ]
  }
};
