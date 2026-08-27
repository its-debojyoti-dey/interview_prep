import { SystemDesignTopic } from '../../types/systemDesign';

export const videoStreamingTopic: SystemDesignTopic = {
  id: 'video-streaming',
  title: 'Video Streaming Platform (YouTube, Vimeo)',
  subtitle: 'Adaptive Bitrate Video Encoding & CDN Delivery',
  category: 'Distributed Systems',
  difficulty: 'Hard',
  frequencyRank: 7,
  editorial: {
    companies: ['Google', 'Netflix', 'Amazon (Prime Video)', 'Twitch', 'Meta'],
    overview: 'Design a high-scale video uploading, encoding, and streaming platform capable of handling millions of concurrent video streams with adaptive resolution playback.',
    introduction: `Video streaming accounts for over 60% of total internet bandwidth. Platforms like YouTube process tens of thousands of video uploads per minute and stream petabytes of content to billions of viewers.

Key architectural concepts include Adaptive Bitrate Streaming (HLS/DASH), asynchronous video transcoding pipelines, CDN distribution edge caching, and blob storage chunking.`,
    requirements: {
      functional: [
        'Users can upload videos in various source formats (MP4, MOV, AVI).',
        'Users can stream videos smoothy with minimal buffering across mobile and desktop devices.',
        'Support adaptive bitrate playback (auto-switching between 360p, 720p, 1080p, 4K based on network speed).',
        'Video metadata search, view count tracking, and thumbnail generation.'
      ],
      nonFunctional: [
        'High availability and low video startup latency (< 2 seconds).',
        'Scalable transcoding architecture to handle 500 hours of uploaded video per minute.',
        'Cost-effective CDN edge caching and video chunk storage.',
        'Global low jitter content delivery network.'
      ],
      outOfScope: ['Live P2P video conferencing']
    },
    keyQuestions: {
      assumptions: [
        '1 Billion Daily Active Users (DAU)',
        '5 Million video uploads per day (Average size 300 MB raw)',
        '5 Billion video views per day (Average 5 minutes playback per view)'
      ],
      calculations: [
        { label: 'Raw Upload Storage', value: '1.5 PB / day', desc: '5 Million uploads * 300 MB raw file size' },
        { label: 'Encoded Storage (Multi-bitrate)', value: '3 PB / day', desc: 'Each video transoded into 5 resolutions (1080p, 720p, 480p, 360p, 240p)' },
        { label: 'Streaming Egress Bandwidth', value: '11.5 Tbps', desc: '5B views * 5 mins * 2 Mbps average bitrate / 86400 secs' }
      ]
    },
    dataModel: {
      overview: 'Separation of metadata store (MySQL/CockroachDB) and Object Blob Store (AWS S3) for encoded chunk files.',
      entities: [
        {
          name: 'videos',
          description: 'Video metadata table.',
          fields: [
            { name: 'video_id', type: 'VARCHAR(32) PRIMARY KEY', desc: 'Unique video identifier' },
            { name: 'user_id', type: 'BIGINT', desc: 'Uploader user ID' },
            { name: 'title', type: 'VARCHAR(256)', desc: 'Video title' },
            { name: 'status', type: 'VARCHAR(32)', desc: 'UPLOADING | TRANSCODING | READY | FAILED' },
            { name: 'manifest_url', type: 'TEXT', desc: 'HLS (.m3u8) master manifest file URL' },
            { name: 'created_at', type: 'TIMESTAMP', desc: 'Upload timestamp' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'Pre-signed URL direct S3 upload + HLS streaming manifest URL.',
      endpoints: [
        {
          method: 'POST',
          path: '/v1/videos/upload-url',
          params: '{ "filename": "my_video.mp4", "fileSize": 104857600 }',
          statusCode: '200 OK',
          description: 'Returns pre-signed S3 upload URL for direct client multipart binary upload.'
        },
        {
          method: 'GET',
          path: '/v1/videos/{videoId}/manifest.m3u8',
          params: '',
          statusCode: '200 OK',
          description: 'Fetches master HLS manifest file detailing available resolutions and segment TS file URLs.'
        }
      ]
    },
    basicImplementation: {
      title: 'Monolithic Web Server & MP4 File Download',
      description: 'Client uploads full MP4 file directly to application server. Server saves MP4 file on local disk and serves raw file download via HTTP.',
      drawbacks: [
        'Massive bandwidth bottleneck on app server.',
        'No adaptive playback: User must download huge file even on slow 3G mobile connections.',
        'High video start latency (playback cannot begin until metadata and first mega-bytes are downloaded).'
      ]
    },
    advancedImplementation: {
      title: 'Distributed Asynchronous Transcoding Queue + HLS Chunking + Multi-CDN Edge Delivery',
      description: `1. Direct S3 Upload: Client requests a pre-signed S3 URL and uploads raw video chunks directly to S3 Raw Bucket, completely bypassing app servers.

2. Transcoding Pipeline: S3 upload completion triggers an event to Apache Kafka queue. Transcoding Workers (FFmpeg cluster) slice the video into 10-second TS chunks and encode them into multiple resolutions (1080p, 720p, 480p) using HLS protocol format.

3. Master Manifest (.m3u8): Transcoder generates master manifest file listing chunk paths for each bitrate.

4. Adaptive Streaming (HLS): Client player fetches .m3u8 manifest file and dynamically measures current network bandwidth. If connection drops, player seamlessly requests lower resolution 360p chunks without stopping playback.`,
      components: [
        { name: 'S3 Raw Storage Bucket', role: 'Raw File Receiver', details: 'Direct client multipart upload target.' },
        { name: 'Kafka / Transcoding Queue', role: 'Job Pipeline', details: 'Buffers transcoding jobs across worker pool.' },
        { name: 'FFmpeg Transcoder Workers', role: 'Chunking & Encoding Engine', details: 'Slices video into 10s HLS chunks and encodes resolutions.' },
        { name: 'S3 Encoded Bucket', role: 'Segment Storage', details: 'Stores master manifest (.m3u8) and TS video segments.' },
        { name: 'CDN Network (Cloudflare/Fastly)', role: 'Edge Content Delivery', details: 'Caches 10s video chunks worldwide near end users.' }
      ]
    },
    flows: [
      {
        title: 'Video Upload & Transcode Flow',
        description: 'Processing newly uploaded video.',
        steps: [
          'Client requests pre-signed URL from API Gateway.',
          'Client uploads raw MP4 file directly to S3 Raw Bucket via multipart upload.',
          'S3 fires `ObjectCreated` notification event to Kafka Transcoding Queue.',
          'FFmpeg Transcoder Worker claims job, downloads raw video, and splits it into 10s chunks.',
          'Worker encodes chunks into HLS formats (1080p, 720p, 480p) and generates master.m3u8 manifest.',
          'Worker uploads encoded chunks and manifest to S3 Output Bucket.',
          'DB status updated to READY; CDN cache invalidation triggered.'
        ]
      },
      {
        title: 'Video Streaming Playback Flow',
        description: 'User watching video on device.',
        steps: [
          'Client opens video page and fetches master.m3u8 manifest URL.',
          'Player reads manifest and requests initial 360p chunk 0.ts from CDN.',
          'CDN edge server checks local cache. If hit, returns binary TS chunk instantly.',
          'Player measures download speed of chunk 0.ts.',
          'If speed is high (>10 Mbps), player automatically requests chunk 1.ts in 1080p resolution for HD playback.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'HLS vs DASH Protocols', details: 'HLS (HTTP Live Streaming) by Apple uses TS/fMP4 chunks. DASH (Dynamic Adaptive Streaming over HTTP) is an open international standard. Modern players support both.' },
      { topic: 'DRM Digital Rights Management', details: 'Encrypted video chunks using AES-128 key exchange with Apple FairPlay or Google Widevine to prevent unauthorized downloading.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'What is the main advantage of Adaptive Bitrate Streaming (e.g. HLS) over standard MP4 video downloads?',
      options: [
        'The video player automatically switches between high and low resolutions based on real-time internet speed without interrupting playback',
        'Videos take zero disk space',
        'HLS encrypts all text comments',
        'MP4 files cannot be played on mobile phones'
      ],
      correctAnswerIndex: 0,
      explanation: 'HLS splits videos into short chunks at multiple bitrates, allowing the video player to switch resolutions on the fly to prevent buffering spinner drops.'
    },
    {
      id: 'q2',
      question: 'Why upload raw video files directly to S3 using pre-signed URLs instead of passing files through application servers?',
      options: [
        'Uploading directly to S3 offloads heavy network bandwidth and file I/O away from application servers',
        'S3 is faster than memory',
        'Pre-signed URLs convert videos automatically',
        'Application servers cannot accept POST requests'
      ],
      correctAnswerIndex: 0,
      explanation: 'Direct S3 uploads eliminate app server bandwidth saturation and CPU overhead, letting cloud storage handle massive binary file ingest directly.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'client', label: 'Client App / Player', type: 'client', description: 'Uploads raw video & streams HLS chunks', x: 40, y: 160 },
      { id: 'api', label: 'API Gateway', type: 'lb', description: 'Generates pre-signed URLs', x: 220, y: 80 },
      { id: 's3raw', label: 'S3 Raw Upload Bucket', type: 'storage', description: 'Receives direct raw file upload', x: 400, y: 80 },
      { id: 'kafka', label: 'Transcode Queue (Kafka)', type: 'queue', description: 'Buffers encoding tasks', x: 580, y: 80 },
      { id: 'ffmpeg', label: 'FFmpeg Transcoder Cluster', type: 'service', description: 'Slices & encodes multi-bitrate HLS chunks', x: 760, y: 80 },
      { id: 's3out', label: 'S3 Encoded Bucket', type: 'storage', description: 'Stores .m3u8 manifest & .ts segments', x: 760, y: 240 },
      { id: 'cdn', label: 'CDN Edge Network', type: 'cdn', description: 'Caches 10s video chunks globally', x: 400, y: 240 }
    ],
    connections: [
      { from: 'client', to: 'api', label: '1. GET Pre-signed URL' },
      { from: 'client', to: 's3raw', label: '2. Upload Raw Binary' },
      { from: 's3raw', to: 'kafka', label: '3. Trigger Event' },
      { from: 'kafka', to: 'ffmpeg', label: '4. Claim Encoding Job' },
      { from: 'ffmpeg', to: 's3out', label: '5. Upload Chunks' },
      { from: 's3out', to: 'cdn', label: 'Origin Pull' },
      { from: 'client', to: 'cdn', label: '6. Stream Adaptive Chunks' }
    ]
  }
};
