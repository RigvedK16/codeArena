Milestone Payments
Milestone payments allow you to release funds incrementally as project phases are completed. This is ideal for long-term projects, freelance work, or any scenario where deliverables are completed in stages.

How It Works
Create Escrow Order: Set releaseType: "MILESTONE_LOCKED"
Define Milestones: Create multiple milestones with specific amounts
Complete Milestones: Mark milestones as completed sequentially
Automatic Release: Funds are released as each milestone is completed
Use Cases
Freelance Projects: Release payment as features are delivered
Construction: Pay for completed phases (foundation, framing, etc.)
Software Development: Release funds for MVP, beta, and production
Consulting: Pay for completed deliverables or time periods
Content Creation: Pay for drafts, revisions, and final delivery
Creating Milestones
Example: 3-Milestone Project
// Milestone 0: Project kickoff (30%)
await createMilestone({
  milestoneIndex: 0,
  description: 'Project kickoff and planning - 30%',
  amount: '300.00',
  percentage: 30,
});

// Milestone 1: Mid-point delivery (50%)
await createMilestone({
  milestoneIndex: 1,
  description: 'Core features completed - 50%',
  amount: '500.00',
  percentage: 50,
});

// Milestone 2: Final delivery (20%)
await createMilestone({
  milestoneIndex: 2,
  description: 'Final delivery and documentation - 20%',
  amount: '200.00',
  percentage: 20,
});

Milestone Best Practices
Sequential Indexing: Always use 0, 1, 2, ... in order
Clear Descriptions: Make it obvious what completion means
Reasonable Amounts: Don't create too many tiny milestones
Total Check: Ensure milestone amounts don't exceed order total
Completing Milestones
Milestones must be completed in order:

// Step 1: Complete milestone 0
await completeMilestone(milestone0Id, {
  completedBy: merchantAddress,
  completionProof: proofHash,
});

// Step 2: Wait for release (automatic if autoReleaseOnProof is true)
// Check order status...

// Step 3: Complete milestone 1
await completeMilestone(milestone1Id, {
  completedBy: merchantAddress,
  completionProof: proofHash,
});

Completion Proof
Provide verifiable proof of milestone completion:

import { ethers } from 'ethers';

const completionData = {
  milestoneIndex: 0,
  completedAt: new Date().toISOString(),
  deliverables: [
    'Feature A implemented',
    'Feature B tested',
    'Documentation updated',
  ],
  signedBy: merchantAddress,
};

const proofHash = ethers.keccak256(
  ethers.toUtf8Bytes(JSON.stringify(completionData))
);

Automatic Release
If autoReleaseOnProof is enabled:

Milestone marked as completed
Funds automatically released to merchant
Settlement scheduled for off-ramp
Next milestone becomes available
Complete Example
// 1. Create payment intent with milestone release type
const intent = await createPaymentIntent({
  amount: '1000.00',
  currency: 'USDC',
  type: 'DELIVERY_VS_PAYMENT',
  settlementMethod: 'OFF_RAMP_MOCK',
  settlementDestination: 'bank_account_123',
  metadata: {
    releaseType: 'MILESTONE_LOCKED',
    autoRelease: true,
  },
});

// 2. Create milestones
const milestones = [
  { milestoneIndex: 0, amount: '300.00', description: 'Kickoff - 30%' },
  { milestoneIndex: 1, amount: '500.00', description: 'Mid-point - 50%' },
  { milestoneIndex: 2, amount: '200.00', description: 'Final - 20%' },
];

for (const milestone of milestones) {
  await createMilestone(intent.id, milestone);
}

// 3. As project progresses, complete milestones
await completeMilestone(milestone0Id, {
  completedBy: merchantAddress,
  completionProof: generateProof('Milestone 0 deliverables'),
});

// Funds are automatically released!

Status Tracking
Monitor milestone status:

const conditionalPayment = await getConditionalPayment(intentId);
const milestones = conditionalPayment.milestones;

milestones.forEach((milestone) => {
  console.log(`Milestone ${milestone.milestoneIndex}: ${milestone.status}`);
  // PENDING, COMPLETED, or RELEASED
});

Common Patterns
50/50 Split
[
  { milestoneIndex: 0, amount: '500.00', description: '50% upfront' },
  { milestoneIndex: 1, amount: '500.00', description: '50% on completion' },
]

