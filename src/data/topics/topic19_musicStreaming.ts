import { SystemDesignTopic } from '../../types/systemDesign';

export const musicStreamingTopic: SystemDesignTopic = {
  id: 'music-streaming',
  title: 'Music Streaming Service (Spotify)',
  subtitle: 'Audio Chunking, Offline Caching & Recommendation Engine',
  category: 'Distributed Systems',
  difficulty: 'Hard',
  frequencyRank: 19,
  editorial: {
    companies: ['Spotify', 'Apple (Apple Music)', 'Amazon Music', 'YouTube Music', 'Pandora'],
    overview: 'Design a music streaming platform supporting low-latency audio playback, playlist management, offline caching, and personalized recommendations (Discover Weekly).',
    introduction: `Music streaming services deliver instant gapless audio playback to hundreds of millions of active listeners worldwide.

Key architectural elements include audio file compression and chunking (Ogg Vorbis / AAC), CDN edge delivery, client-side pre-fetching buffers, and offline sync engines.`,
    requirements: {
      functional: [
        'Stream audio tracks seamlessly with minimal startup buffering (< 200ms).',
        'Create, edit, and share personalized playlists.',
        'Download songs for offline listening on mobile devices.',
        'Generate personalized recommendations (e.g. Discover Weekly playlist).'
      ],
      nonFunctional: [
        'Low audio startup latency (< 200ms).',
        'High availability: 99.99% uptime globally.',
        'Bandwidth optimization: Client audio pre-buffering to avoid playback gaps.',
        'Scalable to 500 Million listeners and 100 Million audio tracks.'
      ],
      outOfScope: ['Live concert ticket sales']
    },
    keyQuestions: {
      assumptions: [
        '100 Million total audio tracks in catalog',
        '200 Million Daily Active Listeners (DAU)',
        'Average user listens to 15 songs per day (3 minutes avg song duration)'
      ],
      calculations: [
        { label: 'Audio Storage (Catalog)', value: '500 TB', desc: '100M tracks * 5 MB average compressed file (320kbps Ogg Vorbis)' },
        { label: 'Streaming Bandwidth', value: '1.06 Tbps', desc: '200M users * 160 kbps average streaming rate' },
        { label: 'Audio Chunking Size', value: '512 KB per Block', desc: 'Sequential audio range chunks for instant player playback' }
      ]
    },
    dataModel: {
      overview: 'Metadata Store (PostgreSQL / CockroachDB) + Search Index (Elasticsearch) + Audio Binary CDN (AWS S3 + Cloudflare).',
      entities: [
        {
          name: 'tracks',
          description: 'Audio track metadata table.',
          fields: [
            { name: 'track_id', type: 'VARCHAR(32) PRIMARY KEY', desc: 'Unique track ID' },
            { name: 'title', type: 'VARCHAR(256)', desc: 'Song title' },
            { name: 'artist_id', type: 'BIGINT', desc: 'Artist identifier' },
            { name: 'duration_sec', type: 'INT', desc: 'Track duration in seconds' },
            { name: 'file_url', type: 'TEXT', desc: 'Master S3 CDN link' }
          ]
        },
        {
          name: 'playlists',
          description: 'User playlist structure.',
          fields: [
            { name: 'playlist_id', type: 'UUID PRIMARY KEY', desc: 'Playlist ID' },
            { name: 'user_id', type: 'BIGINT', desc: 'Owner user ID' },
            { name: 'name', type: 'VARCHAR(128)', desc: 'Playlist name' },
            { name: 'track_ids', type: 'ARRAY<VARCHAR(32)>', desc: 'Ordered array of track IDs' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'HTTP Range Request API for partial audio chunk streaming.',
      endpoints: [
        {
          method: 'GET',
          path: '/v1/tracks/{trackId}/stream',
          params: 'Header: Range: bytes=0-524287 (512 KB chunk)',
          statusCode: '206 Partial Content',
          description: 'Fetches partial audio chunk byte range for playback.'
        }
      ]
    },
    basicImplementation: {
      title: 'Monolithic Web Server & Full File Download',
      description: 'Client requests song -> Web server loads full 5MB audio file from local disk -> Client waits until full file downloads before playing.',
      drawbacks: [
        'High playback startup delay (user waits several seconds before song begins).',
        'Massive bandwidth waste if user skips song after 5 seconds.'
      ]
    },
    advancedImplementation: {
      title: 'HTTP Range Requests (Chunking) + Multi-Bitrate Encoding (Ogg Vorbis) + CDN Edge Caching + Client Buffer',
      description: `1. Audio Encoding & Chunking: Songs are encoded into multiple formats/bitrates (96kbps for 3G, 160kbps normal, 320kbps High Quality Ogg Vorbis). Files are split into 512 KB chunks.

2. HTTP Range Requests & Gapless Playback:
   - When user clicks Play, client player issues an HTTP Range Request (\`Range: bytes=0-524287\`) for the first 512 KB chunk. Playback starts in under 100ms.
   - Client pre-buffers the next 2 chunks in local RAM.
   - Pre-fetching: When current song reaches 10 seconds remaining, player pre-fetches the first chunk of the NEXT song in the playlist, guaranteeing gapless zero-delay transitions!

3. Offline Encrypted Caching: Downloaded tracks for offline listening are saved locally in encrypted AES-128 blob format to prevent piracy export.`,
      components: [
        { name: 'Audio CDN Network (Fastly/Cloudflare)', role: 'Edge Audio Streaming', details: 'Caches 512KB audio chunks worldwide near listeners.' },
        { name: 'Metadata Service (CockroachDB)', role: 'Catalog Database', details: 'Stores track, artist, album, and playlist structures.' },
        { name: 'Client Audio Engine', role: 'Pre-fetch Buffer & Player', details: 'Manages HTTP Range Requests & gapless song transitions.' },
        { name: 'Collaborative Filtering Pipeline (Spark)', role: 'Recommendation Machine', details: 'Computes Discover Weekly playlist vector embeddings.' }
      ]
    },
    flows: [
      {
        title: 'Song Playback & Streaming Flow',
        description: 'Initiating and playing a track.',
        steps: [
          'User clicks Play on song #101 in mobile app.',
          'Client fetches track metadata (bitrate, duration) via GET /v1/tracks/101.',
          'Client issues HTTP Range Request `GET /stream Range: bytes=0-524288` to CDN.',
          'CDN edge returns 206 Partial Content with first 512 KB audio chunk in 50ms.',
          'Audio player begins playback immediately.',
          'Client pre-fetches next chunks in background while music plays.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Collaborative Filtering (Discover Weekly)', details: 'Spotify uses Matrix Factorization (ALS algorithm) and Word2Vec playlist item embeddings to recommend songs frequently co-occurring in similar user playlists.' },
      { topic: 'Copyright Royalty Tracking', details: 'Every audio stream played past 30 seconds triggers an immutable log event to Kafka for artist royalty payment calculations.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'What HTTP header allows a music streaming client to request only the first 512 KB of an audio track for sub-100ms playback startup?',
      options: ['HTTP Range Header (e.g., Range: bytes=0-524287)', 'HTTP Authorization Header', 'HTTP Cookie Header', 'HTTP Host Header'],
      correctAnswerIndex: 0,
      explanation: 'HTTP Range Requests allow clients to fetch partial byte chunks from web servers and CDNs, enabling instant playback without downloading full files.'
    },
    {
      id: 'q2',
      question: 'How does a mobile music player achieve gapless playback between consecutive songs in a playlist?',
      options: [
        'By pre-fetching the first audio chunk of the next song into memory 10 seconds before the current song finishes',
        'By deleting the current song',
        'By stopping the music player for 5 seconds',
        'By increasing speaker volume'
      ],
      correctAnswerIndex: 0,
      explanation: 'Pre-buffering the next track in background memory while the current track finishes eliminates playback gaps between tracks.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'client', label: 'Spotify Client Player', type: 'client', description: 'HTTP Range requests & pre-fetch buffer', x: 40, y: 160 },
      { id: 'metaApi', label: 'Metadata API', type: 'lb', description: 'Track & playlist info gateway', x: 220, y: 80 },
      { id: 'cdn', label: 'CDN Audio Edge', type: 'cdn', description: 'Caches 512KB audio byte chunks', x: 440, y: 240 },
      { id: 's3', label: 'S3 Audio Store', type: 'storage', description: 'Master compressed audio tracks (320kbps Ogg)', x: 660, y: 240 },
      { id: 'db', label: 'CockroachDB Metadata', type: 'db', description: 'Track, artist, & playlist datastore', x: 440, y: 80 },
      { id: 'spark', label: 'Spark ML Pipeline', type: 'service', description: 'Computes Discover Weekly recommendations', x: 660, y: 80 }
    ],
    connections: [
      { from: 'client', to: 'metaApi', label: '1. GET Track Info' },
      { from: 'metaApi', to: 'db', label: 'Query Metadata' },
      { from: 'client', to: 'cdn', label: '2. GET Range: bytes=0-524287' },
      { from: 'cdn', to: 's3', label: 'Origin Pull' },
      { from: 'client', to: 'spark', label: 'Log Stream Event' }
    ]
  }
};
