# PrimeTime Admin Panel - API Implementation Summary

## 📋 Overview

This document summarizes the complete API implementation for the PrimeTime Admin Panel, including endpoints for managing users and subscriptions from the MySQL database.

---

## 🚀 What Has Been Created

### 1. **API Route Handlers** (Next.js App Router)

Located in `src/app/api/`:

- **`users/route.ts`** - GET all users, POST new user
- **`users/[id]/route.ts`** - GET, PUT, DELETE specific user
- **`subscriptions/route.ts`** - GET all subscriptions, POST new subscription
- **`subscriptions/[id]/route.ts`** - GET, PUT, DELETE specific subscription

### 2. **Service Classes** (API Client)

Located in `src/services/`:

- **`userService.ts`** - User management methods
- **`subscriptionService.ts`** - Subscription management methods

### 3. **Documentation**

- **`API_DOCUMENTATION.md`** - Complete API reference with examples
- **`API_SETUP_GUIDE.md`** - Integration and usage guide
- **`INTEGRATION_EXAMPLE.tsx`** - Working example component
- **`.env.example`** - Environment configuration template

---

## 📊 Database Schema Mapping

### Users Table Fields
```sql
SELECT `user_id`, `user_name`, `email`, `mobile`, `otp`, `otp_verified`, 
`login_oauth_uid`, `age`, `dob`, `password`, `type`, `gender`, `register_step`, 
`profile_picture`, `card_name`, `card_number`, `card_expiry`, `card_ccv`, `upi`, 
`plan`, `status`, `user_movielist`, `user_serieslist`, `user_movie_fav`, 
`user_series_fav`, `user_session`, `forgot_otp`, `login_otp`, `logged_in`, 
`log_count`, `last_login_ip_address`, `created_at` FROM `vtagu`.`user`
```

**TypeScript Interface:**
```typescript
interface User {
  user_id: number;
  user_name: string;
  email: string;
  mobile?: string;
  otp?: string;
  otp_verified: number;
  login_oauth_uid?: string;
  age?: number;
  dob?: string;
  password?: string;
  type?: string;
  gender?: string;
  register_step?: number;
  profile_picture?: string;
  card_name?: string;
  card_number?: string;
  card_expiry?: string;
  card_ccv?: string;
  upi?: string;
  plan?: string;
  status: string;
  user_movielist?: string;
  user_serieslist?: string;
  user_movie_fav?: string;
  user_series_fav?: string;
  user_session?: string;
  forgot_otp?: string;
  login_otp?: string;
  logged_in: number;
  log_count?: number;
  last_login_ip_address?: string;
  created_at: string;
}
```

### Subscriptions Table Fields
```sql
SELECT `subscription_id`, `plan_id`, `user_id`, `txn_id`, `price_amount`, 
`paid_amount`, `timestamp_from`, `timestamp_to`, `payment_method`, `payment_details`, 
`payment_status`, `payment_timestamp`, `status`, `currency` FROM `vtagu`.`subscription`
```

**TypeScript Interface:**
```typescript
interface Subscription {
  subscription_id: number;
  plan_id: number;
  user_id: number;
  txn_id?: string;
  price_amount: number;
  paid_amount: number;
  timestamp_from: number;
  timestamp_to: number;
  payment_method?: string;
  payment_details?: string;
  payment_status: string;
  payment_timestamp?: number;
  status: string;
  currency: string;
}
```

---

## 🔌 API Endpoints

### Users API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users (with pagination & filters) |
| GET | `/api/users/:id` | Get specific user |
| POST | `/api/users` | Create new user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `search` - search by name/email
- `status` - filter by status
- `sortBy` - field to sort by
- `sortOrder` - ASC or DESC

### Subscriptions API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions` | Get all subscriptions (with pagination & filters) |
| GET | `/api/subscriptions/:id` | Get specific subscription |
| POST | `/api/subscriptions` | Create new subscription |
| PUT | `/api/subscriptions/:id` | Update subscription |
| DELETE | `/api/subscriptions/:id` | Delete subscription |

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `userId` - filter by user ID
- `status` - filter by status
- `paymentStatus` - filter by payment status
- `sortBy` - field to sort by
- `sortOrder` - ASC or DESC

---

## 💻 Usage Examples

### Get All Users
```typescript
import { userService } from '@/services/userService';

const response = await userService.getAll(
  1,           // page
  20,          // limit
  'john',      // search (optional)
  'active',    // status (optional)
  'user_id',   // sortBy
  'DESC'       // sortOrder
);

console.log(response.data);      // User[]
console.log(response.pagination); // Pagination info
```

### Create User
```typescript
const newUser = await userService.create({
  user_name: 'John Doe',
  email: 'john@example.com',
  mobile: '9876543210',
  age: 25,
  dob: '1999-05-15',
  type: 'premium',
  plan: 'Premium Plan',
  status: 'active'
});
```

### Get User Subscriptions
```typescript
import { subscriptionService } from '@/services/subscriptionService';

const subs = await subscriptionService.getByUserId(1);
// Returns all subscriptions for user ID 1
```

### Create Subscription
```typescript
const newSub = await subscriptionService.create({
  plan_id: 1,
  user_id: 1,
  txn_id: 'TXN123456789',
  price_amount: 14.99,
  paid_amount: 14.99,
  timestamp_from: Math.floor(Date.now() / 1000),
  timestamp_to: Math.floor(Date.now() / 1000) + 2592000, // +30 days
  payment_method: 'credit_card',
  payment_status: 'Success',
  status: 'active',
  currency: 'USD'
});
```