30/40/30 Pattern
[
  { milestoneIndex: 0, amount: '300.00', description: '30% start' },
  { milestoneIndex: 1, amount: '400.00', description: '40% mid-point' },
  { milestoneIndex: 2, amount: '300.00', description: '30% final' },
]

Equal Quarters
[
  { milestoneIndex: 0, amount: '250.00', description: '25% - Phase 1' },
  { milestoneIndex: 1, amount: '250.00', description: '25% - Phase 2' },
  { milestoneIndex: 2, amount: '250.00', description: '25% - Phase 3' },
  { milestoneIndex: 3, amount: '250.00', description: '25% - Phase 4' },
]

Error Handling
Previous Milestone Not Completed
try {
  await completeMilestone(milestone2Id, {...});
} catch (error) {
  if (error.code === 'invalid_request') {
    // Complete milestone 1 first
    await completeMilestone(milestone1Id, {...});
  }
}

Milestone Already Released
const milestone = await getMilestone(milestoneId);
if (milestone.status === 'RELEASED') {
  console.log('Milestone already released, funds sent');
}

Related
Create Milestone
Complete Milestone
Conditional Payments
Time-Based Payouts











Delivery vs Payment (DvP)
Delivery vs Payment (DvP) is an escrow-based payment system that ensures funds are only released when delivery is confirmed. This protects both buyers and merchants by creating a trustless payment mechanism.

How It Works
Buyer Pays: Funds are locked in an escrow smart contract
Merchant Ships: Order is marked as shipped
Delivery Proof: Merchant submits proof of delivery
Automatic Release: Funds are released to merchant (if auto-release enabled)
Settlement: Funds converted to fiat and sent to merchant's bank
Order Lifecycle
Created (0) → Delivered (2) → AwaitingSettlement (3) → Completed (4)

Status Flow
Created (0): Order created, funds locked in escrow
Delivered (2): Delivery proof submitted, order marked as delivered
AwaitingSettlement (3): Funds released to merchant's contract balance
Completed (4): Settlement executed, funds sent to merchant's bank
Creating a DvP Payment
const intent = await createPaymentIntent({
  amount: '1000.00',
  currency: 'USDC',
  type: 'DELIVERY_VS_PAYMENT',
  settlementMethod: 'OFF_RAMP_MOCK',
  settlementDestination: 'bank_account_123',
  metadata: {
    deliveryPeriod: 2592000, // 30 days
    autoRelease: true, // Auto-release on delivery proof
    expectedDeliveryHash: '0x0000...', // Optional
  },
});

Submitting Delivery Proof
Once the item is delivered, submit proof:

import { ethers } from 'ethers';

// Generate delivery proof hash
const deliveryData = {
  trackingNumber: 'TRACK123456',
  deliveredAt: new Date().toISOString(),
  recipient: 'John Doe',
  signature: 'signed_receipt',
};

const proofHash = ethers.keccak256(
  ethers.toUtf8Bytes(JSON.stringify(deliveryData))
);

// Submit delivery proof
await submitDeliveryProof(intentId, {
  proofHash,
  proofURI: 'https://example.com/delivery-proofs/12345',
  submittedBy: merchantAddress,
});

Auto-Release Behavior
With Auto-Release (autoReleaseOnProof: true)
Delivery proof submitted
Contract automatically releases funds
Order status → AwaitingSettlement
Settlement job automatically scheduled
Funds sent to merchant's bank
Without Auto-Release (autoReleaseOnProof: false)
Delivery proof submitted
Order status → Delivered
Manual release required
Settlement scheduled after manual release
Delivery Proof Requirements
Valid Proof Hash
Must be a bytes32 hash (64 hex characters)
Should hash verifiable delivery data
Can include tracking numbers, signatures, timestamps
Proof URI
Optional URI where proof can be accessed:

IPFS hash: ipfs://Qm...
HTTP URL: https://example.com/proofs/12345
Storage service: s3://bucket/proof.pdf
Complete Flow Example
// 1. Create payment intent
const intent = await createPaymentIntent({
  amount: '500.00',
  currency: 'USDC',
  type: 'DELIVERY_VS_PAYMENT',
  settlementMethod: 'OFF_RAMP_MOCK',
  settlementDestination: 'bank_account_123',
  metadata: {
    deliveryPeriod: 2592000, // 30 days
    autoRelease: true,
  },
});

