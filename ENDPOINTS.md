# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Products Endpoints

### 1. Get All Products
- **Endpoint:** `GET /products`
- **Description:** Retrieve all products
- **Example:**
```bash
curl http://localhost:5000/api/products
# or in PowerShell:
Invoke-WebRequest -Uri 'http://localhost:5000/api/products' -Method Get
```

### 2. Get Single Product
- **Endpoint:** `GET /products/:productId`
- **Description:** Get details of a specific product
- **Example:**
```bash
curl http://localhost:5000/api/products/690f0b01a3a5a835649d934b
# or in PowerShell:
Invoke-WebRequest -Uri 'http://localhost:5000/api/products/690f0b01a3a5a835649d934b' -Method Get
```

## Cart Endpoints

### 1. View Cart
- **Endpoint:** `GET /cart`
- **Description:** Get all items in the user's cart
- **Example:**
```bash
curl http://localhost:5000/api/cart
# or in PowerShell:
Invoke-WebRequest -Uri 'http://localhost:5000/api/cart' -Method Get
```

### 2. Add to Cart
- **Endpoint:** `POST /cart/add/:productId`
- **Description:** Add a product to cart
- **Body Parameters:**
  - `quantity` (number, optional, default: 1)
- **Example:**
```bash
curl -X POST -H "Content-Type: application/json" -d '{"quantity": 1}' http://localhost:5000/api/cart/add/690f0b01a3a5a835649d934b
# or in PowerShell:
$body = @{ quantity = 1 } | ConvertTo-Json
Invoke-WebRequest -Uri 'http://localhost:5000/api/cart/add/690f0b01a3a5a835649d934b' -Method Post -Body $body -ContentType 'application/json'
```

### 3. Remove from Cart
- **Endpoint:** `DELETE /cart/remove/:productId`
- **Description:** Remove a product from cart
- **Example:**
```bash
curl -X DELETE http://localhost:5000/api/cart/remove/690f0b01a3a5a835649d934b
# or in PowerShell:
Invoke-WebRequest -Uri 'http://localhost:5000/api/cart/remove/690f0b01a3a5a835649d934b' -Method Delete
```

## Wishlist Endpoints

### 1. View Wishlist
- **Endpoint:** `GET /wishlist`
- **Description:** Get all items in the user's wishlist
- **Example:**
```bash
curl http://localhost:5000/api/wishlist
# or in PowerShell:
Invoke-WebRequest -Uri 'http://localhost:5000/api/wishlist' -Method Get
```

### 2. Add to Wishlist
- **Endpoint:** `POST /wishlist/add/:productId`
- **Description:** Add a product to wishlist
- **Example:**
```bash
curl -X POST http://localhost:5000/api/wishlist/add/690f0b01a3a5a835649d934b
# or in PowerShell:
Invoke-WebRequest -Uri 'http://localhost:5000/api/wishlist/add/690f0b01a3a5a835649d934b' -Method Post
```

### 3. Remove from Wishlist
- **Endpoint:** `DELETE /wishlist/remove/:productId`
- **Description:** Remove a product from wishlist
- **Example:**
```bash
curl -X DELETE http://localhost:5000/api/wishlist/remove/690f0b01a3a5a835649d934b
# or in PowerShell:
Invoke-WebRequest -Uri 'http://localhost:5000/api/wishlist/remove/690f0b01a3a5a835649d934b' -Method Delete
```

## Response Format

### Success Response Format
```json
{
  "success": true,
  "data": [...],  // or {...} for single items
  "message": "Success message here" // optional
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error message here"
}
```

## Common HTTP Status Codes
- 200: Success
- 201: Created successfully
- 400: Bad request
- 401: Unauthorized
- 404: Not found
- 500: Server error

## Quick Start Guide

1. Start the server:
```bash
node index.js
```

2. Create a test product (if needed):
```bash
node scripts/create-test-product.js
```

3. Test the endpoints:
   - Use the provided PowerShell or curl commands
   - Replace product IDs with actual IDs from your database
   - For PowerShell, copy and paste the commands exactly as shown

## Testing Notes
1. The server must be running (`node index.js`)
2. MongoDB must be running and accessible
3. Replace `690f0b01a3a5a835649d934b` with actual product IDs from your database
4. For testing purposes, authentication is handled by a test middleware that uses "test-user-123" as the user ID
5. All responses are in JSON format
6. Check the response's `success` field to determine if the operation was successful