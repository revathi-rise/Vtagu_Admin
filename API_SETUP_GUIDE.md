# API Setup & Integration Guide

## Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env.local` and update with your backend API URL:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PRIVATE_BACKEND_API=http://localhost:8000/api
```

### 2. API Routes Structure

```
src/app/api/
├── users/
│   ├── route.ts          # GET all users, POST new user
│   └── [id]/
│       └── route.ts      # GET, PUT, DELETE specific user
├── subscriptions/
│   ├── route.ts          # GET all subscriptions, POST new subscription
│   └── [id]/
│       └── route.ts      # GET, PUT, DELETE specific subscription
```

### 3. Services Structure

```
src/services/
├── userService.ts        # User API client service
├── subscriptionService.ts # Subscription API client service
└── movieService.ts       # Existing movie service
```

### 4. Using the Services

#### In Components

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { userService } from '@/services/userService';
import { subscriptionService } from '@/services/subscriptionService';

export default function MyComponent() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const userResponse = await userService.getAll(1, 20);
        setUsers(userResponse.data);

        // Fetch subscriptions
        const subResponse = await subscriptionService.getActive();
        console.log('Active subscriptions:', subResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Total Users: {users.length}</h1>
      {/* Your component JSX */}
    </div>
  );
}
```

#### Fetching with Filters

```typescript
// Get active users, paginated, sorted by creation date
const response = await userService.getAll(
  1,           // page
  20,          // limit
  'john',      // search
  'active',    // status
  'created_at',// sortBy
  'DESC'       // sortOrder
);
```

#### Search Users

```typescript
const results = await userService.search('user@example.com', 10);
```

#### Get User by Status

```typescript
const activeUsers = await userService.getByStatus('active', 1, 50);
```

#### Create New User

```typescript
const newUser = await userService.create({
  user_name: 'John Doe',
  email: 'john@example.com',
  mobile: '9876543210',
  plan: 'Premium Plan',
  status: 'active'
});
```

#### Update User

```typescript
const updated = await userService.update(1, {
  plan: 'Ultra 4K Plan',
  age: 25
});
```

#### Delete User

```typescript
await userService.delete(1);
```

### 5. Subscription Service Examples

#### Get All Subscriptions

```typescript
const response = await subscriptionService.getAll(
  1,                   // page
  20,                  // limit
  1,                   // userId (optional)
  'active',            // status (optional)
  'Success',           // paymentStatus (optional)
  'subscription_id',   // sortBy
  'DESC'               // sortOrder
);
```

#### Get User Subscriptions

```typescript
const userSubs = await subscriptionService.getByUserId(1, 1, 20);
```

#### Get Active Subscriptions

```typescript
const activeSubs = await subscriptionService.getActive(1, 100);
```

#### Get by Payment Status

```typescript
const successfulPayments = await subscriptionService.getByPaymentStatus('Success', 1, 50);
```

#### Create Subscription

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

#### Update Subscription

```typescript
const updated = await subscriptionService.update(101, {
  status: 'active',
  payment_status: 'Success',
  timestamp_to: 1713273600
});
```

#### Delete Subscription

```typescript
await subscriptionService.delete(101);
```

## Error Handling

### Try-Catch Pattern

```typescript
try {
  const user = await userService.getById(1);
  // Use user data
} catch (error) {
  if (error instanceof Error) {
    console.error('Error:', error.message);
  }
}
```

### With Loading State

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleFetch = async () => {
  try {
    setLoading(true);
    setError(null);
    const data = await userService.getAll();
    // Use data
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown error');
  } finally {
    setLoading(false);
  }
};
```

## API Response Types

### User Response
```typescript
interface User {
  user_id: number;
  user_name: string;
  email: string;
  mobile?: string;
  age?: number;
  dob?: string;
  plan?: string;
  status: string;
  created_at: string;
  // ... other fields
}

interface UserListResponse {
  success: boolean;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

### Subscription Response
```typescript
interface Subscription {
  subscription_id: number;
  plan_id: number;
  user_id: number;
  txn_id?: string;
  price_amount: number;
  paid_amount: number;
  payment_status: string;
  status: string;
  currency: string;
  // ... other fields
}

interface SubscriptionListResponse {
  success: boolean;
  data: Subscription[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

## Debugging

### Enable Debug Logging

Set in `.env.local`:
```
NEXT_PUBLIC_DEBUG=true
```

### Check API Requests

Open browser DevTools > Network tab to inspect:
- Request headers (verify Authorization header if needed)
- Request/response payloads
- Response status codes

### Common Issues

1. **401 Unauthorized**: Check authentication token in localStorage
2. **404 Not Found**: Verify resource ID exists
3. **500 Server Error**: Check backend API logs
4. **CORS Error**: Verify NEXT_PRIVATE_BACKEND_API URL is correct

## TypeScript Support

All services are fully typed with TypeScript interfaces:

```typescript
import { User, UserListResponse } from '@/services/userService';
import { Subscription, SubscriptionListResponse } from '@/services/subscriptionService';
```

## Next Steps

1. Update your page components to use these services (see INTEGRATION_EXAMPLE.tsx)
2. Add loading states and error handling
3. Implement pagination UI
4. Add filters and search functionality
5. Create forms for creating/editing data

For more details, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