// 2. Buyer confirms payment (frontend)
// ... wallet connection and transaction execution ...

// 3. Confirm payment intent
await confirmPaymentIntent(intent.id, {
  signature: eip712Signature,
  payerAddress: buyerAddress,
});

// 4. Wait for blockchain confirmation
// Poll getPaymentIntent() until status is SUCCEEDED

// 5. Merchant ships item
// ... shipping process ...

// 6. Submit delivery proof
const deliveryProof = await submitDeliveryProof(intent.id, {
  proofHash: generateDeliveryProofHash(),
  proofURI: 'https://example.com/delivery-proofs/12345',
  submittedBy: merchantAddress,
});

// 7. Funds automatically released (if autoReleaseOnProof is true)
// Settlement automatically scheduled
// Funds sent to merchant's bank account

Status Tracking
Monitor the order status throughout the process:

const conditionalPayment = await getConditionalPayment(intentId);

console.log('Order Status:', conditionalPayment.orderStatus);
// PENDING → SHIPPED → DELIVERED → COMPLETED

console.log('Settlement Status:', conditionalPayment.settlementStatus);
// NONE → SCHEDULED → EXECUTED → CONFIRMED

Dispute Handling
If there's an issue with delivery:

await raiseDispute(intentId, {
  reason: 'Item not delivered as described',
  raisedBy: buyerAddress,
  disputeWindow: '604800', // 7 days
});

Disputes pause fund release until resolved. See Dispute Resolution for details.

Best Practices
Delivery Proof
Hash verifiable data: Include tracking numbers, timestamps, signatures
Store proof externally: Use IPFS or cloud storage for proof documents
Submit promptly: Submit proof as soon as delivery is confirmed
Include metadata: Add context like recipient name, delivery address
Auto-Release
Enable for trusted merchants: Use auto-release for established relationships
Disable for high-value items: Manual review for expensive purchases
Consider buyer protection: Balance merchant convenience with buyer security
Delivery Period
Set realistic deadlines: Account for shipping time and potential delays
Consider item type: Digital goods need less time than physical shipping
International shipping: Add buffer for cross-border deliveries
Error Handling
Invalid Order Status
try {
  await submitDeliveryProof(intentId, {...});
} catch (error) {
  if (error.code === 'invalid_status') {
    // Order must be in Created (0) status
    // Check order status first
    const conditionalPayment = await getConditionalPayment(intentId);
    console.log('Current status:', conditionalPayment.orderStatus);
  }
}

Delivery Proof Already Submitted
const conditionalPayment = await getConditionalPayment(intentId);
if (conditionalPayment.actualDeliveryHash) {
  console.log('Delivery proof already submitted');
  // Check delivery proof details
}











Time-Based Payouts
Time-based payouts automatically release funds from escrow after a specified time period. This is ideal for subscriptions, retainers, or any scenario where funds should be released on a schedule.

Overview
Time-based payouts use the TIME_LOCKED release type. When you create a payment intent with this release type, funds are automatically released to the merchant after the specified time lock expires.

How It Works
1. Create payment intent with TIME_LOCKED release type
2. Payer executes transaction → Funds locked in escrow
3. System schedules automatic release job
4. Time lock expires → Funds automatically released
5. Settlement processed → Funds sent to merchant

Creating a Time-Locked Payment
Step 1: Create Payment Intent
Include releaseType: "TIME_LOCKED" and timeLockUntil in metadata:

curl https://api.finternet.com/v1/payment-intents \
  -H "X-API-Key: sk_test_your_key" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
    "amount": "1000.00",
    "currency": "USDC",
    "type": "DELIVERY_VS_PAYMENT",
    "settlementMethod": "OFF_RAMP_MOCK",
    "settlementDestination": "bank_account_123",
    "metadata": {
      "releaseType": "TIME_LOCKED",
      "timeLockUntil": "1735689600"
    }
  }'

Step 2: Calculate Time Lock
timeLockUntil is a Unix timestamp (seconds since epoch). Calculate it:

JavaScript/TypeScript:

// 30 days from now
const timeLockUntil = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);

// Or use a specific date
const releaseDate = new Date('2024-12-31');
const timeLockUntil = Math.floor(releaseDate.getTime() / 1000);

Python:

import time
from datetime import datetime, timedelta

# 30 days from now
time_lock_until = int(time.time()) + (30 * 24 * 60 * 60)

