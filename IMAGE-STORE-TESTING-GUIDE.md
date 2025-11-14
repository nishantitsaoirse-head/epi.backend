# 🖼️ Image Store API Testing Guide

Complete guide to test Image Store APIs on live server: **http://13.203.227.43:5000**

---

## 🚀 Quick Start (Easiest Method)

### Step 1: Generate Admin JWT Token

```bash
# Navigate to project directory
cd c:\Users\admin\Desktop\epi-backend-new

# Run token generator script
node generate-test-token.js
```

**Output:**
- ✅ Creates/finds admin user in database
- 🔐 Generates JWT access token (valid for 7 days)
- 📋 Shows complete instructions

### Step 2: Copy Access Token

Copy the `ACCESS TOKEN` from the script output. It will look like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWYxMjM0NTY3ODkwYWJjZGVmMTIzNDUiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MTAxMjM0NTYsImV4cCI6MTcxMDcyODI1Nn0.abc123...
```

### Step 3: Import Postman Collection

1. Open Postman
2. Click **Import**
3. Select file: `Image-Store-API-Tests.postman_collection.json`
4. Collection imported with 17 pre-configured requests! ✅

### Step 4: Set Variables

In Postman:
1. Click on collection name **"Image Store API Tests"**
2. Go to **Variables** tab
3. Update `access_token` with your token from Step 2
4. Save

### Step 5: Test Image Upload

1. Select request: **"2. Upload Image (Admin)"**
2. Go to **Body** tab → **form-data**
3. Click on **"image"** field → Select any image file
4. Click **Send**

**Expected Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "_id": "65f1234567890abcdef12345",
    "imageUrl": "https://your-s3-bucket.amazonaws.com/image-store/...",
    "title": "Summer Sale Banner",
    "type": "banner",
    "platform": "both",
    "width": 1200,
    "height": 800,
    "isActive": true
  }
}
```

### Step 6: Verify Image Access

Copy `imageUrl` from response and:
- ✅ Open in browser (should display image)
- ✅ OR use Postman GET request

---

## 📋 Available Endpoints

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/images/types` | Get available image types & platforms |
| GET | `/api/images/:id` | Get single image by ID |
| GET | `/api/images/type/:type` | Get images by type (banner, ad, etc.) |
| POST | `/api/images/:id/click` | Increment click count |

### Admin Endpoints (Require Auth Token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/images` | Upload new image |
| GET | `/api/images/admin/all` | Get all images with pagination |
| GET | `/api/images/admin/active` | Get only active images |
| GET | `/api/images/stats` | Get image statistics |
| PUT | `/api/images/:id` | Update image metadata |
| PUT | `/api/images/:id/replace` | Replace image file |
| PATCH | `/api/images/:id/toggle-status` | Toggle active/inactive |
| PATCH | `/api/images/order` | Update image display order |
| PATCH | `/api/images/bulk/status` | Bulk update status |
| DELETE | `/api/images/:id` | Soft delete image |
| DELETE | `/api/images/:id/permanent` | Permanent delete |
| POST | `/api/images/:id/restore` | Restore deleted image |
| DELETE | `/api/images/bulk/delete` | Bulk soft delete |

---

## 🧪 Manual Testing Examples

### 1️⃣ Test Without Token (Should Fail)

**Request:**
```
POST http://13.203.227.43:5000/api/images
Body: (image file)
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Authentication token required",
  "code": "NO_TOKEN"
}
```

---

### 2️⃣ Get Image Types (Public)

**Request:**
```
GET http://13.203.227.43:5000/api/images/types
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "types": ["banner", "ad", "promotion", "carousel", "thumbnail", "icon"],
    "platforms": ["web", "app", "both"]
  }
}
```

---

### 3️⃣ Upload Image with Token

**Request:**
```
POST http://13.203.227.43:5000/api/images

Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN

Body (form-data):
  image: [SELECT FILE]
  title: "Test Banner"
  type: "banner"
  platform: "both"
  orderBy: 1
  isActive: true
  altText: "Test alt text"
  description: "Test description"
  linkUrl: "https://example.com"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": { ... }
}
```

