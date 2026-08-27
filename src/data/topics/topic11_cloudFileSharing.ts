import { SystemDesignTopic } from '../../types/systemDesign';

export const cloudFileSharingTopic: SystemDesignTopic = {
  id: 'cloud-file-sharing',
  title: 'Cloud File Sharing Service (Dropbox, Google Drive)',
  subtitle: 'File Chunking, Sync Engine & Version Control',
  category: 'Distributed Systems',
  difficulty: 'Hard',
  frequencyRank: 11,
  editorial: {
    companies: ['Dropbox', 'Google', 'Microsoft (OneDrive)', 'Box', 'Apple (iCloud)'],
    overview: 'Design a cloud storage and file synchronization service capable of storing, syncing, and sharing large files across multiple devices with delta sync and block-level deduplication.',
    introduction: `Services like Dropbox and Google Drive allow users to back up, sync, and share files across desktop, web, and mobile devices seamlessly.

Key design problems involve breaking large files into small chunks (4MB blocks), delta sync (uploading only modified bytes), client sync algorithms, global metadata databases, and block-level deduplication.`,
    requirements: {
      functional: [
        'Users can upload, download, and update files from any device.',
        'Automatic cross-device file synchronization (changes on Laptop automatically reflect on Phone).',
        'File revision history / version control (restore previous file versions).',
        'Share files and folders with specific users via permission links.'
      ],
      nonFunctional: [
        'High reliability and zero data loss (99.999999999% 11 9s durability).',
        'Fast synchronization speed via delta sync (only upload modified file chunks).',
        'Bandwidth optimization: Block deduplication across all system storage.',
        'Scalable to 500 Million registered users storing Exabytes of data.'
      ],
      outOfScope: ['Collaborative real-time document text editing (Google Docs OT/CRDT)']
    },
    keyQuestions: {
      assumptions: [
        '50 Million Daily Active Users (DAU)',
        'Average user syncs 20 files per day (Average size 500 KB per file)',
        'Storage per user quota: 15 GB'
      ],
      calculations: [
        { label: 'Daily Upload Volume', value: '500 TB / day', desc: '50M DAU * 20 files * 500 KB' },
        { label: 'Total Storage Capacity', value: '750 Petabytes', desc: '50M active users * 15 GB allocation' },
        { label: 'Sync Chunk Size', value: '4 MB per Block', desc: 'Standard block size for deduplication & hashing' }
      ]
    },
    dataModel: {
      overview: 'Metadata DB (MySQL sharded / Spanner) tracking file namespace & chunk manifests + Block Store (S3) holding content blocks.',
      entities: [
        {
          name: 'files',
          description: 'Logical user file hierarchy table.',
          fields: [
            { name: 'file_id', type: 'UUID PRIMARY KEY', desc: 'Unique file ID' },
            { name: 'user_id', type: 'BIGINT', desc: 'Owner user ID' },
            { name: 'file_name', type: 'VARCHAR(256)', desc: 'File name' },
            { name: 'file_path', type: 'TEXT', desc: 'Directory folder path' },
            { name: 'latest_version', type: 'INT', desc: 'Current revision version number' },
            { name: 'created_at', type: 'TIMESTAMP', desc: 'Created timestamp' }
          ]
        },
        {
          name: 'file_blocks',
          description: 'Ordered list of 4MB SHA-256 chunk blocks composing a file version.',
          fields: [
            { name: 'file_id', type: 'UUID', desc: 'Target file ID' },
            { name: 'version', type: 'INT', desc: 'File version number' },
            { name: 'block_order', type: 'INT', desc: 'Sequence order of chunk block (0, 1, 2...)' },
            { name: 'block_hash', type: 'CHAR(64)', desc: 'SHA-256 hash checksum of 4MB block' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'Block-level Chunk Upload API + Metadata Sync WebSockets.',
      endpoints: [
        {
          method: 'POST',
          path: '/v1/blocks/upload',
          params: 'Body: Raw Binary (4MB) | Header: X-Block-SHA256',
          statusCode: '200 OK / 208 Already Reported (Deduplicated)',
          description: 'Uploads a 4MB chunk block if SHA-256 hash does not already exist in system.'
        },
        {
          method: 'POST',
          path: '/v1/files/commit-manifest',
          params: '{ "filePath": "/docs/paper.pdf", "blockHashes": ["sha1...", "sha2..."] }',
          statusCode: '201 Created',
          description: 'Commits updated file version manifest.'
        }
      ]
    },
    basicImplementation: {
      title: 'Monolithic Single-File Upload',
      description: 'Whenever a file is edited, the desktop client uploads the entire 500MB file to the server over HTTP.',
      drawbacks: [
        'Massive bandwidth waste: Editing a single word in a 500MB PDF requires re-uploading all 500MB.',
        'High failure rate on slow mobile connections.',
        'No storage deduplication.'
      ]
    },
    advancedImplementation: {
      title: 'Block Chunking (4MB) + Delta Sync Engine + Global Hash Deduplication + Metadata DB',
      description: `1. File Chunking & Hashing: Client breaks files into 4MB fixed or variable-size (Rabin Fingerprinting) blocks and computes a SHA-256 hash checksum for each block.

2. Global Deduplication: Client sends list of SHA-256 block hashes to Metadata Server before uploading. If a block hash already exists anywhere in S3 (e.g. popular video or installer file uploaded by another user), the server skips uploading that block, saving storage and bandwidth!

3. Delta Sync: When an existing file is modified, only modified blocks are re-hashed and uploaded.

4. Notification Sync Engine: Long polling or WebSockets notify connected devices when metadata manifests change, triggering background downloads of new blocks.`,
      components: [
        { name: 'Sync Client Daemon', role: 'Chunking & Sync Engine', details: 'Monitors file system changes, splits 4MB blocks, computes SHA-256.' },
        { name: 'Block Storage (S3 / HDFS)', role: 'Immutable Block Store', details: 'Stores unique 4MB binary blocks keyed by SHA-256 hash.' },
        { name: 'Metadata Service (CockroachDB)', role: 'File System Database', details: 'Stores user folder trees, file versions, and block manifests.' },
        { name: 'Notification Service (WebSockets)', role: 'Real-time Sync Trigger', details: 'Alerts client devices to download updated file manifests.' }
      ]
    },
    flows: [
      {
        title: 'File Sync & Upload Flow',
        description: 'Syncing a local file change to the cloud.',
        steps: [
          'Client sync daemon detects local file change.',
          'Splits file into 4MB blocks and computes SHA-256 hash for each block.',
          'Client calls `/v1/blocks/check-hashes` passing array of hashes.',
          'Metadata Server checks Hash DB. Returns list of missing block hashes.',
          'Client uploads ONLY missing 4MB blocks directly to Block Store (S3).',
          'Client calls `/v1/files/commit-manifest` to update file metadata version.',
          'Notification Service pushes WebSocket signal to user other devices to sync new version.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Rabin Fingerprinting (Variable Chunking)', details: 'Fixed 4MB chunking breaks if bytes are inserted at the beginning of a file (all subsequent block boundaries shift). Rabin Fingerprinting creates dynamic chunk boundaries based on content byte patterns.' },
      { topic: 'Cold Storage Archival (S3 Glacier)', details: 'Move inactive file versions (>6 months old) to AWS S3 Glacier to reduce storage costs by 80%.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'What is the purpose of Block-Level Deduplication using SHA-256 hashes in a cloud storage service like Dropbox?',
      options: [
        'If a 4MB block hash already exists in storage, the server skips uploading that chunk, saving network bandwidth and storage space',
        'It encrypts user passwords',
        'It converts PDF files into Word documents',
        'It speeds up web browser loading'
      ],
      correctAnswerIndex: 0,
      explanation: 'Deduplication compares chunk hash checksums across the entire system so identical data blocks are stored only once.'
    },
    {
      id: 'q2',
      question: 'Why is Delta Sync critical for desktop client file synchronization?',
      options: [
        'Only modified blocks are uploaded when a file is edited, instead of re-uploading the entire file',
        'Delta Sync increases screen resolution',
        'Delta Sync deletes old user accounts',
        'It allows files to be opened without internet'
      ],
      correctAnswerIndex: 0,
      explanation: 'Delta Sync uploads only the specific 4MB blocks that changed, turning a 1GB file modification into a tiny few-kilobyte patch upload.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'client', label: 'Desktop / Mobile Client', type: 'client', description: 'Splits 4MB blocks & computes SHA-256', x: 40, y: 160 },
      { id: 'metaSvc', label: 'Metadata API Service', type: 'service', description: 'Manages manifests & deduplication checks', x: 300, y: 80 },
      { id: 'hashDb', label: 'Block Hash DB', type: 'db', description: 'Global hash index of existing S3 blocks', x: 540, y: 80 },
      { id: 's3', label: 'AWS S3 Block Store', type: 'storage', description: 'Stores unique 4MB binary blocks', x: 540, y: 240 },
      { id: 'metaDb', label: 'Metadata DB (Spanner)', type: 'db', description: 'User file trees & block orders', x: 300, y: 240 },
      { id: 'notify', label: 'WebSocket Sync Trigger', type: 'service', description: 'Signals other user devices to pull changes', x: 740, y: 160 }
    ],
    connections: [
      { from: 'client', to: 'metaSvc', label: '1. Check Block Hashes' },
      { from: 'metaSvc', to: 'hashDb', label: 'Lookup Existing Hashes' },
      { from: 'client', to: 's3', label: '2. Upload Missing 4MB Blocks' },
      { from: 'client', to: 'metaSvc', label: '3. Commit File Manifest' },
      { from: 'metaSvc', to: 'metaDb', label: 'Save File Version' },
      { from: 'metaSvc', to: 'notify', label: '4. Push Sync Event' }
    ]
  }
};
