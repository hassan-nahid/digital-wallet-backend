# Digital Wallet API

A role-based digital wallet management system inspired by platforms like **Bkash** and **Nagad**. Built using **Express.js**, **TypeScript**, and **MongoDB (Mongoose)**.

---
## 🌐 Live Link

🔗 [backend link](https://digital-wallet-backend-one.vercel.app)



## 🚀 Features

- 🔐 JWT Authentication
- 👥 Role-Based Access (Admin, User, Agent)
- 💰 Secure Wallet Operations:
  - Add Money (User only)
  - Withdraw Money (Admin only)
  - Send Money (User → User)
  - Cash In (Agent → User)(Admin → Agent)
  - Cash Out (User → Agent)(Agent → Admin)
- 🧾 Transaction Logging
- 🧠 Business Logic:
  - Service fee, commission, and profit sharing
  - Auto updates wallet balances
- ⚠️ Wallet Blocking/Unblocking
- 📊 Admin Profit & Agent Commission Tracking

---

## 🧱 Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB, Mongoose
- **Authentication**: JWT,cookie-parser
- **Security**: Bcrypt, CORS
- **Validation**: Zod
- **Error Handling**: Global error handler + custom AppError

---

## 🔧 Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/hassan-nahid/digital-wallet-backend.git
```
### 2. Install Dependencies
```bash
npm install 

```
### 3. Create .env file
```bash
# mongodb
PORT=5000
DB_URL=mongodb_Url
NODE_ENV=development | production

# JWT
JWT_ACCESS_SECRET=jwt_secret
JWT_ACCESS_EXPIRES=1d
JWT_REFRESH_SECRET=jwt_refresh_secret
JWT_REFRESH_EXPIRES=30d

# BCRYPT
BCRYPT_SALT_ROUND=salt_rount in number

# Express Session
EXPRESS_SESSION_SECRET=express_session_secret


# frontend url
FRONTEND_URL=your_fronted_url

```
### 2. Install Dependencies
```bash
npm run dev 

```
For Production

```bash
npm run build
npm start

```

## 📦 API Endpoints

### 🔐 Auth (Public & Protected)

| Method | Endpoint              | Access   | Description                       |
|--------|-----------------------|----------|-----------------------------------|
| POST   | /api/v1/auth/login    | Public   | Log in with email and password    |
| POST   | /api/v1/auth/logout   | User     | Log out the current session       |
| POST   | /api/v1/auth/refresh-token | Public | Get a new access token via refresh token |
| POST   | /api/v1/auth/change-password | Authenticated | Change current user's password    |

---

### 👥 Users

| Method | Endpoint                       | Access        | Description                      |
|--------|--------------------------------|---------------|----------------------------------|
| POST   | /api/v1/users/register         | Public        | Register a new user              |
| GET    | /api/v1/users/all-users        | Admin         | Get all users (queryable)        |
| GET    | /api/v1/users/me               | All Roles     | Get own user profile             |
| GET    | /api/v1/users/:id              | Admin         | Get single user by ID            |
| PATCH  | /api/v1/users/:id              | All Roles     | Update user info (self/admin)    |
| PATCH  | /api/v1/users/make-agent/:userId | Admin       | Promote a user to Agent          |
| PATCH  | /api/v1/users/agent-suspense/:userId | Admin  | Suspend an agent                 |

---

### 💰 Wallet

| Method | Endpoint                        | Access        | Description                      |
|--------|----------------------------------|---------------|----------------------------------|
| GET    | /api/v1/wallet/me               | All Roles     | Get your wallet details          |
| GET    | /api/v1/wallet/                 | Admin         | Get all wallets (queryable)      |
| PATCH  | /api/v1/wallet/block-wallet/:id | Admin         | Block a wallet                   |
| PATCH  | /api/v1/wallet/unblock-wallet/:id | Admin       | Unblock a wallet                 |

---

### 💸 Transactions

| Method | Endpoint                         | Access        | Description                         |
|--------|----------------------------------|---------------|-------------------------------------|
| POST   | /api/v1/transactions/add-money   | User          | Add money to own wallet             |
| POST   | /api/v1/transactions/send-money  | User          | Send money to another user          |
| POST   | /api/v1/transactions/cash-in     | Agent/Admin   | Deposit cash into user's wallet     |
| POST   | /api/v1/transactions/cash-out    | User/Agent    | Withdraw cash via agent             |
| POST   | /api/v1/transactions/admin-withdraw | Admin     | Withdraw money from any wallet      |
| GET    | /api/v1/transactions/my-transactions | All Roles | Get your own transaction history    |
| GET    | /api/v1/transactions/all-transactions | Admin   | Get all transaction records         |

---

# 🔍 Search, Filter, and Sort API Endpoints

## 📊 Advanced Querying: Search, Filter & Sort For Admin

## ✅ Get All Wallets

### Search wallets by user name
GET /api/wallet?search=john

### Filter wallets by role and blocked status
GET /api/wallet?role=AGENT&isBlocked=false

### Filter wallets by balance range
GET /api/wallet?minBalance=100&maxBalance=5000

### Sort wallets by balance
GET /api/wallet?sortBy=balance&sortOrder=asc

### Combine search & sort
GET /api/wallet?search=john&sortBy=name&sortOrder=asc

## ✅ Get All Users

### Search users by name or email
GET /api/v1/user/all-users?search=john

### Filter users by role, status, and approval
GET /api/v1/user/all-users?role=AGENT&isActive=ACTIVE&isAgentApproved=true

### Sort users by name
GET /api/v1/user/all-users?sortBy=name&sortOrder=asc

## ✅ Get All Transactions
### Search transactions by user name or transaction ID
GET /api/transactions/all-transactions?search=john

### Filter transactions by type and status
GET /api/transactions/all-transactions?transactionType=send_money&status=approved

### Filter transactions by roles
GET /api/transactions/all-transactions?senderRole=USER&receiverRole=AGENT

### Filter transactions by amount range
GET /api/transactions/all-transactions?minAmount=100&maxAmount=5000

### Filter transactions by date range
GET /api/transactions/all-transactions?startDate=2024-01-01&endDate=2024-12-31

### Sort transactions by amount
GET /api/transactions/all-transactions?sortBy=amount&sortOrder=asc

### Combine search & filter for today's cash-in
GET /api/transactions/all-transactions?search=john&transactionType=CASH_IN&startDate=2024-07-30

### Filter admin withdrawals sorted by date
GET /api/transactions/all-transactions?transactionType=ADMIN_WITHDRAW&sortBy=createdAt&sortOrder=desc

---

----
----
---
© 2025 Hassan Nahid. All rights reserved.

This project and its contents are the intellectual property of Hassan Nahid. Unauthorized use, reproduction, or distribution is prohibited.
