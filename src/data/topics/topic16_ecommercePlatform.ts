import { SystemDesignTopic } from '../../types/systemDesign';

export const ecommercePlatformTopic: SystemDesignTopic = {
  id: 'ecommerce-platform',
  title: 'E-Commerce Platform (Amazon, eBay)',
  subtitle: 'Product Catalog, Shopping Cart & Checkout Microservices',
  category: 'Distributed Systems',
  difficulty: 'Hard',
  frequencyRank: 16,
  editorial: {
    companies: ['Amazon', 'eBay', 'Shopify', 'Walmart', 'Alibaba'],
    overview: 'Design a distributed e-commerce architecture supporting product search, shopping cart management, inventory control, order placement, and payment processing.',
    introduction: `E-commerce platforms like Amazon handle millions of product catalog queries, shopping cart updates, and transactional checkouts simultaneously.

Key architectural concepts include microservice domain separation, database per service pattern, inventory reservation saga pattern, distributed transaction management, and read-heavy catalog caching.`,
    requirements: {
      functional: [
        'Browse and search millions of product listings with categories, filters, and full-text search.',
        'Manage shopping cart items (add, update quantity, remove).',
        'Place an order with shipping address and payment processing.',
        'Track order status (Payment Pending, Processing, Shipped, Delivered).'
      ],
      nonFunctional: [
        'High availability and fast catalog browse latency (< 100ms).',
        'Strict inventory accuracy: Prevent selling out-of-stock items.',
        'Scalable to 100 Million daily active users and Black Friday traffic spikes.',
        'Idempotent payment processing to prevent double charging.'
      ],
      outOfScope: ['Physical warehouse robot navigation']
    },
    keyQuestions: {
      assumptions: [
        '500 Million total product listings',
        '50 Million Daily Active Users (DAU)',
        'Catalog Browse QPS: 100,000 QPS; Order Checkout QPS: 5,000 QPS'
      ],
      calculations: [
        { label: 'Catalog Search Bandwidth', value: '500 MB / sec', desc: '100,000 QPS * 5 KB product JSON payload' },
        { label: 'Orders per day', value: '10 Million orders / day', desc: 'Assuming 20% conversion rate from 50M DAU' },
        { label: 'Database Architecture', value: 'Polyglot Persistence', desc: 'Elasticsearch (Catalog) + Redis (Cart) + DynamoDB (Orders)' }
      ]
    },
    dataModel: {
      overview: 'Polyglot persistence with dedicated databases per microservice bounded context.',
      entities: [
        {
          name: 'products',
          description: 'Product catalog document stored in Document DB / Elasticsearch.',
          fields: [
            { name: 'product_id', type: 'VARCHAR(32) PRIMARY KEY', desc: 'SKU product identifier' },
            { name: 'title', type: 'VARCHAR(256)', desc: 'Product title' },
            { name: 'description', type: 'TEXT', desc: 'Full text description' },
            { name: 'price', type: 'DECIMAL(10,2)', desc: 'Current price' },
            { name: 'category_id', type: 'INT', desc: 'Taxonomy category' },
            { name: 'attributes', type: 'JSON', desc: 'Dynamic specs (color, size, brand)' }
          ]
        },
        {
          name: 'orders',
          description: 'Transactional order record.',
          fields: [
            { name: 'order_id', type: 'UUID PRIMARY KEY', desc: 'Unique order ID' },
            { name: 'user_id', type: 'BIGINT', desc: 'Buyer user ID' },
            { name: 'total_amount', type: 'DECIMAL(10,2)', desc: 'Total cost' },
            { name: 'status', type: 'VARCHAR(32)', desc: 'PENDING | PAID | SHIPPED | CANCELLED' },
            { name: 'items', type: 'JSONB', desc: 'List of SKUs, quantities, and prices' }
          ]
        }
      ]
    },
    apiDesign: {
      overview: 'RESTful API endpoints routed via API Gateway.',
      endpoints: [
        {
          method: 'GET',
          path: '/v1/products/search',
          params: '?q=laptop&category=electronics&min_price=500',
          statusCode: '200 OK',
          description: 'Full-text product search with faceted filters.'
        },
        {
          method: 'POST',
          path: '/v1/cart/items',
          params: '{ "sku": "prod_123", "quantity": 2 }',
          statusCode: '200 OK',
          description: 'Updates shopping cart in-memory Redis session.'
        },
        {
          method: 'POST',
          path: '/v1/orders/checkout',
          params: '{ "cartId": "cart_999", "paymentMethodToken": "tok_stripe" }',
          statusCode: '201 Created',
          description: 'Initiates order placement and Saga workflow.'
        }
      ]
    },
    basicImplementation: {
      title: 'Monolithic Single Database Schema',
      description: 'Single large MySQL database housing Products, Users, Shopping Carts, Inventory, and Orders tables with ACID SQL joins.',
      drawbacks: [
        'Database connection pool starvation during flash sales.',
        'A bug or high load in product browsing crashes order checkout.',
        'Hard to scale independently.'
      ]
    },
    advancedImplementation: {
      title: 'Microservices Bounded Contexts + Polyglot Persistence + Distributed Saga Pattern',
      description: `1. Polyglot Persistence:
   - Product Catalog Service: Uses Elasticsearch + Redis for sub-20ms search and category filters.
   - Shopping Cart Service: Uses Redis Cluster (In-Memory Key-Value) with TTL auto-expiration for ultra-fast cart edits.
   - Order & Inventory Service: Uses DynamoDB / PostgreSQL with strict transactional locking.

2. Inventory Reservation & Checkout Saga:
   - Orchestration Saga Pattern: Order Service coordinates multi-step checkout workflow:
     1. Reserve Inventory in Inventory Service.
     2. Process Credit Card Payment in Payment Gateway.
     3. If Payment Fails: Execute Compensating Transaction to release reserved inventory back to stock!
     4. If Payment Succeeds: Transition Order Status = PAID and dispatch event to Logistics Queue.`,
      components: [
        { name: 'API Gateway (Kong/Envoy)', role: 'Microservice Router', details: 'Handles authentication, rate limiting, and request routing.' },
        { name: 'Catalog Service (Elasticsearch)', role: 'Search & Browse Engine', details: 'Full-text product search & faceted category navigation.' },
        { name: 'Cart Service (Redis Cluster)', role: 'Shopping Cart Session', details: 'High-speed transient cart item storage.' },
        { name: 'Order Service (Saga Coordinator)', role: 'Checkout Workflow', details: 'Orchestrates inventory reservation, payment, & fulfillment.' },
        { name: 'Inventory Service (DynamoDB)', role: 'Stock Control', details: 'Manages physical warehouse SKU quantities.' }
      ]
    },
    flows: [
      {
        title: 'Checkout Saga Workflow',
        description: 'Multi-step distributed transaction.',
        steps: [
          'User submits POST /v1/orders/checkout.',
          'Order Service generates Order ID in PENDING state.',
          'Saga Step 1: Order Service calls Inventory Service to lock SKU stock (`stock = stock - qty`).',
          'Saga Step 2: Order Service calls Payment Service to charge credit card.',
          'If Payment Succeeds: Update Order Status = PAID. Publish `order-placed` event to Kafka for warehouse fulfillment.',
          'If Payment Fails: Trigger Compensation Step -> Inventory Service restores SKU stock (`stock = stock + qty`). Mark Order Status = CANCELLED.'
        ]
      }
    ],
    additionalPoints: [
      { topic: 'Idempotency Keys for Payments', details: 'Client passes a unique `Idempotency-Key` header with checkout requests. If network times out and client retries, payment gateway verifies key and returns existing charge result instead of double-charging.' },
      { topic: 'CDC Change Data Capture (Debezium)', details: 'Stream product price updates from primary DB to Elasticsearch using Debezium CDC and Kafka without dual-write inconsistencies.' }
    ]
  },
  quiz: [
    {
      id: 'q1',
      question: 'What design pattern is used to maintain consistency across distributed microservices (Order, Inventory, Payment) during checkout?',
      options: [
        'Saga Pattern (Orchestration or Choreography)',
        'Monolithic Lock Pattern',
        'Singleton Pattern',
        'Observer Pattern'
      ],
      correctAnswerIndex: 0,
      explanation: 'The Saga pattern breaks distributed transactions into a sequence of local service transactions, using compensating transactions to undo steps if a failure occurs.'
    },
    {
      id: 'q2',
      question: 'Why pass an "Idempotency-Key" header during payment API requests?',
      options: [
        'To prevent double-charging the user credit card if network timeouts cause the client to retry the request',
        'To encrypt credit card numbers',
        'To speed up SQL queries',
        'To bypass user authentication'
      ],
      correctAnswerIndex: 0,
      explanation: 'Idempotency keys ensure that retrying an API call produces the exact same result as the initial request without executing duplicate credit card charges.'
    }
  ],
  whiteboard: {
    nodes: [
      { id: 'client', label: 'E-Commerce App', type: 'client', description: 'Browses products & places orders', x: 40, y: 160 },
      { id: 'gw', label: 'API Gateway', type: 'lb', description: 'Routes microservice traffic', x: 220, y: 160 },
      { id: 'catalog', label: 'Catalog Service (ES)', type: 'service', description: 'Product search & browse engine', x: 440, y: 80 },
      { id: 'cart', label: 'Cart Service (Redis)', type: 'cache', description: 'Fast transient shopping cart store', x: 440, y: 180 },
      { id: 'order', label: 'Order Saga Service', type: 'service', description: 'Orchestrates checkout transaction workflow', x: 440, y: 280 },
      { id: 'inv', label: 'Inventory Service (DynamoDB)', type: 'db', description: 'SKU stock allocation & locks', x: 700, y: 200 },
      { id: 'pay', label: 'Payment Gateway', type: 'service', description: 'Stripe credit card charge', x: 700, y: 320 }
    ],
    connections: [
      { from: 'client', to: 'gw', label: 'API Call' },
      { from: 'gw', to: 'catalog', label: 'GET /products' },
      { from: 'gw', to: 'cart', label: 'POST /cart' },
      { from: 'gw', to: 'order', label: 'POST /checkout' },
      { from: 'order', to: 'inv', label: '1. Reserve Inventory' },
      { from: 'order', to: 'pay', label: '2. Charge Payment' },
      { from: 'order', to: 'inv', label: '3. Compensate (If Fail)' }
    ]
  }
};
