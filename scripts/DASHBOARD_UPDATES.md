# Dashboard Updates: Referral Date Information

## Overview

The dashboard API endpoint now includes the `startDate` and `endDate` for each referral. This allows you to see when each referral began and when it's scheduled to end, including any extensions due to missed payments.

## Updated Dashboard Response

When you call the dashboard endpoint:

```
GET /api/referrals/dashboard?userId=YOUR_USER_ID
```

Each referral in the `referrals` array now includes:

```json
{
  "_id": "681330f2fae30b4205370b0f",
  "name": "User Name",
  "profilePicture": "https://...",
  "progress": "1/30",
  "progressPercent": 3,
  "referralStatus": "ACTIVE",
  "statusMessage": "Commission active",
  "hasPurchased": true,
  "installmentPlan": {
    "dailyAmount": 100,
    "days": 30,
    "totalAmount": 3000,
    "commissionPerDay": 30,
    "totalCommissionExpected": 900,
    "commissionEarned": 30,
    "daysPaid": 1,
    "daysRemaining": 29,
    "planName": "Custom Plan"
  },
  "myReferrals": 0,
  "referralInfo": {
    "totalReferrals": 0,
    "referralLevel": 2
  },
  "startDate": "2025-05-01T08:30:00.000Z",  // NEW FIELD
  "endDate": "2025-05-31T08:30:00.000Z"     // NEW FIELD
}
```

## How to Use This Information

### Checking for Missed Payments

1. Using the dashboard endpoint, you can now see the `endDate` for each referral.
2. If a user has missed payments, the `endDate` will be later than expected based on the `startDate` and `days` values.
3. For example, if a referral started 10 days ago with a 30-day term, but the end date is 31 days from the start date, this indicates a missed payment.

### Getting Detailed Missed Payment Information

To get detailed information about missed payments for a specific referral:

```
GET /api/referrals/missed-payments/REFERRAL_ID
```

This will return:

```json
{
  "success": true,
  "missedPaymentDetails": {
    "referralId": "681330f2fae30b4205370b0f",
    "totalDaysSinceStart": 10,
    "expectedPaymentDays": 10,
    "actualPaidDays": 9,
    "missedDays": 1,
    "originalEndDate": "2025-05-31T08:30:00.000Z",
    "currentEndDate": "2025-06-01T08:30:00.000Z",
    "daysExtended": 1
  }
}
```

## Example: Calculating if Payments Were Missed

```javascript
// Calculate if end date has been extended due to missed payments
function checkForMissedPayments(referral) {
  const startDate = new Date(referral.startDate);
  const endDate = new Date(referral.endDate);
  
  // Calculate expected end date based on days
  const expectedEndDate = new Date(startDate);
  expectedEndDate.setDate(expectedEndDate.getDate() + referral.installmentPlan.days);
  
  // Calculate difference in days
  const daysDifference = Math.round((endDate - expectedEndDate) / (24 * 60 * 60 * 1000));
  
  if (daysDifference > 0) {
    return {
      hasMissedPayments: true,
      daysExtended: daysDifference,
      message: `This referral has been extended by ${daysDifference} days due to missed payments.`
    };
  }
  
  return {
    hasMissedPayments: false,
    daysExtended: 0,
    message: "All payments are up to date."
  };
}
```

## Interactive Testing

You can use Postman to test the updated dashboard endpoint:

1. Make a GET request to: `http://localhost:5000/api/referrals/dashboard?userId=YOUR_USER_ID`
2. Look for the `startDate` and `endDate` fields in each referral
3. Calculate if there have been missed payments using the logic above 