---

## 🔐 Authentication

Currently, the API routes accept an `Authorization` header and pass it through to the backend:

```typescript
// Request with auth
const response = await fetch('/api/users', {
  headers: {
    'Authorization': 'Bearer token_here'
  }
});
```

The existing `apiClient` in `src/lib/api-client.ts` automatically adds tokens from `localStorage['admin_token']`.

---

## ⚙️ Configuration

### Environment Variables

Create `.env.local`:

```
# Backend API URL (where your MySQL queries are executed)
NEXT_PRIVATE_BACKEND_API=http://localhost:8000/api

# Frontend API URL (the Next.js app itself)
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Optional settings
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_AUTH_ENABLED=true
```

---

## 📂 File Structure

```
admin-panel/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── users/
│   │   │   │   ├── route.ts          # GET /api/users, POST /api/users
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts      # GET/PUT/DELETE /api/users/:id
│   │   │   └── subscriptions/
│   │   │       ├── route.ts          # GET /api/subscriptions, POST
│   │   │       └── [id]/
│   │   │           └── route.ts      # GET/PUT/DELETE /api/subscriptions/:id
│   │   └── [other pages]
│   └── services/
│       ├── userService.ts            # User API client
│       ├── subscriptionService.ts    # Subscription API client
│       └── movieService.ts           # Existing service
├── API_DOCUMENTATION.md              # Complete API reference
├── API_SETUP_GUIDE.md               # Integration guide
├── INTEGRATION_EXAMPLE.tsx           # Example component
├── .env.example                      # Environment template
└── [other files]
```

---

## 🎯 Implementation Checklist

- ✅ API routes created for users (GET, POST, PUT, DELETE)
- ✅ API routes created for subscriptions (GET, POST, PUT, DELETE)
- ✅ Service classes with full TypeScript support
- ✅ Pagination support
- ✅ Filtering and sorting
- ✅ Error handling
- ✅ Complete API documentation
- ✅ Integration guide
- ✅ Usage examples
- ⏳ **TODO:** Update your components to use these services
- ⏳ **TODO:** Connect to actual MySQL database
- ⏳ **TODO:** Implement authentication middleware
- ⏳ **TODO:** Add request validation
- ⏳ **TODO:** Add rate limiting (optional)

---

## 🔗 Backend Integration Note

**Important:** The current API routes in `src/app/api/` are proxies that forward requests to a backend API specified in `NEXT_PRIVATE_BACKEND_API`. 

You need to:

1. **Option A:** Have a backend server running at `http://localhost:8000/api` that handles the database queries
2. **Option B:** Replace the fetch calls in the API routes with direct database queries using a MySQL driver

### For Option B (Direct Database Integration)

Install MySQL driver:
```bash
npm install mysql2
```

Then modify `src/app/api/users/route.ts`:
```typescript
import mysql from 'mysql2/promise';

export async function GET(request: NextRequest) {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const [rows] = await connection.execute(
      'SELECT * FROM user LIMIT 20'
    );

    await connection.end();

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return NextResponse.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}
```

---

## 🧪 Testing the API

### Using cURL

```bash
# Get all users
curl -X GET "http://localhost:3000/api/users?page=1&limit=10" \
  -H "Content-Type: application/json"

# Create new user
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "Test User",
    "email": "test@example.com",
    "status": "active"
  }'

# Get subscriptions for user
curl -X GET "http://localhost:3000/api/subscriptions?userId=1" \
  -H "Content-Type: application/json"
```

### Using TypeScript/JavaScript

```typescript
// In your component
const users = await userService.getAll(1, 10, undefined, 'active');
console.log(users);
```

---

## 📚 Documentation Files

1. **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Full API reference
2. **[API_SETUP_GUIDE.md](./API_SETUP_GUIDE.md)** - Setup and integration
3. **[INTEGRATION_EXAMPLE.tsx](./INTEGRATION_EXAMPLE.tsx)** - Working example

---

## ✨ Features

- ✅ Full CRUD operations for users and subscriptions
- ✅ Pagination support
- ✅ Advanced filtering and sorting
- ✅ TypeScript support with full type safety
- ✅ Error handling with meaningful messages
- ✅ Bearer token authentication support
- ✅ Consistent response format
- ✅ Service layer abstraction

---

## 🤝 Next Steps

1. Read [API_SETUP_GUIDE.md](./API_SETUP_GUIDE.md) for integration details
2. Check [INTEGRATION_EXAMPLE.tsx](./INTEGRATION_EXAMPLE.tsx) for usage examples
3. Update your `.env.local` with backend API URL
4. Update your existing pages to use `userService` and `subscriptionService`
5. Set up database connection (see Backend Integration Note)
6. Test endpoints using the provided cURL examples

---

## 📞 Support

For issues or questions, refer to:
- API_DOCUMENTATION.md - Detailed endpoint documentation
- API_SETUP_GUIDE.md - Integration help
- Check the existing movieService implementation for patterns
- Browser DevTools Network tab for debugging

---

**Implementation Date:** April 21, 2026
**API Version:** v1
**Status:** ✅ Complete & Ready for Integration
