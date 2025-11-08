# Testing the Missed Payment Flow

This document explains how to test the referral system's missed payment functionality, which automatically extends the end date of a referral when a payment is missed.

## What Happens When a Payment is Missed

1. The user skips making a payment for a day
2. When the daily commission processing runs, it:
   - Detects the missing payment
   - Extends the referral end date by 1 day
   - Does NOT give commission to the referrer for that day
3. The referral continues as normal when payments resume
4. The total days are preserved, ensuring the referrer still gets the full commission amount

## Testing Methods

There are three ways to test this functionality:

### 1. Automated Test Script

The automated test script creates test users and referrals, simulates payments, and verifies the behavior:

```bash
# Run the automated test
./scripts/run-test.sh
```

This will:
- Create test users if they don't exist
- Create a test referral
- Simulate payments for two days
- Skip the third day payment
- Process commissions for all three days
- Verify the end date was extended
- Show missed payment details

### 2. API Tests

You can test the API endpoints with an existing referral:

```bash
# Run the API test with your referral and user IDs
./scripts/run-api-test.sh your_referral_id your_user_id
```

Or use Node.js directly:

```bash
TEST_REFERRAL_ID=your_referral_id TEST_USER_ID=your_user_id node scripts/api-test.js
```

### 3. Postman Collection

Import the Postman collection file to test the API through Postman:

1. Import `scripts/referral-missed-payments.postman_collection.json` into Postman
2. Create an environment with these variables:
   - `baseUrl`: Your API base URL (e.g., http://localhost:3000/api)
   - `userId`: Your test user ID
   - `referralId`: Your test referral ID
3. Run the requests in sequence to observe the behavior

## Manual Testing Steps

1. **Check Existing Referral**
   - Get the referral details: `GET /referrals/details/:referralId`
   - Note the current end date

2. **Skip a Payment**
   - Don't make a payment for one day

3. **Process Daily Commission**
   - Trigger the processing: `POST /referrals/process-daily-commissions`

4. **Verify End Date Extension**
   - Get the referral details again: `GET /referrals/details/:referralId`
   - Confirm the end date has been extended by 1 day

5. **Check Missed Payment Details**
   - Get missed payment info: `GET /referrals/missed-payments/:referralId`
   - Verify the daysExtended value

## Database Verification

You can also verify directly in MongoDB:

```javascript
// Find a referral
db.referrals.findOne({ _id: ObjectId("your_referral_id") })

// Count commissions for this referral
db.dailycommissions.find({ referral: ObjectId("your_referral_id") }).count()

// Check payments
db.transactions.find({ 
  user: ObjectId("user_id"), 
  type: "purchase",
  status: "completed"
}).sort({ createdAt: -1 })
```

## Troubleshooting

- Make sure MongoDB is running
- Check if the Transaction model is correctly defined in your application
- Verify the daily commission processing function is working correctly
- Ensure the date calculations are accurate across timezones 