# Or use a specific date
release_date = datetime(2024, 12, 31)
time_lock_until = int(release_date.timestamp())

Step 3: Payment Confirmation
Once the payer confirms the payment, the time lock is active:

curl https://api.finternet.com/v1/payment-intents/intent_xxx/confirm \
  -H "X-API-Key: sk_test_your_key" \
  -X POST \
  -d '{
    "signature": "0x...",
    "payerAddress": "0x..."
  }'

Automatic Release
When the time lock expires:

✅ System automatically detects expiration
✅ Verifies order status allows release
✅ Executes settlement on-chain
✅ Processes off-ramp settlement
✅ Updates payment intent status to SETTLED
No action required from you! The system handles everything automatically.

Order Status Requirements
For time-locked release to execute, the escrow order must be in one of these statuses:

✅ DELIVERED - Order has been delivered
✅ SHIPPED - Order has been shipped
If the order is still in PENDING or CREATED status, the release will wait until the order progresses.

Example: Subscription Payment
Create a monthly subscription with automatic release:

// Create payment intent for monthly subscription
const now = Math.floor(Date.now() / 1000);
const oneMonthFromNow = now + (30 * 24 * 60 * 60); // 30 days

const intent = await fetch('https://api.finternet.com/v1/payment-intents', {
  method: 'POST',
  headers: {
    'X-API-Key': process.env.FINTERNET_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: '100.00',
    currency: 'USDC',
    type: 'DELIVERY_VS_PAYMENT',
    settlementMethod: 'OFF_RAMP_MOCK',
    settlementDestination: 'bank_account_123',
    metadata: {
      releaseType: 'TIME_LOCKED',
      timeLockUntil: oneMonthFromNow.toString(),
      subscriptionId: 'sub_123',
      billingPeriod: 'monthly',
    },
  }),
});

Example: Retainer Payment
Release funds after project completion period:

// Retainer: Release after 90 days
const now = Math.floor(Date.now() / 1000);
const ninetyDaysFromNow = now + (90 * 24 * 60 * 60);

const intent = await fetch('https://api.finternet.com/v1/payment-intents', {
  method: 'POST',
  headers: {
    'X-API-Key': process.env.FINTERNET_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: '5000.00',
    currency: 'USDC',
    type: 'DELIVERY_VS_PAYMENT',
    settlementMethod: 'OFF_RAMP_MOCK',
    settlementDestination: 'bank_account_123',
    metadata: {
      releaseType: 'TIME_LOCKED',
      timeLockUntil: ninetyDaysFromNow.toString(),
      projectId: 'proj_456',
      retainerType: 'project_completion',
    },
  }),
});

Checking Time Lock Status
Query the escrow order to see time lock details:

curl https://api.finternet.com/v1/payment-intents/intent_xxx/escrow \
  -H "X-API-Key: sk_test_your_key"

Response:

{
  "id": "escrow_xxx",
  "object": "escrow_order",
  "releaseType": "TIME_LOCKED",
  "timeLockUntil": "1735689600",
  "orderStatus": "DELIVERED",
  "settlementStatus": "NONE"
}

Time Lock Expiration
Before Expiration
If you check before the time lock expires:

{
  "orderStatus": "DELIVERED",
  "settlementStatus": "NONE",
  "releasedAt": null
}

After Expiration
After the time lock expires and release executes:

{
  "orderStatus": "COMPLETED",
  "settlementStatus": "EXECUTED",
  "releasedAt": "1735689600"
}

Best Practices
✅ Do
Calculate time locks accurately
Use Unix timestamps (seconds, not milliseconds)
Test with short time locks first (e.g., 1 minute)
Monitor order status before time lock expires
Handle time zone conversions correctly
❌ Don't
Use past timestamps (will release immediately)
Set time locks too short (may cause issues)
Forget to account for time zones
Rely solely on time locks (consider delivery proof for goods)
Common Use Cases
1. Subscription Services
Release monthly subscription payments automatically after the billing period.

2. Retainers
Hold retainer funds and release after project completion period.

3. Escrow Services
Provide escrow services with automatic release after a grace period.

4. Milestone Payments
Combine with milestone payments for project-based work.

Troubleshooting
Time Lock Not Releasing
Check:

Order status is DELIVERED or SHIPPED
Time lock timestamp is in the past
Payment intent status allows release
Settlement destination is valid
Immediate Release
If funds release immediately, check:

