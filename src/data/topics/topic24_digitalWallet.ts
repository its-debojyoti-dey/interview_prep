import { SystemDesignTopic } from '../../types/systemDesign';

export const digitalWalletTopic: SystemDesignTopic = {
  id: 'digital-wallet',
  title: 'Digital Wallet (Venmo, Cash App)',
  subtitle: 'P2P Money Transfers, Two-Phase Commit & Balance Auditing',
  category: 'Infrastructure & Security',
  difficulty: 'Hard',
  frequencyRank: 24,
  editorial: {
    companies: ['PayPal (Venmo)', 'Block (Cash App)', 'Google (Google Pay)', 'Apple (Apple Cash)', 'Zelle'],
    overview: 'Design a Peer-to-Peer (P2P) digital wallet payment service allowing users to instantly transfer stored balance money to friends, cash out to bank accounts, and split bills safely.',
    introduction: `Digital wallet platforms process instant P2P money transfers between accounts. Transfers must strictly guarantee zero money creation or loss, sub-second execution, and high concurrency.

Core engineering topics include Two-Phase Commit (2PC) / Saga distributed transactions, balance locking strategies, double-entry financial ledgers, and fraud risk monitoring.`,
    requirements: {
      functional: [
        'Users can instantly transfer wallet balance to another user.',
        'Users can deposit money from bank accounts / debit cards into wallet balance.',
        'Users can cash out wallet balance to external bank accounts.',
        'View real-time transaction history and account balance.'
      ],
      nonFunctional: [
        'Strict Financial Consistency (ACID): Zero money duplication or loss under network failures.',
        'Low transfer latency: P2P wallet transfers executed in < 1 second.',
        'Scalable to 100 Million active users and 10,000 P2P transfer QPS.',
        'Security & Fraud Protection: Instant detection of compromised account transfers.'
      ],
      outOfScope: ['Physical paper check printing']
    },
    keyQuestions: {
      assumptions: [
        '50 Million Daily Active Users (DAU)',
        '50 Million P2P transactions per day',
        'Average 1,000 transfer QPS (10,000 peak QPS)'
      ],
      calculations: [
        { label: 'Ledger Storage / day', value: '50 GB / day', desc: '50M transactions * 1 KB double-entry records' },
        { label: 'Transaction Latency Budget', value: '< 500 ms', desc: 'Internal DB ledger update latency' },
        { label: 'DB Consistency Requirement', value: 'Strict Serializability', desc: 'Prevents negative balance overdraft race conditions' }
      ]
    },
    dataModel: {
      overview: 'PostgreSQL / CockroachDB with relational balance table + immutable double-entry ledger table.',
      entities: [
        {
          name: 'wallet_balances',
          description: 'User active stored balance table.',
          fields: [
            { name: 'user_id', type: 'BIGINT PRIMARY KEY', desc: 'User ID' },
            { name: 'balance', type: 'DECIMAL(12,2)', desc: 'Current available balance' },
            { name: 'currency', type: 'CHAR(3)', desc: 'USD | EUR | CAD' },
            { name: 'version', type: 'BIGINT', desc: 'Optimistic locking version counter' },
            { name: 'updated_at', type: 'TIMESTAMP', desc: 'Last update time' }
          ]
        },
        {
          name: 'p2p_transfers',
          description: 'Transfer execution state machine.',
          fields: [
            { name: 'transfer_id', type: 'UUID PRIMARY KEY', desc: 'Unique transfer ID' },
            { name: 'sender_id', type: 'BIGINT', desc: 'Sender user ID' },
            { name: 'receiver_id', type: 'BIGINT', desc: 'Receiver user ID' },
            { name: 'amount', type: 'DECIMAL(12,2)', desc: 'Transfer amount' },
            { name: 'status', type: 'VARCHAR(16)', desc: 'PENDING | COMPLETED | FAILED' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'RESTful API with mandatory idempotency key headers.',
      endpoints: [
        {
          method: 'POST',
          path: '/v1/transfers',
          params: 'Headers: Idempotency-Key: ik_abc | Body: { "receiverId": 456, "amount": 50.00, "note": "Dinner split" }',
          statusCode: '200 OK / 422 Unprocessable Entity (Insufficient Funds)',
          description: 'Executes atomic P2P balance transfer.'
        }
      ]
    },
    basicImplementation: {
      title: 'Separate SQL UPDATE Statements',
      description: 'Executes two separate SQL queries: `UPDATE balances SET balance = balance - 50 WHERE user_id = A;` then `UPDATE balances SET balance = balance + 50 WHERE user_id = B;`.',
      drawbacks: [
        'Partial failure risk: If database or server crashes after Statement 1 but before Statement 2, money disappears from User A without arriving at User B!',
        'No overdraft check: Concurrent requests can drop balance below $0.00.'
      ]
    },
    advancedImplementation: {
      title: 'Atomic Single-Database Transaction / Two-Phase Commit (2PC) + Optimistic Locking + Double-Entry Ledger',
      description: `1. Atomic Transaction Isolation:
   - For same-database P2P transfers, execute single SQL transaction:
     \`\`\`sql
     BEGIN TRANSACTION;
     UPDATE wallet_balances SET balance = balance - 50 WHERE user_id = A AND balance >= 50;
     -- Check affected rows == 1 (if 0, ROLLBACK Insufficient Funds)
     UPDATE wallet_balances SET balance = balance + 50 WHERE user_id = B;
     INSERT INTO ledger_journal (transfer_id, account_id, type, amount) VALUES (...);
     COMMIT;
     \`\`\`

2. Two-Phase Commit (2PC) for Cross-Database Partition Shards:
   - If User A and User B reside on separate database shards, a Distributed Transaction Coordinator manages Prepare and Commit phases to guarantee atomicity.

3. Real-Time Risk Engine:
   - Evaluates transfer velocity, IP origin, and device fingerprint before authorizing transfer to catch stolen account abuse.`,
      components: [
        { name: 'Wallet API Gateway', role: 'Idempotency Guard', details: 'Enforces idempotency keys & token validation.' },
        { name: 'Transfer Service', role: 'Transaction Engine', details: 'Manages SQL transactions & risk checks.' },
        { name: 'Risk & Fraud Engine', role: 'Scoring Service', details: 'Evaluates transaction risk score in real time.' },
        { name: 'PostgreSQL Balance Shards', role: 'ACID Balance Store', details: 'Executes atomic credit/debit updates.' },
        { name: 'Ledger Journal DB', role: 'Immutable Financial Audit', details: 'Appends double-entry debit/credit ledger records.' }
      ]
    },
    flows: [
      {
        title: 'P2P Transfer Flow',
        description: 'Executing P2P money transfer between two users.',
        steps: [
          'User A submits POST /v1/transfers ($50 to User B).',
          'Wallet API verifies `Idempotency-Key` key in Redis.',
          'Risk Engine evaluates transfer risk score (Pass).',
          'Transfer Service starts PostgreSQL ACID transaction.',
          'Deducts $50 from User A balance (`WHERE balance >= 50`). If balance < 50, rollback & return HTTP 422.',
          'Adds $50 to User B balance.',
          'Writes double-entry ledger entries. Commits transaction.',
          'Pushes real-time WebSocket notification "User A sent you $50" to User B device.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Handling Overdraft Race Conditions', details: 'Using conditional check (`WHERE balance >= amount`) inside the UPDATE statement or Optimistic Locking version columns prevents race conditions when a user fires 5 simultaneous $50 transfer requests with only $50 in their account.' },
      { topic: 'ACH Bank Cash Out Delay', details: 'Standard ACH bank transfers take 1-3 business days. Instant Cash Out utilizes Visa Direct / Mastercard Send push payment networks for 1% fee.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'How do we prevent a user from sending money if 5 simultaneous requests attempt to spend their last $50 balance concurrently?',
      options: [
        'By including a conditional constraint in the SQL UPDATE statement (`WHERE balance >= amount`) within an ACID transaction',
        'By restarting the server',
        'By allowing the balance to go negative',
        'By asking the user for a password'
      ],
      correctAnswerIndex: 0,
      explanation: 'Enforcing `WHERE balance >= amount` directly inside the atomic SQL UPDATE statement ensures that only one concurrent transaction succeeds, while the other 4 fail with 0 rows updated.'
    },
    {
      id: 'q2',
      question: 'What happens if a database crashes after deducting money from User A but before adding it to User B inside an ACID transaction?',
      options: [
        'The database automatically rolls back the entire transaction, restoring User A money completely',
        'Money is permanently lost',
        'User B balance goes to zero',
        'The bank pays for the loss'
      ],
      correctAnswerIndex: 0,
      explanation: 'ACID Atomicity guarantees that either ALL statements in a transaction succeed or NONE of them take effect (complete automatic rollback).'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'clientA', label: 'User A Mobile App', type: 'client', description: 'Sends $50 to User B', x: 40, y: 160 },
      { id: 'api', label: 'Wallet API Gateway', type: 'lb', description: 'Checks idempotency keys', x: 220, y: 160 },
      { id: 'risk', label: 'Risk & Fraud Engine', type: 'service', description: 'Evaluates transaction safety', x: 440, y: 80 },
      { id: 'transfer', label: 'Transfer Service', type: 'service', description: 'Executes atomic ACID transactions', x: 440, y: 240 },
      { id: 'db', label: 'PostgreSQL Balance DB', type: 'db', description: 'Holds balances & enforces WHERE balance >= amount', x: 660, y: 240 },
      { id: 'clientB', label: 'User B Mobile App', type: 'client', description: 'Receives instant payment push alert', x: 880, y: 240 }
    ],
    connections: [
      { from: 'clientA', to: 'api', label: 'POST /v1/transfers' },
      { from: 'api', to: 'risk', label: '1. Check Risk Score' },
      { from: 'api', to: 'transfer', label: '2. Execute Transfer' },
      { from: 'transfer', to: 'db', label: '3. Atomic SQL Transaction' },
      { from: 'transfer', to: 'clientB', label: '4. Push Notification' }
    ]
  }
};
