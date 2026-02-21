Step 1: Get Your API Keys
API keys authenticate your requests to the Finternet API. Each key is scoped to a specific merchant account.

API Key Format
Finternet API keys follow this pattern:

sk_{environment}_{unique_id}

Environments:

test - For testing and development
live - For production transactions
hackathon - For hackathon participants
Example:

sk_test_51AbC123XyZ789...

Step 1: Get Your API Key
To start using Finternet, you'll need an API key:

Sign up at Finternet Dashboard
Navigate to Settings → API Keys
Copy your Secret Key (starts with sk_)
Sandbox Environment
🧪 Current Environment: This documentation uses the sandbox environment (api.fmm.finternetlab.io).

🚀 Production API will be available once deployed.

⚠️ Security Note: Never expose your secret keys in client-side code or commit them to version control. Use environment variables or secure secret management.

Step 2: Make Your First API Call
Let's create a simple payment intent to verify your setup:

curl https://api.fmm.finternetlab.io/v1/payment-intents \
  -u sk_test_your_key_here: \
  -d amount="100.00" \
  -d currency="USDC" \
  -d type="CONDITIONAL" \
  -d settlementMethod="OFF_RAMP_MOCK" \
  -d settlementDestination="bank_account_123"

Response:

{
  "id": "intent_2xYz9AbC123",
  "object": "payment_intent",
  "status": "INITIATED",
  "data": {
    "id": "intent_2xYz9AbC123",
    "object": "payment_intent",
    "status": "INITIATED",
    "amount": "100.00",
    "currency": "USDC",
    "type": "DELIVERY_VS_PAYMENT",
    "description": "Order #12345",
    "settlementMethod": "OFF_RAMP_MOCK",
    "settlementDestination": "bank_account_123",
    "settlementStatus": "PENDING",
    "contractAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f42318",
    "chainId": 11155111,
    "typedData": {
      "types": {
        "EIP712Domain": [...],
        "PaymentIntent": [...]
      },
      "domain": {...},
      "message": {...}
    },
    "phases": [
      {
        "phase": "SIGNATURE_VERIFICATION",
        "status": "IN_PROGRESS"
      }
    ],
    "metadata": {
      "tokenAddress": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      "contractMerchantId": "4"
    },
    "paymentUrl": "https://pay.fmm.finternetlab.io/?intent=intent_2xYz9AbC123",
    "estimatedFee": "2.50",
    "estimatedDeliveryTime": "15s",
    "created": 1704067200,
    "updated": 1704067200
  },
  "created": 1704067200,
  "updated": 1704067200
}

💡 Important: The response includes data.paymentUrl - this is the URL where users complete payment. Redirect them to this URL after creating the payment intent.

Step 3: Redirect User to Payment Page
After creating the payment intent, redirect your user to the payment URL:

const response = await apiRequest('/payment-intents', {...});
const paymentUrl = response.data.paymentUrl;

// Redirect user to payment page
window.location.href = paymentUrl;

Step 4: Understand the Payment Flow
Every payment goes through these stages:

INITIATED - Payment intent created, awaiting payer action
PROCESSING - Transaction submitted to blockchain
SUCCEEDED - Blockchain transaction confirmed (5+ confirmations)
SETTLED - Funds converted to fiat and sent to merchant account
FINAL - Payment fully completed
Step 5: Confirm the Payment
Once a payer signs and executes the transaction on the frontend, the payment is automatically confirmed. You can also manually confirm it:

curl https://api.fmm.finternetlab.io/v1/payment-intents/intent_2xYz9AbC123/confirm \
  -H "X-API-Key: sk_test_your_key_here" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
    "signature": "0x1234...",
    "payerAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f42318"
  }'

Step 6: Check Payment Status
Poll the payment intent to track its progress:

curl https://api.fmm.finternetlab.io/v1/payment-intents/intent_2xYz9AbC123 \
  -u sk_test_your_key_here:

Next Steps
📖 Read about Payment Types to understand different payment options
🔐 Learn about Authentication in detail
💻 Check out Code Examples for ready-to-use snippets
📚 Explore the API Reference for complete documentation
Need Help?









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








## Create Milestone
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









## Complete Milestone
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



## API Key: sk_hackathon_6363ad2f4fe8db81d46787d9aeafb604