timeLockUntil timestamp is in the past
Time zone conversion is correct
Timestamp format is Unix seconds (not milliseconds)
Next Steps









S o l u t i o n Y o u r w e b / a p p c a p a b i l i t i e s :
R e q u i r e m e n t s
m u s t d e m o n s t r a t e t h e s e k e y
X
W E B / A P P
1 . E v e n t C r e a t i o n & P a r t i c i p a n t S e t u p
A l l o w a n o r g a n i z e r t o c r e a t e g r o u p s o r e v e n t s ,
a d d / r e m o v e p a r t i c i p a n t s , a n d d e f i n e w h o ' s
i n c l u d e d i n t h e o v e r a l l e x p e n s e . S h o w h o w
p a y m e n t r u l e s a r e e s t a b l i s h e d u p f r o n t .
2 . F u n d P o o l i n g i n t o a S h a r e d B a s k e t
E n a b l e p a r t i c i p a n t s t o d e p o s i t f u n d s i n t o a
s h a r e d p o o l l i n k e d t o t h e e v e n t . D e m o n s t r a t e
h o w p o o l e d f u n d s a r e c r e a t e d a n d m a n a g e d
u s i n g p r o g r a m m a b l e p a y m e n t l o g i c .
3 . E x p e n s e C a t e g o r i e s & P a r t i c i p a t i o n C o n t r o l
S u p p o r t m u l t i p l e e x p e n s e c a t e g o r i e s w i t h i n
t h e s a m e e v e n t ( t i c k e t s , f o o d , t r a v e l ) . L e t
p a r t i c i p a n t s j o i n o r l e a v e s p e c i f i c c a t e g o r i e s
w i t h p a y m e n t r u l e s a u t o m a t i c a l l y a d j u s t i n g
b a s e d o n p a r t i c i p a t i o n .
4 . B i l l S c a n n i n g & U p l o a d
A l l o w u s e r s t o s c a n p h y s i c a l a n d u p l o a d t h e m d i r e c t l y i n t o a u t o m a t i c e x p e n s e b i l l s o r r e c e i p t s
t h e s y s t e m f o r
t r a c k i n g a n d
c a t e g o r i z a t i o n .
5 . R u l e - B a s e d P a y m e n t A u t h o r i z a t i o n D e f i n e
p a y m e n t c o n d i t i o n s — w h o c a n p a y , s p e n d i n g
l i m i t s , a p p r o v a l r u l e s — a n d e n a b l e p a y m e n t s
f r o m t h e s h a r e d b a s k e t s t r i c t l y a c c o r d i n g t o
t h o s e r u l e s .
6 . A u t o m a t i c S e t t l e m e n t & R e f u n d s O n c e
e x p e n s e s a r e c o m p l e t e d , a u t o m a t i c a l l y
c a l c u l a t e e a c h p a r t i c i p a n t ' s f i n a l s h a r e , s e t t l e
a m o u n t s i n r e a l t i m e , a n d r e f u n d a n y e x c e s s
b a l a n c e — w i t h o u t m a n u a l i n t e r v e n t i o n .
X
W E B / A P P
7 . R e a l - T i m e V i s i b i l i t y & T r a n s p a r e n c y
P r o v i d e a l l p a r t i c i p a n t s w i t h c l e a r v i s i b i l i t y
i n t o b a l a n c e s , e x p e n s e s , a n d s e t t l e m e n t
s t a t u s . S h o w h o w m u c h w a s s p e n t , w h a t
r e m a i n s , a n d w h o p a i d w 


















Create Milestone
Creates a payment milestone for a milestone-based escrow order.

Endpoint
POST /v1/payment-intents/:intentId/escrow/milestones

Authentication
Requires API key authentication.

Path Parameters
Parameter	Type	Required	Description
intentId	string	Yes	The ID of the payment intent
Request Body
Parameter	Type	Required	Description
milestoneIndex	integer	Yes	Index of the milestone (0-based, must be unique per order)
description	string	No	Description of the milestone
amount	string	Yes	Amount to be released for this milestone (decimal string)
percentage	number	No	Percentage of total amount (0-100)
Request Example
curl https://api.finternet.com/v1/payment-intents/intent_2xYz9AbC123/escrow/milestones \
  -H "X-API-Key: sk_test_your_key_here" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
    "milestoneIndex": 0,
    "description": "Initial payment - 30%",
    "amount": "300.00",
    "percentage": 30
  }'

