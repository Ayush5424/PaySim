# Authentication

## Endpoints

- POST /api/v1/auth/signup - Register new user
- POST /api/v1/auth/login - Login and get JWT + session token
- POST /api/v1/auth/refresh - Refresh access token
- POST /api/v1/auth/logout - Invalidate session

## JWT Flow
- Access token: 15 min (900000ms)
- Refresh token: 7 days
- HMAC-SHA256 signed
- Payload: userId, upiId, email, phone

## Security
- BCrypt strength 12 for passwords and PINs
- Account lockout after 5 failed attempts
- Sessions stored with SHA-256 token hash
