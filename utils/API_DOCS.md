# User Details API Documentation

## Store User Details

This endpoint allows users to update their profile information including name, phone number, profile picture, and referral code. If the user doesn't exist, it will create a new user.

**URL:** `/api/auth/store-user-details`

**Method:** `POST`

**Authentication Required:** No (Firebase UID required in request body)

**Request Body:**

```json
{
  "firebaseUid": "firebase123456uid",
  "email": "william@example.com", // Optional, but recommended for new users
  "name": "William Mays",
  "phoneNumber": "+91 0123456789",
  "profilePicture": "https://example.com/profile.jpg",
  "referralCode": "XXX XXX" // Optional
}
```

**Success Response:**

- **Code:** 200 OK
- **Content:**
  ```json
  {
    "_id": "user_id",
    "name": "William Mays",
    "email": "william@example.com",
    "phoneNumber": "+91 0123456789",
    "profilePicture": "https://example.com/profile.jpg",
    "referralCode": "ABCD1234",
    // other user fields...
  }
  ```

**Error Responses:**

- **Code:** 400 BAD REQUEST
  - **Content:** `{ "message": "Firebase UID is required" }` or `{ "message": "Invalid referral code" }` or `{ "message": "You cannot refer yourself" }`
- **Code:** 500 INTERNAL SERVER ERROR
  - **Content:** `{ "message": "Server error" }`

## Update Profile Picture

This endpoint allows users to update only their profile picture. If the user doesn't exist, it will create a new user with the provided profile picture.

**URL:** `/api/auth/update-profile-picture`

**Method:** `POST`

**Authentication Required:** No (Firebase UID required in request body)

**Request Body:**

```json
{
  "firebaseUid": "firebase123456uid",
  "email": "william@example.com", // Optional, but recommended for new users
  "profilePicture": "https://example.com/profile.jpg"
}
```

**Success Response:**

- **Code:** 200 OK
- **Content:**
  ```json
  {
    "_id": "user_id",
    "name": "William Mays",
    "email": "william@example.com",
    "profilePicture": "https://example.com/profile.jpg",
    // other user fields...
  }
  ```

**Error Responses:**

- **Code:** 400 BAD REQUEST
  - **Content:** `{ "message": "Profile picture URL is required" }` or `{ "message": "Firebase UID is required" }`
- **Code:** 500 INTERNAL SERVER ERROR
  - **Content:** `{ "message": "Server error" }`

## Implementation Notes

1. The profile picture should be uploaded to a file storage service (like Firebase Storage) on the client side first, and then the URL should be sent to this API.
2. The referral code is optional. If provided and valid, it will associate the current user with the referrer.
3. Phone numbers should be in international format (e.g., "+91 0123456789").
4. The `firebaseUid` must be provided in each request since these endpoints don't use token-based authentication.
5. If the user doesn't exist in the database yet, a new user will be created with the provided information.

## Plans API Endpoints

### Get Current Plan
Retrieves the user's current plan with all products.

- **URL**: `/api/plans`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **Response Example**:
```json
{
  "plan": {
    "_id": "60f7e5d3e8c8a61234567890",
    "user": "60f7e5d3e8c8a61234567891",
    "totalAmount": 12600.00,
    "completedAmount": 2100.00,
    "products": [
      {
        "product": {
          "_id": "60f7e5d3e8c8a61234567892",
          "name": "Bedsheet, Curtains & Pillow cover Combo",
          "images": ["https://example.com/image1.jpg"],
          "price": 21000.00,
          "brand": "Homely"
        },
        "lastPaymentDate": "2025-04-19T00:00:00.000Z",
        "dailyPayment": 700,
        "totalProductAmount": 21000.00,
        "paidAmount": 700,
        "status": "partial"
      },
      {
        "product": {
          "_id": "60f7e5d3e8c8a61234567893",
          "name": "Faber Best Black Hot Air Fryer FAF 6.5L",
          "images": ["https://example.com/image2.jpg"],
          "price": 7000.00,
          "brand": "Faber"
        },
        "lastPaymentDate": "2025-04-19T00:00:00.000Z",
        "dailyPayment": 233,
        "totalProductAmount": 7000.00,
        "paidAmount": 233,
        "status": "partial"
      }
    ],
    "createdAt": "2023-04-19T00:00:00.000Z",
    "updatedAt": "2023-04-19T00:00:00.000Z"
  }
}
```

### Get Plan Product Detail
Retrieves detailed information about a specific product in a plan.

- **URL**: `/api/plans/:planId/products/:productId`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **URL Parameters**:
  - `planId`: ID of the plan
  - `productId`: ID of the product in the plan
- **Response Example**:
```json
{
  "product": {
    "_id": "60f7e5d3e8c8a61234567893",
    "name": "Samsung Galaxy M05 (Mint Green, 4G)",
    "images": ["https://example.com/image3.jpg"],
    "price": 6499.00,
    "brand": "Samsung",
    "model": "Galaxy M05"
  },
  "lastPaymentDate": "2025-04-30T00:00:00.000Z",
  "dailyPayment": 200,
  "totalProductAmount": 6499.00,
  "paidAmount": 200,
  "status": "partial",
  "equivalentTime": 30,
  "startDate": "2025-04-30T00:00:00.000Z",
  "endDate": "2025-05-30T00:00:00.000Z",
  "deliveryAddress": {
    "street": "346, Architects in Bangalore, 3C Koramangala 8th Block",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560095",
    "country": "India"
  },
  "paymentMethod": "card",
  "cardDetails": {
    "bank": "Federal Bank",
    "cardType": "debit card",
    "last4Digits": "7077"
  }
}
```