---

### 4️⃣ Get All Images (Admin)

**Request:**
```
GET http://13.203.227.43:5000/api/images/admin/all?page=1&limit=10

Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "images": [...],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

### 5️⃣ Get Images by Type (Public)

**Request:**
```
GET http://13.203.227.43:5000/api/images/type/banner?platform=web
```

**Expected Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "...",
      "imageUrl": "https://...",
      "title": "Banner 1",
      "type": "banner",
      "platform": "both"
    }
  ]
}
```

---

## 🔍 Troubleshooting

### ❌ Error: "ID token is required"

**Cause:** Aap Firebase token use kar rahe hain instead of JWT token

**Solution:** Use `generate-test-token.js` script to get JWT token

---

### ❌ Error: "Authentication token required"

**Cause:** Token missing in Authorization header

**Solution:**
- Postman → Authorization tab
- Type: Bearer Token
- Token: [Paste your access token]

---

### ❌ Error: "Access denied. Admin role required"

**Cause:** User is not admin

**Solution:** Run `generate-test-token.js` again - it will create admin user

---

### ❌ Error: "Error processing image"

**Cause:** S3 credentials missing or incorrect

**Solution:** Check `.env` file for AWS credentials:
```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your_bucket_name
```

---

### ❌ Error: "Only image files are allowed"

**Cause:** Wrong file type uploaded

**Solution:** Upload only: jpg, jpeg, png, webp, gif, svg

---

### ❌ Error: "Image file is required"

**Cause:** No file selected in form-data

**Solution:** Make sure to select file in "image" field

---

## 📊 Testing Checklist

### Basic Upload Test
- [ ] Get image types (no auth)
- [ ] Upload image with auth
- [ ] Verify imageUrl is accessible
- [ ] Check image in database

### CRUD Operations Test
- [ ] Create (upload) image
- [ ] Read (get) image by ID
- [ ] Update image metadata
- [ ] Delete (soft) image
- [ ] Restore deleted image

### Admin Features Test
- [ ] Get all images with pagination
- [ ] Filter by type
- [ ] Filter by platform
- [ ] Search images
- [ ] Get statistics
- [ ] Toggle status
- [ ] Update order
- [ ] Bulk operations

### Public Access Test
- [ ] Access image URL without auth
- [ ] Get images by type
- [ ] Increment click count
- [ ] Verify click count updated

---

## 🎯 Image Upload Requirements

### Supported Formats
- ✅ JPEG / JPG
- ✅ PNG
- ✅ WEBP
- ✅ GIF
- ✅ SVG

### File Size
- ⚠️ Maximum: 10 MB

### Image Processing
- 🖼️ Auto-resize to max 1200px width
- 🎨 Convert to JPEG (90% quality)
- 📦 Upload to S3

### Required Fields
- ✅ `image` (file)
- ✅ `title` (text)
- ✅ `type` (banner/ad/promotion/carousel/thumbnail/icon)
- ✅ `platform` (web/app/both)

### Optional Fields
- `orderBy` (number)
- `isActive` (boolean)
- `altText` (text)
- `description` (text)
- `linkUrl` (text)
- `metadata` (JSON string)

---

## 🔐 Token Expiry

- **Access Token:** Valid for 7 days
- **Refresh Token:** Valid for 30 days

If token expires, run `generate-test-token.js` again to get new token.

---

## 📞 Support

If you encounter any issues:
1. Check troubleshooting section above
2. Verify MongoDB connection
3. Verify AWS S3 credentials
4. Check server logs for errors

---

## ✅ Success Indicators

Your image upload is successful if:
1. ✅ API returns `"success": true`
2. ✅ Response contains `imageUrl`
3. ✅ ImageUrl opens in browser
4. ✅ Image appears in admin panel
5. ✅ Image is in S3 bucket

---

**Happy Testing! 🚀**
