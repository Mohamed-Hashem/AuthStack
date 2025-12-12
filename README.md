# AuthStack 🔐

A secure authentication and user management API built with Node.js, Express, and MongoDB.

## Overview

AuthStack is a RESTful API server providing secure authentication, user profile management, and account services. A reusable backend service that can be integrated with any frontend application.

---

## Technologies Stack

| Technology  | Purpose                       |
| ----------- | ----------------------------- |
| Node.js     | Runtime environment           |
| Express.js  | Web framework                 |
| MongoDB     | Database                      |
| Mongoose    | ODM for MongoDB               |
| JWT         | Authentication tokens         |
| bcryptjs    | Password hashing              |
| Joi         | Request validation            |
| Helmet      | Security headers              |
| Compression | Gzip response compression     |
| CORS        | Cross-origin resource sharing |

---

## Features

### 🔐 Authentication

- User registration with validation
- Secure password hashing (bcrypt)
- JWT token generation and verification
- Token-based authentication middleware
- Protected routes

### 👤 User Profile Management

- Get user profile
- Update profile (name, age)
- Change password with validation
- User statistics (account age, member since)

### 🛡️ Security

- Helmet security headers
- Password hashing with salt rounds
- JWT token expiration (7 days)
- Protected API endpoints
- Input validation with Joi schemas
- Error handling middleware
- CORS configuration
- Environment variables for sensitive data
- MongoDB injection prevention (Mongoose)

### ⚡ Performance

- Gzip compression for responses
- Optimized database queries with .lean()
- Database connection retry logic (5 retries)
- Centralized error handling
- Streamlined validation utilities (45% code reduction)

### 📊 Data Services

- User statistics endpoint
- Profile CRUD operations
- Formatted user responses
- Centralized error handling

---

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User

**POST** `/api/auth/register`

Creates a new user account with first name, last name, age, email, and password.

#### Login User

**POST** `/api/auth/login`

Authenticates user and returns JWT token with user information.

#### Verify Token

**GET** `/api/auth/verify`

Verifies JWT token validity and returns user data.

### Profile Routes (`/api`)

#### Get User Profile

**GET** `/api/profile`

Returns authenticated user's profile information.

#### Update User Profile

**PUT** `/api/profile`

Updates user's first name, last name, and/or age.

#### Change Password

**PUT** `/api/change-password`

Changes user's password after verifying current password.

#### Get User Statistics

**GET** `/api/stats`

Returns user account statistics including account age and membership dates.

```

---

## Project Structure

The backend follows a modular architecture with separate directories for models, routes, middleware, and utilities.

- **index.js** - Main server file with Express configuration
- **models/** - MongoDB/Mongoose data models
- **routes/** - API route handlers for authentication and data
- **middleware/** - JWT verification and request processing
- **utils/** - Validation helpers and response formatters

---

## Database Schema

### User Model

- **First Name:** String, required, trimmed
- **Last Name:** String, required, trimmed
- **Age:** Number, required, min: 18, max: 120
- **Email:** String, required, unique, lowercase, trimmed
- **Password:** String, required (hashed)
- **Timestamps:** createdAt & updatedAt (auto-generated)

---

## Validation Rules

### Registration

- **First/Last Name:** 2-50 characters, letters only
- **Age:** 18-120 years
- **Email:** Valid email format
- **Password:** Minimum 6 characters

### Profile Update

- **First/Last Name:** 2-50 characters, letters only
- **Age:** 18-120 years

### Password Change

- **Current Password:** Required
- **New Password:** Minimum 6 characters
- **Passwords must not match**

---

## Environment Variables

Required environment variables for the backend server:

- **MONGODB_URI** - MongoDB connection string
- **JWT_SECRET** - Secret key for JWT token signing
- **JWT_EXPIRES_IN** - Token expiration time (default: 7d)
- **PORT** - Server port (default: 5000)
- **NODE_ENV** - Environment mode (development/production)
- **FRONTEND_URL** - Frontend application URL for CORS

---

## Setup & Installation

1. Navigate to backend directory
2. Install dependencies
3. Create `.env` file with required environment variables
4. Start the server

Server will run on the configured port (default: 5000)

---

## Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `500` - Server Error

---

## Middleware

### verifyToken

Authenticates requests using JWT tokens from Authorization header. The decoded user payload is attached to the request object for use in route handlers.

---

## Utilities

### Validation (`utils/validation.js`)

- `validateName()` - Name validation with custom field name
- `validateAge()` - Age range validation
- `validateProfileUpdate()` - Complete profile validation

### Helpers (`utils/helpers.js`)

- `formatUserResponse()` - Formats user object for responses
- `handleError()` - Centralized error handling

---

## Security Best Practices

✅ Helmet security headers for protection against common vulnerabilities
✅ Gzip compression for optimized response sizes
✅ Passwords hashed with bcrypt (10 salt rounds)
✅ JWT tokens with configurable expiration
✅ Password field excluded from responses
✅ Input validation on all endpoints
✅ CORS configuration
✅ Environment variables for sensitive data
✅ MongoDB injection prevention (Mongoose)
✅ Database connection retry logic for reliability

---

## Recent Enhancements

### Security & Performance

✅ Added Helmet middleware for security headers
✅ Implemented gzip compression for responses
✅ Database connection retry logic (5 retries with 5s delay)
✅ Optimized queries with .lean() for faster responses

### Code Quality

✅ Reduced validation utilities by 45%
✅ Clean codebase without comments
✅ ESLint and Prettier configuration
✅ Consistent code formatting
✅ Centralized error handling patterns

---

## Future Enhancements

- [ ] Rate limiting
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Refresh tokens
- [ ] User roles and permissions
- [ ] Activity logging
- [ ] Two-factor authentication
- [ ] Social media login integration

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## License

This project is open source and available under the [MIT License](../LICENSE).
```
