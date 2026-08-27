import { SystemDesignTopic } from '../../types/systemDesign';

export const stockExchangeTopic: SystemDesignTopic = {
  id: 'stock-exchange',
  title: 'Stock Exchange (NASDAQ, NYSE)',
  subtitle: 'High-Frequency Matching Engine, Order Book & FIX Protocol',
  category: 'Distributed Systems',
  difficulty: 'Hard',
  frequencyRank: 25,
  editorial: {
    companies: ['NASDAQ', 'NYSE', 'Robinhood', 'Coinbase', 'Citadel Securities'],
    overview: 'Design an ultra-low latency Stock Exchange matching engine and order book capable of processing millions of buy/sell orders per second with strict Price-Time priority matching.',
    introduction: `Electronic stock exchanges (NASDAQ, NYSE) process financial limit orders, market orders, and cancellations with sub-millisecond execution speeds.

Key engineering requirements include single-threaded in-memory Matching Engines (LMAX Disruptor pattern), Order Book data structures (B-Tree + Doubly Linked List), FIX Protocol gateway integration, and deterministic audit event logging.`,
    requirements: {
      functional: [
        'Accept Limit Orders (Buy/Sell at specific price) and Market Orders (Buy/Sell immediately at best price).',
        'Match incoming orders based on Price-Time Priority (Price-Time FIFO rule).',
        'Maintain real-time Order Book depth (Level 1, Level 2, Level 3 quotes).',
        'Cancel open limit orders.'
      ],
      nonFunctional: [
        'Ultra-low latency execution: Sub-millisecond matching latency (< 100 microseconds).',
        'High throughput: Process 1 Million orders per second per ticker symbol.',
        'Strict Determinism: Same order sequence must produce exact same execution trades across replica nodes.',
        'Zero order loss: High availability with persistent WAL logging.'
      ],
      outOfScope: ['Floor pit hand gesture trading']
    },
    keyQuestions: {
      assumptions: [
        '5,000 Traded Ticker Symbols (e.g. AAPL, TSLA, MSFT)',
        '100 Million total orders placed per day',
        '100,000 orders/sec peak traffic across all tickers'
      ],
      calculations: [
        { label: 'Matching Latency Target', value: '< 100 Microseconds', desc: 'In-memory single-threaded matching loop' },
        { label: 'Order Book Memory Size', value: '50 MB RAM / Ticker', desc: '100,000 active limit orders in RAM per ticker' },
        { label: 'Network Protocol', value: 'Binary SBE / FIX Protocol', desc: 'Simple Binary Encoding over TCP/Multicast' }
      ]
    },
    dataModel: {
      overview: 'In-Memory Order Book structure combining a Red-Black Tree / B-Tree of Price Levels + Doubly Linked List of Orders at each price level.',
      entities: [
        {
          name: 'orders',
          description: 'In-memory Order structure.',
          fields: [
            { name: 'order_id', type: 'BIGINT PRIMARY KEY', desc: '64-bit monotonically increasing ID' },
            { name: 'trader_id', type: 'VARCHAR(32)', desc: 'Broker account identifier' },
            { name: 'symbol', type: 'VARCHAR(16)', desc: 'Ticker symbol (e.g. AAPL)' },
            { name: 'side', type: 'VARCHAR(4)', desc: 'BUY | SELL' },
            { name: 'price', type: 'INT64', desc: 'Limit price in cents/micros' },
            { name: 'quantity', type: 'INT', desc: 'Share count' },
            { name: 'timestamp', type: 'INT64', desc: 'Nanosecond arrival timestamp' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'Binary FIX (Financial Information eXchange) Protocol over TCP socket connection.',
      endpoints: [
        {
          method: 'POST',
          path: 'tcp://fix.exchange.com:9800 (FIX Protocol)',
          params: 'Tags: 35=D (NewOrderSingle) | 55=AAPL | 54=1 (Buy) | 38=100 (Qty) | 44=150.00 (Price)',
          statusCode: 'ExecutionReport (35=8)',
          description: 'Submits binary FIX limit order message.'
        }
      ]
    },
    basicImplementation: {
      title: 'SQL Database Order Matching',
      description: 'Stores orders in MySQL. Matches buy/sell orders via `SELECT * FROM orders WHERE side = "SELL" AND price <= 150 ORDER BY price ASC, timestamp ASC LIMIT 1`.',
      drawbacks: [
        'Database latency (> 10ms) is 100,000x too slow for high-frequency financial trading (< 100 microseconds).',
        'Database lock contention causes high latency spikes under concurrent order volume.'
      ]
    },
    advancedImplementation: {
      title: 'In-Memory Matching Engine (LMAX Disruptor Ring Buffer) + Order Book (Tree + Doubly Linked List)',
      description: `1. Order Book Architecture:
   - Maintains two sorted trees: Buy Tree (Bids sorted descending) and Sell Tree (Asks sorted ascending).
   - Each Node in the Price Tree points to a Doubly Linked List of orders at that exact price level.
   - Insertion, Cancellation, and Lookup run in O(1) or O(log P) where P is distinct price levels.

2. Price-Time Priority Matching Algorithm:
   - When a new Buy order arrives at Price $150:
   - Compare with lowest Ask price in Sell Tree.
   - If Ask <= $150: Match with first order in Doubly Linked List at lowest Ask price!
   - Repeat until Buy quantity is filled or no matching Ask prices remain. If remaining qty > 0, insert rest into Buy Order Book.

3. Single-Threaded Execution Loop (LMAX Disruptor):
   - To eliminate multi-threaded lock contention, each Ticker Symbol is assigned to a dedicated single-threaded CPU core event loop processing a Ring Buffer memory queue.`,
      components: [
        { name: 'FIX Gateway Cluster', role: 'Protocol Converter', details: 'Translates binary FIX messages & validates API keys.' },
        { name: 'Sequencer (WAL)', role: 'Deterministic Event Log', details: 'Appends order events to Write-Ahead-Log before matching.' },
        { name: 'Matching Engine Core', role: 'In-memory Price-Time Matcher', details: 'Single-threaded LMAX Disruptor CPU ring buffer.' },
        { name: 'Market Data Publisher', role: 'UDP Multicast Feed', details: 'Streams real-time ticker quotes (ITCH/OUCH) to traders.' }
      ]
    },
    flows: [
      {
        title: 'Order Placement & Matching Flow',
        description: 'Executing a limit buy order.',
        steps: [
          'Broker sends FIX NewOrderSingle message (Buy 100 AAPL @ $150.00).',
          'FIX Gateway validates broker credit limits.',
          'Sequencer assigns global sequence number and writes to Write-Ahead Log (WAL).',
          'Sequencer pushes order to AAPL Matching Engine Ring Buffer.',
          'Matching Engine compares Buy $150 against lowest Sell Ask in Order Book.',
          'Match Found at $149.95 (50 shares) -> Emits Trade Execution Report (50 shares filled).',
          'Remaining 50 shares appended to $150.00 Buy Order Book Doubly Linked List.',
          'Market Data Publisher broadcasts ITCH multicast message to all market participants.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Determinism & Replayability', details: 'If a matching engine node hardware crashes, a replacement node reads the Sequencer WAL log from sequence #1 and rebuilds the exact in-memory Order Book state deterministically.' },
      { topic: 'Colocation & Kernel Bypass', details: 'High-frequency trading firms pay for physical server colocation in the same datacenter as the exchange, using Solarflare SolarCapture kernel bypass network cards (Solarflare EF_VI) to skip OS TCP stack overhead.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'Why do high-performance stock exchange matching engines use single-threaded event loops (LMAX Disruptor) instead of multi-threaded locking?',
      options: [
        'Single-threaded execution on a dedicated CPU core eliminates thread context switches, mutex lock contention, and cache misses, enabling sub-microsecond matching speeds',
        'Because multi-threading is illegal in stock trading',
        'Single-threaded code uses less disk space',
        'Because C++ does not support threads'
      ],
      correctAnswerIndex: 0,
      explanation: 'Removing multi-threaded mutex locking avoids CPU cache invalidation and thread context switching, allowing a single CPU core to execute millions of matches per second.'
    },
    {
      id: 'q2',
      question: 'Which rule dictates the order in which limit orders at the exact same price level are executed in an Order Book?',
      options: [
        'Price-Time Priority (FIFO - First order placed at that price level gets matched first)',
        'Random Selection',
        'Largest Order First',
        'Alphabetical by Broker Name'
      ],
      correctAnswerIndex: 0,
      explanation: 'Price-Time Priority guarantees fairness: orders at better prices match first; at the same price level, orders are matched in FIFO order based on arrival timestamp.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'trader', label: 'HFT / Broker Client', type: 'client', description: 'Sends FIX binary order message', x: 40, y: 160 },
      { id: 'fixGw', label: 'FIX Gateway Cluster', type: 'service', description: 'Parses binary FIX protocol & checks limits', x: 240, y: 160 },
      { id: 'seq', label: 'Sequencer (WAL)', type: 'queue', description: 'Assigns global sequence number & writes WAL log', x: 440, y: 160 },
      { id: 'engine', label: 'Matching Engine Core', type: 'service', description: 'Single-threaded LMAX Disruptor CPU core', x: 660, y: 160 },
      { id: 'book', label: 'In-Memory Order Book', type: 'cache', description: 'Price Tree + Doubly Linked List of Bids & Asks', x: 660, y: 40 },
      { id: 'mktData', label: 'Market Data Feed', type: 'service', description: 'UDP Multicast ITCH/OUCH market quote feed', x: 880, y: 160 }
    ],
    connections: [
      { from: 'trader', to: 'fixGw', label: 'FIX TCP Message' },
      { from: 'fixGw', to: 'seq', label: '1. Sequence Order' },
      { from: 'seq', to: 'engine', label: '2. Push to Ring Buffer' },
      { from: 'engine', to: 'book', label: '3. Match Bids/Asks' },
      { from: 'engine', to: 'mktData', label: '4. Broadcast Trade Fill' },
      { from: 'mktData', to: 'trader', label: 'UDP Multicast Feed' }
    ]
  }
};