### Add Product to Plan
Adds a product to the user's plan.

- **URL**: `/api/plans/products`
- **Method**: `POST`
- **Auth Required**: Yes (Bearer Token)
- **Request Body**:
```json
{
  "productId": "60f7e5d3e8c8a61234567893",
  "dailyPayment": 200,
  "deliveryAddress": {
    "street": "346, Architects in Bangalore, 3C Koramangala 8th Block",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560095",
    "country": "India"
  },
  "paymentMethod": "card",
  "cardDetails": {
    "bank": "Federal Bank",
    "cardType": "debit card",
    "last4Digits": "7077"
  }
}
```
- **Response Example**:
```json
{
  "message": "Product added to plan successfully",
  "plan": {
    "_id": "60f7e5d3e8c8a61234567890",
    "user": "60f7e5d3e8c8a61234567891",
    "totalAmount": 19099.00,
    "completedAmount": 2100.00,
    "products": [
      {
        "product": "60f7e5d3e8c8a61234567892",
        "lastPaymentDate": "2025-04-19T00:00:00.000Z",
        "dailyPayment": 700,
        "totalProductAmount": 21000.00,
        "paidAmount": 700,
        "status": "partial"
      },
      {
        "product": "60f7e5d3e8c8a61234567893",
        "lastPaymentDate": "2025-04-30T00:00:00.000Z",
        "dailyPayment": 200,
        "totalProductAmount": 6499.00,
        "paidAmount": 0,
        "status": "pending",
        "startDate": "2025-04-30T00:00:00.000Z",
        "endDate": "2025-05-30T00:00:00.000Z",
        "deliveryAddress": {
          "street": "346, Architects in Bangalore, 3C Koramangala 8th Block",
          "city": "Bangalore",
          "state": "Karnataka",
          "pincode": "560095",
          "country": "India"
        },
        "paymentMethod": "card",
        "cardDetails": {
          "bank": "Federal Bank",
          "cardType": "debit card",
          "last4Digits": "7077"
        }
      }
    ]
  }
}
```

### Make Payment for Plan Product
Makes a payment for a product in a plan.

- **URL**: `/api/plans/:planId/products/:productId/payment`
- **Method**: `POST`
- **Auth Required**: Yes (Bearer Token)
- **URL Parameters**:
  - `planId`: ID of the plan
  - `productId`: ID of the product in the plan
- **Request Body**:
```json
{
  "amount": 200
}
```
- **Response Example**:
```json
{
  "message": "Payment successful",
  "updatedPaidAmount": 400,
  "totalProductAmount": 6499.00,
  "remainingAmount": 6099.00
}
```

### Remove Product from Plan
Removes a product from a plan (only if payment hasn't started).

- **URL**: `/api/plans/:planId/products/:productId`
- **Method**: `DELETE`
- **Auth Required**: Yes (Bearer Token)
- **URL Parameters**:
  - `planId`: ID of the plan
  - `productId`: ID of the product in the plan
- **Response Example**:
```json
{
  "message": "Product removed from plan successfully",
  "plan": {
    "_id": "60f7e5d3e8c8a61234567890",
    "user": "60f7e5d3e8c8a61234567891",
    "totalAmount": 12600.00,
    "completedAmount": 2100.00,
    "products": [
      {
        "product": "60f7e5d3e8c8a61234567892",
        "lastPaymentDate": "2025-04-19T00:00:00.000Z",
        "dailyPayment": 700,
        "totalProductAmount": 21000.00,
        "paidAmount": 700,
        "status": "partial"
      }
    ]
  }
}
```

## Payment Verification Flow

### Verify Daily Installment Payment

This endpoint verifies a payment for a daily installment and activates the product in the user's plan if it's the first payment.

- **URL**: `/api/payments/verify-daily-installment`
- **Method**: `POST`
- **Auth Required**: Yes (Bearer Token)
- **Request Body**:
```json
{
  "orderId": "65a4f7c8b2d3e4f5a6b7c8d0",
  "razorpay_order_id": "order_JDgHQbq9eEaLOx",
  "razorpay_payment_id": "pay_JDgJ9qYGFD1t3M",
  "razorpay_signature": "c4ef9f4168b557a62bf30f8b92138d77f5b58d1dbf367980a17db303c909f93a",
  "transaction_id": "65a4f7c8b2d3e4f5a6b7c8d2"
}
```
- **Response Example**:
```json
{
  "message": "Payment verified successfully",
  "paymentStatus": "partial",
  "totalPaid": 200,
  "remainingAmount": 6299.00,
  "isFirstPayment": true
}
```

### Product Activation Flow

1. When a user selects a product, it's added to their plan with `isActive: false`.
2. The product won't appear in the main plan listing (`GET /api/plans`) until after first payment.
3. The product can be viewed through the pending products endpoint (`GET /api/plans/pending`).
4. After the first payment is made and verified through the `/api/payments/verify-daily-installment` endpoint, the product's `isActive` field is automatically set to `true`.
5. The product will now appear in the main plan listing.

This ensures products only appear in the main plan listing after the first payment has been successfully processed. 