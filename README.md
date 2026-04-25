# 🏪 Rental Management App

A full-stack web application to manage rental relationships between **Owners** and **Tenants**.

## ✨ Core Features

- 📧 Email OTP based registration & login (no passwords)
- 🏪 Owners create Shops with unique codes; Tenants search and request to join
- 🤝 One active Tenant per Shop at a time (exclusive Relations)
- 💬 Real-time 1-on-1 chat per Relation
- 💰 Payment ledger — online (Razorpay) + cash with dual-approval
- 📈 Rent increase proposal system with tenant accept/reject

## 🛠️ Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | Next.js (React) | SSR, file-based routing, great for dashboards |
| Backend | Node.js + Express | Non-blocking I/O, perfect for real-time features |
| Database | PostgreSQL | Relational integrity for complex relations and ledgers |
| Real-time | Socket.io | WebSocket chat built on top of Express |
| Payments | Razorpay | India-focused payment gateway |
| Auth | Custom Email OTP | No third-party lock-in, learning-focused |

## 🗄️ Database ER Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        string email
        string name
        string phone
        timestamp created_at
    }
    OTP_CODES {
        uuid id PK
        uuid user_id FK
        string code
        timestamp expires_at
        boolean is_used
    }
    SHOPS {
        uuid id PK
        uuid owner_id FK
        string unique_code
        string name
        string address
        decimal monthly_rent
        timestamp created_at
    }
    RELATIONS {
        uuid id PK
        uuid shop_id FK
        uuid tenant_id FK
        string status
        timestamp started_at
        timestamp ended_at
    }
    MESSAGES {
        uuid id PK
        uuid relation_id FK
        uuid sender_id FK
        text content
        boolean is_read
        timestamp created_at
    }
    PAYMENTS {
        uuid id PK
        uuid relation_id FK
        decimal amount
        string type
        string status
        uuid initiated_by FK
        uuid confirmed_by FK
        string gateway_ref_id
        text note
        timestamp payment_date
    }
    RENT_PROPOSALS {
        uuid id PK
        uuid relation_id FK
        uuid proposed_by FK
        decimal old_rent
        decimal new_rent
        string status
        date effective_date
        timestamp created_at
    }
    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        string type
        boolean is_read
        uuid message_id FK
        uuid payment_id FK
        uuid rent_proposal_id FK
        timestamp created_at
    }
    USERS ||--o{ OTP_CODES : "receives"
    USERS ||--o{ SHOPS : "owns"
    SHOPS ||--o{ RELATIONS : "has"
    USERS ||--o{ RELATIONS : "tenant in"
    RELATIONS ||--o{ MESSAGES : "has"
    RELATIONS ||--o{ PAYMENTS : "has"
    RELATIONS ||--o{ RENT_PROPOSALS : "has"
    USERS ||--o{ NOTIFICATIONS : "receives"
```

## 🗓️ Sprint Roadmap

| Sprint | Feature | Status |
|---|---|---|
| Sprint 1 | Project setup + DB migrations + Email OTP Auth | ✅ Complete|
| Sprint 2 | Shop creation + Search + Join Request flow | ✅ Complete|
| Sprint 3 | Real-time chat per Relation | ⏳ Pending |
| Sprint 4 | Payment ledger (cash + online) | ⏳ Pending |
| Sprint 5 | Rent increase proposal flow | ⏳ Pending |
| Sprint 6 | Notification system | ⏳ Pending |
| Sprint 7 | UI polish + Deployment | ⏳ Pending |

## 🚀 Getting Started (Local Setup)

### Prerequisites
- Node.js v18+
- PostgreSQL 15+

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
