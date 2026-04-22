\# 🏪 Rental Management App



A full-stack web application to manage rental relationships between \*\*Owners\*\* and \*\*Tenants\*\*.



\## ✨ Core Features



\- 📧 Email OTP based registration \& login (no passwords)

\- 🏪 Owners create Shops with unique codes; Tenants search and request to join

\- 🤝 One active Tenant per Shop at a time (exclusive Relations)

\- 💬 Real-time 1-on-1 chat per Relation

\- 💰 Payment ledger — online (Razorpay) + cash with dual-approval

\- 📈 Rent increase proposal system with tenant accept/reject



\## 🛠️ Tech Stack



| Layer | Technology | Reason |

|---|---|---|

| Frontend | Next.js (React) | SSR, file-based routing, great for dashboards |

| Backend | Node.js + Express | Non-blocking I/O, perfect for real-time features |

| Database | PostgreSQL | Relational integrity for complex relations \& ledgers |

| Real-time | Socket.io | WebSocket chat built on top of Express |

| Payments | Razorpay | India-focused payment gateway |

| Auth | Custom Email OTP | No third-party lock-in, learning-focused |



\## 🗄️ Database ER Diagram



```mermaid

erDiagram

&#x20;   USERS {

&#x20;       uuid id PK

&#x20;       string email

&#x20;       string name

&#x20;       string phone

&#x20;       timestamp created\_at

&#x20;   }



&#x20;   OTP\_CODES {

&#x20;       uuid id PK

&#x20;       uuid user\_id FK

&#x20;       string code

&#x20;       timestamp expires\_at

&#x20;       boolean is\_used

&#x20;   }



&#x20;   SHOPS {

&#x20;       uuid id PK

&#x20;       uuid owner\_id FK

&#x20;       string unique\_code

&#x20;       string name

&#x20;       string address

&#x20;       decimal monthly\_rent

&#x20;       timestamp created\_at

&#x20;   }



&#x20;   RELATIONS {

&#x20;       uuid id PK

&#x20;       uuid shop\_id FK

&#x20;       uuid tenant\_id FK

&#x20;       string status

&#x20;       timestamp started\_at

&#x20;       timestamp ended\_at

&#x20;   }



&#x20;   MESSAGES {

&#x20;       uuid id PK

&#x20;       uuid relation\_id FK

&#x20;       uuid sender\_id FK

&#x20;       text content

&#x20;       boolean is\_read

&#x20;       timestamp created\_at

&#x20;   }



&#x20;   PAYMENTS {

&#x20;       uuid id PK

&#x20;       uuid relation\_id FK

&#x20;       decimal amount

&#x20;       string type

&#x20;       string status

&#x20;       uuid initiated\_by FK

&#x20;       uuid confirmed\_by FK

&#x20;       string gateway\_ref\_id

&#x20;       text note

&#x20;       timestamp payment\_date

&#x20;   }



&#x20;   RENT\_PROPOSALS {

&#x20;       uuid id PK

&#x20;       uuid relation\_id FK

&#x20;       uuid proposed\_by FK

&#x20;       decimal old\_rent

&#x20;       decimal new\_rent

&#x20;       string status

&#x20;       date effective\_date

&#x20;       timestamp created\_at

&#x20;   }



&#x20;   NOTIFICATIONS {

&#x20;       uuid id PK

&#x20;       uuid user\_id FK

&#x20;       string type

&#x20;       boolean is\_read

&#x20;       uuid message\_id FK

&#x20;       uuid payment\_id FK

&#x20;       uuid rent\_proposal\_id FK

&#x20;       timestamp created\_at

&#x20;   }



&#x20;   USERS ||--o{ OTP\_CODES : "receives"

&#x20;   USERS ||--o{ SHOPS : "owns"

&#x20;   SHOPS ||--o{ RELATIONS : "has"

&#x20;   USERS ||--o{ RELATIONS : "tenant in"

&#x20;   RELATIONS ||--o{ MESSAGES : "has"

&#x20;   RELATIONS ||--o{ PAYMENTS : "has"

&#x20;   RELATIONS ||--o{ RENT\_PROPOSALS : "has"

&#x20;   USERS ||--o{ NOTIFICATIONS : "receives"

```



\## 🗓️ Sprint Roadmap



| Sprint | Feature | Status |

|---|---|---|

| Sprint 1 | Project setup + DB migrations + Email OTP Auth | 🔄 In Progress |

| Sprint 2 | Shop creation + Search + Join Request flow | ⏳ Pending |

| Sprint 3 | Real-time chat per Relation | ⏳ Pending |

| Sprint 4 | Payment ledger (cash + online) | ⏳ Pending |

| Sprint 5 | Rent increase proposal flow | ⏳ Pending |

| Sprint 6 | Notification system | ⏳ Pending |

| Sprint 7 | UI polish + Deployment | ⏳ Pending |



\## 🚀 Getting Started (Local Setup)



\### Prerequisites

\- Node.js v18+

\- PostgreSQL 15+



\### Backend

```bash

cd backend

npm install

cp .env.example .env   # fill in your values

npm run dev

```



\### Frontend

```bash

cd frontend

npm install

npm run dev

```

