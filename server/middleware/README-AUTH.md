# JWT Authentication Middleware Documentation

## Overview

This authentication system protects admin-only routes using JWT (JSON Web Tokens). The `verifyAdmin` middleware ensures only authenticated administrators can perform data-modifying operations.

## Files Created/Modified

### 1. **Middleware: `verifyAdmin.js`**

-   Location: `server/middleware/verifyAdmin.js`
-   Purpose: Validates JWT tokens and verifies admin credentials
-   Features:
    -   Extracts Bearer token from Authorization header
    -   Verifies token using JWT_SECRET from environment
    -   Checks if admin exists in AdminCredential collection
    -   Attaches admin info to `req.admin` for downstream use
    -   Returns appropriate error responses (401/403/500)

### 2. **Protected Routes**

#### University List Routes (`server/routes/universityList/universityListRoute.js`)

-   **Public (no auth required):**

    -   `GET /api/university` - Get all universities
    -   `GET /api/university/:id` - Get single university

-   **Protected (requires admin token):**
    -   `PUT /api/university/:id` - Update university
    -   `DELETE /api/university/:id` - Delete university

#### Add University Route (`server/routes/addNewUniversity/universityAddRoute.js`)

-   **Protected (requires admin token):**
    -   `POST /api/university/add` - Add new university

## How to Use

### 1. **Login as Admin**

First, authenticate to get a JWT token:

```javascript
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "yourpassword"
}

// Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. **Use Token in Protected Requests**

Include the token in the Authorization header:

```javascript
// Example: Update a university
PUT /api/university/64abc123def456
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data

// Your request body with university data
```

### 3. **Frontend Integration Example**

```javascript
// Store token after login
const loginResponse = await axios.post("/api/admin/login", {
    email: "admin@example.com",
    password: "password123",
});
const token = loginResponse.data.token;
localStorage.setItem("adminToken", token);

// Use token in subsequent requests
const token = localStorage.getItem("adminToken");

// Update university
await axios.put(`/api/university/${id}`, formData, {
    headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
    },
});

// Delete university
await axios.delete(`/api/university/${id}`, {
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

// Add new university
await axios.post("/api/university/add", formData, {
    headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
    },
});
```

## Error Responses

### 401 Unauthorized

Returned when:

-   No Authorization header is provided
-   Token is missing or malformed
-   Token has expired
-   Token is invalid

```json
{
    "success": false,
    "message": "Unauthorized - No token provided"
}
```

### 403 Forbidden

Returned when:

-   Token is valid but admin doesn't exist in database

```json
{
    "success": false,
    "message": "Forbidden - Admin access required"
}
```

### 500 Server Error

Returned when:

-   Unexpected server error during authentication

```json
{
    "success": false,
    "message": "Server error during authentication"
}
```

## Token Details

-   **Algorithm**: HS256 (HMAC with SHA-256)
-   **Expiration**: 1 hour (set in adminLoginController)
-   **Secret**: Stored in `.env` as `JWT_SECRET`
-   **Payload**: Contains admin email

## Security Best Practices

1. **Always use HTTPS in production** to prevent token interception
2. **Store tokens securely**:
    - Frontend: Use httpOnly cookies or secure localStorage
    - Never expose tokens in URLs or logs
3. **Token expiration**: Tokens expire after 1 hour
4. **Refresh tokens**: Consider implementing refresh token mechanism for longer sessions
5. **Environment variables**: Keep JWT_SECRET secure and never commit to version control

## Testing with Postman/Thunder Client

### 1. Login

```
POST http://localhost:5000/api/admin/login
Body (JSON):
{
  "email": "your-admin@email.com",
  "password": "yourpassword"
}
```

Copy the returned token.

### 2. Protected Request

```
PUT http://localhost:5000/api/university/64abc123def456
Headers:
  Authorization: Bearer YOUR_TOKEN_HERE
Body (form-data):
  name: "Updated University Name"
  ... other fields
```

## Troubleshooting

### "Unauthorized - No token provided"

-   Ensure Authorization header is included
-   Format must be: `Authorization: Bearer YOUR_TOKEN`

### "Unauthorized - Token expired"

-   Login again to get a new token
-   Consider implementing token refresh logic

### "Forbidden - Admin access required"

-   Admin account may have been deleted
-   Verify admin exists in AdminCredential collection

### "Invalid token"

-   Token may be corrupted
-   Ensure JWT_SECRET matches between token creation and verification
-   Don't modify the token string

## Admin Info Access in Controllers

After successful authentication, admin information is available in controllers:

```javascript
export const updateUniversity = async (req, res) => {
    // Access authenticated admin info
    console.log("Request made by:", req.admin.email);
    console.log("Admin role:", req.admin.role);

    // Your controller logic here...
};
```

## Next Steps / Enhancements

1. **Refresh Tokens**: Implement refresh token mechanism for better UX
2. **Role-Based Access**: Add role checks (super-admin, editor, viewer)
3. **Rate Limiting**: Add rate limiting to prevent brute force attacks
4. **Audit Logging**: Log all admin actions for security auditing
5. **Multi-Factor Authentication**: Add 2FA for enhanced security
