import { SystemDesignTopic } from '../../types/systemDesign';

export const paymentGatewayTopic: SystemDesignTopic = {
  id: 'payment-gateway',
  title: 'Payment Gateway (Stripe)',
  subtitle: 'Idempotency, Financial Ledger & Payment Processing',
  category: 'Infrastructure & Security',
  difficulty: 'Hard',
  frequencyRank: 21,
  editorial: {
    companies: ['Stripe', 'PayPal', 'Adyen', 'Square', 'Visa'],
    overview: 'Design a high-reliability Payment Gateway capable of processing credit card payments, merchant payouts, subscription billing, and immutable financial accounting ledgers with zero double-charge guarantee.',
    introduction: `Payment gateways like Stripe process hundreds of billions of dollars in transaction volume annually. Financial systems must operate under strict ACID guarantees, zero data loss, strict idempotency, and PCI-DSS security compliance.

Key architecture features include double-entry accounting ledgers, payment state machine orchestration, idempotent API keys, reconciliation engines, and acquiring bank integration.`,
    requirements: {
      functional: [
        'Process credit card payments (Auth & Capture flow).',
        'Support idempotent transaction processing (retrying a network request never double-charges).',
        'Maintain an immutable double-entry financial ledger.',
        'Execute merchant payouts and refunds.'
      ],
      nonFunctional: [
        '100% Correctness and Consistency (CP in CAP Theorem): Zero money discrepancies.',
        'High availability: 99.999% uptime for payment processing APIs.',
        'Idempotency: Guaranteed exactly-once financial state mutation.',
        'PCI-DSS Compliance: Credit card numbers tokenized at boundary.'
      ],
      outOfScope: ['Physical ATM currency cash dispensing']
    },
    keyQuestions: {
      assumptions: [
        '100 Million payment transactions per day',
        'Average 1,200 QPS average (10,000 peak QPS)',
        'Zero tolerance for dropped transactions'
      ],
      calculations: [
        { label: 'Daily Ledger Storage', value: '100 GB / day', desc: '100M transactions * 1 KB immutable ledger records' },
        { label: 'Idempotency Key TTL', value: '7 Days', desc: 'Redis + DB idempotency key retention window' },
        { label: 'Max API Latency SLA', value: '< 1.5 Seconds', desc: 'Includes acquiring bank network processing time' }
      ]
    },
    dataModel: {
      overview: 'Immutable Double-Entry Accounting Ledger in RDBMS (PostgreSQL / Spanner) enforcing balance equality.',
      entities: [
        {
          name: 'ledger_entries',
          description: 'Immutable double-entry debit & credit ledger journal.',
          fields: [
            { name: 'entry_id', type: 'UUID PRIMARY KEY', desc: 'Unique ledger entry ID' },
            { name: 'transaction_id', type: 'UUID', desc: 'Payment transaction reference' },
            { name: 'account_id', type: 'VARCHAR(64)', desc: 'Account identifier (e.g. Customer, Merchant, Platform Fee)' },
            { name: 'type', type: 'VARCHAR(8)', desc: 'DEBIT | CREDIT' },
            { name: 'amount', type: 'DECIMAL(12,2)', desc: 'Monetary value' },
            { name: 'currency', type: 'CHAR(3)', desc: 'USD | EUR | GBP' },
            { name: 'created_at', type: 'TIMESTAMP', desc: 'Timestamp' }
          ]
        },
        {
          name: 'idempotency_keys',
          description: 'Client idempotency registry.',
          fields: [
            { name: 'idempotency_key', type: 'VARCHAR(128) PRIMARY KEY', desc: 'Client generated key' },
            { name: 'user_id', type: 'BIGINT', desc: 'Customer ID' },
            { name: 'request_hash', type: 'CHAR(64)', desc: 'SHA-256 hash of HTTP payload' },
            { name: 'response_payload', type: 'JSONB', desc: 'Cached JSON HTTP response' },
            { name: 'status', type: 'VARCHAR(16)', desc: 'PROCESSING | COMPLETED' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'PCI-tokenized REST API with strict idempotency key headers.',
      endpoints: [
        {
          method: 'POST',
          path: '/v1/charges',
          params: 'Headers: Idempotency-Key: ik_12345 | Body: { "amount": 2500, "currency": "usd", "sourceToken": "tok_visa" }',
          statusCode: '201 Created',
          description: 'Executes credit card charge with mandatory idempotency key.'
        }
      ]
    },
    basicImplementation: {
      title: 'Direct API Charge without Idempotency',
      description: 'Client calls Payment API -> Payment API calls Visa/Mastercard network -> Updates balance field `balance = balance - 25`.',
      drawbacks: [
        'If network disconnects before response arrives, client retries and charges customer twice!',
        'Single-entry balance updates (`balance = balance - 25`) make financial auditing impossible if records are corrupted.'
      ]
    },
    advancedImplementation: {
      title: 'Idempotency Layer + Double-Entry Accounting Ledger + Payment State Machine + Async Reconciliation Engine',
      description: `1. Idempotency Layer:
   - Every API request requires a unique \`Idempotency-Key\` header.
   - Idempotency Middleware checks Redis/PostgreSQL for key.
   - If Key Status == PROCESSING: Reject concurrent request (HTTP 409).
   - If Key Status == COMPLETED: Return cached response immediately without re-charging card!

2. Double-Entry Accounting Ledger:
   - Money is never created or destroyed; every payment transaction MUST have balanced DEBIT and CREDIT entries where \`SUM(DEBITS) == SUM(CREDITS)\`.
   - Example ($100 payment with $3 fee):
     - DEBIT Customer Account: $100
     - CREDIT Merchant Account: $97
     - CREDIT Stripe Fee Account: $3

3. Reconciliation Engine:
   - Nightly batch job compares internal ledger entries against bank settlement CSV files to catch any discrepancies automatically.`,
      components: [
        { name: 'Idempotency Gateway', role: 'Duplicate Execution Guard', details: 'Enforces exactly-once execution via Idempotency Keys.' },
        { name: 'Payment State Machine', role: 'Transaction Manager', details: 'Manages CREATED -> AUTHORIZED -> CAPTURED -> SETTLED state transitions.' },
        { name: 'Double-Entry Ledger DB', role: 'Immutable Financial Store', details: 'Appends immutable debit/credit journal entries.' },
        { name: 'Acquiring Bank Adapter', role: 'Card Network Integration', details: 'Communicates with Visa/Mastercard/Amex networks.' },
        { name: 'Reconciliation Service', role: 'Audit & Settlement Engine', details: 'Compares internal logs against bank settlement files.' }
      ]
    },
    flows: [
      {
        title: 'Payment Charge Execution Flow',
        description: 'Processing idempotent credit card payment.',
        steps: [
          'Client sends POST /v1/charges with `Idempotency-Key: ik_999`.',
          'Idempotency Middleware locks key `ik_999` in Redis with status=PROCESSING.',
          'Payment Service converts raw card payload to PCI Token.',
          'Calls Acquiring Bank (Visa network) to Authorize & Capture $25.00.',
          'Bank returns transaction status = APPROVED.',
          'Ledger Service appends balanced DEBIT and CREDIT entries into PostgreSQL Ledger DB.',
          'Idempotency Middleware saves HTTP response payload into Redis/DB and sets status=COMPLETED.',
          'Returns 201 Created to client.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Tokenization & PCI-DSS Compliance', details: 'Raw credit card numbers (PANs) never touch application backend servers. Card details are sent directly from frontend iframe to Tokenizer Vault (e.g. Stripe.js), returning a short-lived token (`tok_visa_123`).' },
      { topic: 'Reconciliation Async Pipelines', details: 'Discrepancies identified during bank CSV file matching trigger automatic support alerts for manual financial review.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'What fundamental rule must be strictly enforced in a Double-Entry Accounting Ledger?',
      options: [
        'The total sum of all DEBIT entries must exactly equal the total sum of all CREDIT entries for every transaction',
        'All entries must be deleted every month',
        'Credit cards must be charged twice',
        'Transactions must be stored in plaintext'
      ],
      correctAnswerIndex: 0,
      explanation: 'In double-entry bookkeeping, every financial event consists of balanced debits and credits, ensuring money is explicitly tracked between accounts without disappearing.'
    },
    {
      id: 'q2',
      question: 'What happens if a client retries a payment API request with an existing "COMPLETED" Idempotency-Key?',
      options: [
        'The Payment Gateway returns the cached HTTP response from the previous transaction without charging the credit card again',
        'The client credit card is charged a second time',
        'The user account is locked',
        'The server throws a 500 error'
      ],
      correctAnswerIndex: 0,
      explanation: 'Idempotency guarantees that retrying an API call with the same key returns the original cached response safely without re-executing the charge.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'client', label: 'Merchant App / Web', type: 'client', description: 'Sends POST /charges with Idempotency-Key', x: 40, y: 160 },
      { id: 'idemp', label: 'Idempotency Gateway', type: 'lb', description: 'Checks Redis for duplicate request keys', x: 240, y: 160 },
      { id: 'paySvc', label: 'Payment State Machine', type: 'service', description: 'Orchestrates Auth & Capture pipeline', x: 460, y: 160 },
      { id: 'bank', label: 'Visa / Mastercard Network', type: 'service', description: 'Acquiring bank payment processing', x: 700, y: 80 },
      { id: 'ledger', label: 'Double-Entry Ledger DB', type: 'db', description: 'Immutable PostgreSQL journal (Debits == Credits)', x: 700, y: 240 },
      { id: 'recon', label: 'Reconciliation Engine', type: 'service', description: 'Audits internal ledger against bank settlement CSVs', x: 920, y: 240 }
    ],
    connections: [
      { from: 'client', to: 'idemp', label: 'POST /v1/charges' },
      { from: 'idemp', to: 'paySvc', label: '1. On New Key: Process' },
      { from: 'paySvc', to: 'bank', label: '2. Execute Card Charge' },
      { from: 'paySvc', to: 'ledger', label: '3. Append Balanced Journal' },
      { from: 'idemp', to: 'client', label: '4. Cache & Return Response' },
      { from: 'ledger', to: 'recon', label: 'Nightly Audit Match' }
    ]
  }
};
