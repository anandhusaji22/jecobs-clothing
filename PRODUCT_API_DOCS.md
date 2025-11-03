# Product API Documentation

## Overview
Complete CRUD API for managing products with authentication, filtering, pagination, and denomination-specific queries.

## Base URL
```
/api/products
```

## Authentication
- **Public**: GET requests for active products
- **Admin Only**: POST, PUT, DELETE operations
- **Header**: `Authorization: Bearer <firebase_token>`

---

## Endpoints

### 1. Get All Products
```http
GET /api/products
```

**Query Parameters:**
- `denomination` - Filter by denomination (string)
- `minPrice` - Minimum price filter (number)
- `maxPrice` - Maximum price filter (number)
- `search` - Text search in name, description, denomination (string)
- `sortBy` - Sort field: createdAt, price, name (default: createdAt)
- `sortOrder` - Sort order: asc, desc (default: desc)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "product_id",
        "name": "Sacred Vestment",
        "description": "Beautiful ceremonial garment",
        "price": 299.99,
        "denomination": "clergy",
        "images": ["image1.jpg", "image2.jpg"],
        "sizes": [
          { "size": "M", "stock": 5 },
          { "size": "L", "stock": 3 }
        ],
        "colors": [
          { "color": "Gold", "colorCode": "#FFD700" }
        ],
        "isActive": true,
        "weight": 0.5,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

**Example Requests:**
```bash
# Get all active products
GET /api/products

# Filter by denomination with pagination
GET /api/products?denomination=clergy&page=1&limit=5

# Search with price range
GET /api/products?search=vestment&minPrice=100&maxPrice=500

# Sort by price ascending
GET /api/products?sortBy=price&sortOrder=asc
```

---

### 2. Get Products by Denomination
```http
GET /api/products/denomination/{denomination}
```

**Path Parameters:**
- `denomination` - The denomination to filter by (URL encoded)

**Query Parameters:**
- Same as general products endpoint
- `includeInactive` - Include inactive products (admin only)

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": {...},
    "denomination": "clergy",
    "priceRange": {
      "minPrice": 99.99,
      "maxPrice": 799.99,
      "avgPrice": 324.50
    }
  }
}
```

**Example Requests:**
```bash
# Get clergy products
GET /api/products/denomination/clergy

# Get laity products with price filter
GET /api/products/denomination/laity?minPrice=50&maxPrice=200
```

---

### 3. Get Single Product
```http
GET /api/products/{id}
```

**Path Parameters:**
- `id` - Product ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "product_id",
    "name": "Sacred Vestment",
    // ... full product object
  }
}
```

**Example Requests:**
```bash
# Get specific product
GET /api/products/64a1b2c3d4e5f6789012345
```

---

### 4. Create Product (Admin Only)
```http
POST /api/products
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "name": "New Sacred Vestment",
  "description": "Beautiful ceremonial garment for special occasions",
  "price": 399.99,
  "denomination": "clergy",
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "sizes": [
    { "size": "S", "stock": 10 },
    { "size": "M", "stock": 15 },
    { "size": "L", "stock": 8 }
  ],
  "colors": [
    { "color": "Gold", "colorCode": "#FFD700" },
    { "color": "Silver", "colorCode": "#C0C0C0" }
  ],
  "isActive": true,
  "weight": 0.75
}
```

**Required Fields:**
- `name` (string)
- `description` (string)
- `price` (number, >= 0)
- `denomination` (string)
- `images` (array of strings, at least one)

**Optional Fields:**
- `sizes` (array of {size: string, stock: number})
- `colors` (array of {color: string, colorCode: hex})
- `isActive` (boolean, default: true)
- `weight` (number)

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    // ... created product object
  }
}
```

---

### 5. Update Product (Admin Only)
```http
PUT /api/products/{id}
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "name": "Updated Product Name",
  "price": 449.99,
  "isActive": false
}
```

**Notes:**
- Only include fields you want to update
- All validation rules apply to updated fields
- Use `isActive: false` to soft delete products

**Response:**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    // ... updated product object
  }
}
```

---

### 6. Delete Product (Admin Only)
```http
DELETE /api/products/{id}
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": {
    // ... deleted product object
  }
}
```

---

## Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Price must be a positive number"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "No authorization token provided"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "Admin access required"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Product not found"
}
```

**409 Conflict:**
```json
{
  "success": false,
  "error": "Product with this name already exists"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Failed to fetch products"
}
```

---

## Usage Examples

### Frontend Integration

```javascript
// Get products with filtering
const getProducts = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/products?${params}`);
  const data = await response.json();
  return data;
};

// Create product (admin)
const createProduct = async (productData, adminToken) => {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(productData)
  });
  return response.json();
};

// Get products by denomination
const getCleregeProducts = async () => {
  const response = await fetch('/api/products/denomination/clergy');
  return response.json();
};
```

### Common Use Cases

```bash
# E-commerce product listing
GET /api/products?page=1&limit=12&sortBy=price&sortOrder=asc

# Search functionality
GET /api/products?search=vestment%20gold&minPrice=100

# Category page
GET /api/products/denomination/clergy?page=1&limit=8

# Admin product management
POST /api/products (with auth header)
PUT /api/products/64a1b2c3d4e5f6789012345 (with auth header)
DELETE /api/products/64a1b2c3d4e5f6789012345 (with auth header)
```

---

## Data Validation

### Product Schema
- **name**: Required, trimmed string
- **description**: Required string
- **price**: Required number >= 0
- **denomination**: Required string
- **images**: Required array with at least one string
- **sizes**: Optional array of {size: string, stock: number >= 0}
- **colors**: Optional array of {color: string, colorCode: valid hex}
- **isActive**: Boolean (default: true)
- **weight**: Optional positive number

### Color Code Format
- Must be valid hex color: `#RRGGBB` (case insensitive)
- Examples: `#FFD700`, `#ff0000`, `#C0C0C0`

### Stock Management
- Stock values must be non-negative integers
- Use 0 for out-of-stock items
- No automatic stock reduction (implement in order processing)