Response
Returns the created milestone object.

{
  "id": "milestone_xyz789",
  "object": "milestone",
  "data": {
    "id": "milestone_xyz789",
    "conditionalPaymentId": "conditional_payment_abc123",
    "paymentIntentId": "intent_2xYz9AbC123",
    "milestoneIndex": 0,
    "description": "Initial payment - 30%",
    "amount": "300.00",
    "percentage": 30,
    "status": "PENDING",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}

Milestone Requirements
The escrow order must have releaseType: "MILESTONE_LOCKED"
milestoneIndex must be unique per order (0, 1, 2, ...)
Total milestone amounts should not exceed the escrow order amount
Milestones are processed in order (index 0, then 1, then 2, etc.)
Milestone Lifecycle
PENDING → COMPLETED → RELEASED

PENDING: Milestone created, waiting for completion
COMPLETED: Milestone marked as completed (via Complete Milestone)
RELEASED: Funds released to merchant
Error Responses
Invalid Release Type
{
  "error": {
    "code": "invalid_request",
    "message": "Cannot create milestone for order with release type: DELIVERY_PROOF",
    "type": "invalid_request_error"
  }
}

Status Code: 400 Bad Request

Duplicate Milestone Index
{
  "error": {
    "code": "invalid_request",
    "message": "Milestone with index 0 already exists",
    "type": "invalid_request_error"
  }
}

Status Code: 400 Bad Request

Amount Exceeds Order Total
{
  "error": {
    "code": "invalid_request",
    "message": "Total milestone amounts exceed escrow order amount",
    "type": "invalid_request_error"
  }
}

Status Code: 400 Bad Request

Code Examples
JavaScript/TypeScript
// Create multiple milestones for a project
const milestones = [
  {
    milestoneIndex: 0,
    description: 'Project kickoff - 20%',
    amount: '200.00',
    percentage: 20,
  },
  {
    milestoneIndex: 1,
    description: 'Mid-point delivery - 50%',
    amount: '500.00',
    percentage: 50,
  },
  {
    milestoneIndex: 2,
    description: 'Final delivery - 30%',
    amount: '300.00',
    percentage: 30,
  },
];

for (const milestone of milestones) {
  const response = await fetch(
    `https://api.finternet.com/v1/payment-intents/${intentId}/escrow/milestones`,
    {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.FINTERNET_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(milestone),
    }
  );

  const created = await response.json();
  console.log(`Milestone ${milestone.milestoneIndex} created:`, created.id);
}

Python
import requests

milestones = [
    {
        'milestoneIndex': 0,
        'description': 'Project kickoff - 20%',
        'amount': '200.00',
        'percentage': 20,
    },
    {
        'milestoneIndex': 1,
        'description': 'Mid-point delivery - 50%',
        'amount': '500.00',
        'percentage': 50,
    },
    {
        'milestoneIndex': 2,
        'description': 'Final delivery - 30%',
        'amount': '300.00',
        'percentage': 30,
    },
]

for milestone in milestones:
    response = requests.post(
        f'https://api.finternet.com/v1/payment-intents/{intent_id}/escrow/milestones',
        headers={
            'X-API-Key': os.environ['FINTERNET_API_KEY'],
            'Content-Type': 'application/json',
        },
        json=milestone
    )

    created = response.json()
    print(f"Milestone {milestone['milestoneIndex']} created:", created['id'])

Best Practices
Milestone Planning
Break down large projects: Divide into logical phases
Clear descriptions: Make it clear what completion means
Reasonable amounts: Don't create too many small milestones
Sequential indexing: Use 0, 1, 2, ... in order
Common Patterns
3-Milestone Pattern (30/40/30):

Milestone 0: 30% - Project start
Milestone 1: 40% - Mid-point
Milestone 2: 30% - Final delivery
4-Milestone Pattern (25/25/25/25):

Equal payments at each quarter
Custom Pattern:

Adjust percentages based on project complexity and risk
Related








Complete Milestone
Marks a milestone as completed and triggers fund release if all conditions are met.

Endpoint
POST /v1/payment-intents/:intentId/escrow/milestones/:milestoneId/complete

Authentication
Requires API key authentication.

Path Parameters
Parameter	Type	Required	Description
intentId	string	Yes	The ID of the payment intent
milestoneId	string	Yes	The ID of the milestone to complete
Request Body
Parameter	Type	Required	Description
completedBy	string	Yes	Ethereum address of the entity completing the milestone
completionProof	string	No	Proof of milestone completion (hash, text, etc.)
completionProofURI	string	No	URI where completion proof can be accessed
Request Example
curl https://api.finternet.com/v1/payment-intents/intent_2xYz9AbC123/escrow/milestones/milestone_xyz789/complete \
  -H "X-API-Key: sk_test_your_key_here" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
    "completedBy": "0x742d35Cc6634C0532925a3b844Bc9e7595f42318",
    "completionProof": "0xabcdef123456...",
    "completionProofURI": "https://example.com/proofs/milestone-0"
  }'


