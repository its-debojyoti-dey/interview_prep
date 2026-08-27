import { SystemDesignTopic } from '../../types/systemDesign';

export const webCrawlerTopic: SystemDesignTopic = {
  id: 'web-crawler',
  title: 'Web Crawler',
  subtitle: 'Scalable Web Indexer & Robot',
  category: 'Distributed Systems',
  difficulty: 'Hard',
  frequencyRank: 6,
  editorial: {
    companies: ['Google', 'Microsoft', 'Baidu', 'Amazon', 'Yandex'],
    overview: 'Design a scalable web crawler capable of traversing billions of web pages, extracting content, detecting duplicate URLs, and respecting robot politeness constraints.',
    introduction: `A web crawler (spider) automatically downloads web pages, extracts outbound links, and feeds documents into search engine indexing pipelines.

Key engineering concerns include URL deduplication (Bloom Filter), DNS caching, HTML parsing, politeness rules (robots.txt delay), and distributed queue scheduling.`,
    requirements: {
      functional: [
        'Given seed URLs, recursively fetch and parse web pages.',
        'Extract links from fetched HTML pages and enqueue new unvisited URLs.',
        'Respect robots.txt rules and domain politeness policies.',
        'Detect and discard duplicate URLs and duplicate web content.'
      ],
      nonFunctional: [
        'Scalability: Crawl 1 Billion web pages per month (~400 pages/sec).',
        'Politeness: Do not flood a target domain with aggressive concurrent requests.',
        'Extensibility: Support modular plugins for image, video, and PDF extraction.',
        'Fault Tolerance: Handle dead links, timeout hangs, and malformed HTML gracefully.'
      ],
      outOfScope: ['Deep Web password-protected content parsing']
    },
    keyQuestions: {
      assumptions: [
        '1 Billion web pages crawled per month',
        'Average page HTML content size = 500 KB',
        '400 pages downloaded per second'
      ],
      calculations: [
        { label: 'Download Bandwidth', value: '1.6 Gbps', desc: '400 pages/sec * 500 KB per page = 200 MB/s (1.6 Gbps)' },
        { label: 'Monthly Storage', value: '500 TB / month', desc: '1 Billion pages * 500 KB' },
        { label: 'URL Deduplication Filter', value: '1.2 GB RAM', desc: 'Bloom Filter storing 1B URLs with 1% false positive rate' }
      ]
    },
    dataModel: {
      overview: 'Distributed URL Frontier queue combined with document storage (S3/HDFS) and Bloom filter metadata.',
      entities: [
        {
          name: 'url_frontier',
          description: 'Queue storing pending URLs to crawl.',
          fields: [
            { name: 'url_hash', type: 'BYTES(16) PRIMARY KEY', desc: 'MD5 / Murmur3 hash of URL' },
            { name: 'url', type: 'TEXT', desc: 'Target full web URL' },
            { name: 'domain', type: 'VARCHAR(256)', desc: 'Host domain name' },
            { name: 'priority', type: 'INT', desc: 'Page rank importance score' },
            { name: 'next_crawl_at', type: 'TIMESTAMP', desc: 'Scheduled crawl execution timestamp' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'Internal worker queue API.',
      endpoints: [
        {
          method: 'POST',
          path: '/internal/v1/enqueue-urls',
          params: '{ "urls": ["https://example.com/page1"] }',
          statusCode: '200 OK',
          description: 'Accepts batch of extracted URLs for deduplication and queuing.'
        }
      ]
    },
    basicImplementation: {
      title: 'Single-Threaded BFS Crawler',
      description: 'Maintains a FIFO in-memory array of URLs. Pops URL, downloads page via HTTP GET, parses links using regex, and appends new URLs to array.',
      drawbacks: [
        'Extremely slow, single-threaded, blocked on network I/O.',
        'No politeness policy — risks getting banned by IP blocking or crashing smaller target websites.',
        'Out-of-memory crash when link count exceeds RAM size.'
      ]
    },
    advancedImplementation: {
      title: 'Distributed Politeness-Aware URL Frontier + Bloom Filter + Storage Cluster',
      description: `1. URL Frontier Architecture: Uses a two-stage queue mapping mechanism:
   - Priority Queue (Freshness/PageRank): Assigns URLs to priority queues based on importance.
   - Politeness Queue (Domain Router): Assigns all URLs for a specific domain (e.g., wikipedia.org) to a single domain queue. A Politeness Worker enforces a delay (e.g., 100ms) between consecutive requests to the same domain.

2. DNS Cache: Pre-resolves domain IP addresses in a local fast cache to avoid DNS query bottlenecks.

3. Bloom Filter & Checksum Deduplication:
   - URL Seen Test: Uses a Bloom Filter in RAM to check if a URL has already been discovered before enqueuing.
   - Content Duplicate Test: Calculates a 64-bit SimHash (Locality Sensitive Hash) of HTML document text to detect mirror or duplicate content.`,
      components: [
        { name: 'URL Frontier', role: 'Politeness Scheduler', details: 'Manages priority queues and politeness domain queues.' },
        { name: 'HTML Fetchers (Worker Pool)', role: 'Asynchronous HTTP Downloader', details: 'Executes parallel non-blocking I/O page downloads.' },
        { name: 'DNS Resolver Cache', role: 'IP Lookup Accelerator', details: 'Stores domain-to-IP mappings.' },
        { name: 'Bloom Filter Engine', role: 'Deduplication Guard', details: 'In-memory probabilistic set checking if URL was already seen.' },
        { name: 'Document Store (S3 / HDFS)', role: 'Raw Content Backup', details: 'Stores downloaded raw HTML documents for indexing.' }
      ]
    },
    flows: [
      {
        title: 'Crawl Execution Loop',
        description: 'Cycle of downloading and discovering web pages.',
        steps: [
          'Fetcher Worker retrieves next available URL from URL Frontier Politeness Queue.',
          'Fetcher checks local DNS Cache for domain IP address.',
          'Fetcher downloads HTML page and checks robots.txt policy.',
          'Document Parser extracts text and computes SimHash to verify content is unique.',
          'Link Extractor parses all href links from HTML document.',
          'Extracted URLs pass through Bloom Filter seen test.',
          'New unvisited URLs are pushed to URL Frontier Priority Queue.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Spider Trap Defense', details: 'Infinite directory recursion traps (e.g. /a/b/a/b/a/b...) are prevented by limiting max URL depth (e.g. max 10 depth) and URL character length limits.' },
      { topic: 'Dynamic Rendering (JavaScript Execution)', details: 'Pages relying heavily on React/Vue client-side rendering require headless browsers (Playwright/Puppeteer) to execute JS before HTML extraction.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'How does a Web Crawler enforce politeness to prevent overloading a single web host?',
      options: [
        'By routing all URLs for a specific domain to the same queue with a mandatory delay worker between requests',
        'By lowering internet speed',
        'By downloading pages only at night',
        'By ignoring domain names'
      ],
      correctAnswerIndex: 0,
      explanation: 'Assigning a single domain to a dedicated politeness queue ensures fetchers wait for a defined delay (e.g. 500ms) between consecutive requests to the same server.'
    },
    {
      id: 'q2',
      question: 'Which data structure is used to instantly check if a URL has already been visited with minimal memory usage?',
      options: ['Bloom Filter', 'Array List', 'Linked List', 'B-Tree'],
      correctAnswerIndex: 0,
      explanation: 'A Bloom Filter provides space-efficient probabilistic set membership testing, allowing billions of URL checks in lightweight RAM.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'seed', label: 'Seed URLs', type: 'client', description: 'Initial root URL list', x: 40, y: 160 },
      { id: 'frontier', label: 'URL Frontier Scheduler', type: 'service', description: 'Priority & Politeness Queues', x: 240, y: 160 },
      { id: 'bloom', label: 'Bloom Filter (Seen Test)', type: 'cache', description: 'Fast URL deduplication', x: 240, y: 300 },
      { id: 'fetchers', label: 'Fetcher Workers', type: 'service', description: 'Async HTTP page downloaders', x: 480, y: 160 },
      { id: 'dns', label: 'DNS Cache', type: 'cache', description: 'Cached domain IP resolution', x: 480, y: 40 },
      { id: 'parser', label: 'HTML Extractor & SimHash', type: 'service', description: 'Parses links & tests content uniqueness', x: 700, y: 160 },
      { id: 's3', label: 'S3 Document Store', type: 'storage', description: 'Stores raw HTML for search indexer', x: 700, y: 300 }
    ],
    connections: [
      { from: 'seed', to: 'frontier', label: 'Initialize Crawl' },
      { from: 'frontier', to: 'bloom', label: '1. Test If URL Seen' },
      { from: 'frontier', to: 'fetchers', label: '2. Dispatch Politeness Queue' },
      { from: 'fetchers', to: 'dns', label: 'Resolve IP' },
      { from: 'fetchers', to: 'parser', label: '3. Pass HTML' },
      { from: 'parser', to: 's3', label: '4. Save Document' },
      { from: 'parser', to: 'bloom', label: '5. Enqueue New Discovered Links' }
    ]
  }
};