Response
Returns a confirmation that the milestone was completed.

{
  "object": "milestone",
  "status": "completed"
}

Milestone Completion Process
When a milestone is completed:

Status Update: Milestone status changes to COMPLETED
Completion Check: System verifies milestone can be released
Fund Release: If conditions are met, funds are released
Settlement: Settlement job is scheduled for off-ramp processing
Sequential Processing
Milestones must be completed in order:

Milestone 0 must be completed before Milestone 1
Milestone 1 must be completed before Milestone 2
And so on...
Automatic Release
If autoReleaseOnProof is enabled and all prerequisites are met:

Funds are automatically released to merchant
Settlement is scheduled
Order status updates accordingly
Completion Proof
The completionProof field can contain:

Hash of completion document
Signed completion certificate
Delivery confirmation
Any verifiable proof of milestone completion
Generating Completion Proof
import { ethers } from 'ethers';

// Example: Hash a completion document
const completionData = JSON.stringify({
  milestoneIndex: 0,
  completedAt: '2024-01-15T10:30:00Z',
  deliverables: ['feature-a', 'feature-b'],
  signedBy: 'merchant_address',
});

const completionProof = ethers.keccak256(ethers.toUtf8Bytes(completionData));

Error Responses
Milestone Not Found
{
  "error": {
    "code": "resource_missing",
    "message": "Milestone not found",
    "type": "invalid_request_error"
  }
}

Status Code: 404 Not Found

Milestone Already Completed
{
  "error": {
    "code": "invalid_request",
    "message": "Milestone already completed",
    "type": "invalid_request_error"
  }
}

Status Code: 400 Bad Request

Previous Milestone Not Completed
{
  "error": {
    "code": "invalid_request",
    "message": "Previous milestone (index 0) must be completed first",
    "type": "invalid_request_error"
  }
}

Status Code: 400 Bad Request

Milestone Already Released
{
  "error": {
    "code": "invalid_request",
    "message": "Milestone already released",
    "type": "invalid_request_error"
  }
}

Status Code: 400 Bad Request

Code Examples
JavaScript/TypeScript
// Complete milestone 0
const response = await fetch(
  `https://api.finternet.com/v1/payment-intents/${intentId}/escrow/milestones/${milestoneId}/complete`,
  {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.FINTERNET_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      completedBy: merchantAddress,
      completionProof: completionProofHash,
      completionProofURI: 'https://example.com/proofs/milestone-0',
    }),
  }
);

const result = await response.json();
console.log('Milestone completed:', result.status);

Python
import requests

response = requests.post(
    f'https://api.finternet.com/v1/payment-intents/{intent_id}/escrow/milestones/{milestone_id}/complete',
    headers={
        'X-API-Key': os.environ['FINTERNET_API_KEY'],
        'Content-Type': 'application/json',
    },
    json={
        'completedBy': merchant_address,
        'completionProof': completion_proof_hash,
        'completionProofURI': 'https://example.com/proofs/milestone-0',
    }
)

result = response.json()
print('Milestone completed:', result['status'])


Best Practices
When to Complete a Milestone
Merchant: When deliverables for the milestone are finished
Buyer: When milestone deliverables are accepted
Both: After mutual agreement on milestone completion
Completion Proof
Document deliverables: List what was completed
Include timestamps: When completion occurred
Add signatures: If applicable, include digital signatures
Store externally: Use IPFS or other storage for proof documents
Sequential Completion
Always complete milestones in order:

Complete Milestone 0
Wait for release confirmation
Complete Milestone 1
Continue sequentially
