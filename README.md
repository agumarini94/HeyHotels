# HeyHotels

A full-stack auction platform that connects companies with hotels. Companies post accommodation requests, hotels submit competitive bids, and the best deal wins.

## How It Works

**For Companies**
1. Post an accommodation request with destination, dates, rooms, and amenities
2. Receive bids from hotels in that city
3. Review bids (with photos and pricing) and accept the best one
4. Contact the winning hotel directly via WhatsApp

**For Hotels**
1. Browse open requests filtered by your city and category
2. Submit a bid with your price, a message, and up to 3 room photos
3. Track your bids and see how your price compares to the market
4. View your won deals history

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TailwindCSS, React Router |
| Maps | Leaflet + react-leaflet with marker clustering |
| HTTP Client | Axios with JWT auto-injection |
| Backend | Express.js 5 (ES Modules) |
| Database | PostgreSQL via Neon serverless |
| Auth | JWT (24h expiry) + bcrypt password hashing |
| Deployment | Render (backend) · Vercel (frontend) |

## Project Structure

```
HeyHotels/
├── backend/
│   ├── server.js               # Express app entry (port 5005)
│   ├── db.js                   # Neon PostgreSQL connection
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT verification
│   └── routes/
│       ├── auth.js             # Register, login, profile
│       ├── auctions.js         # Auction CRUD & bid acceptance
│       └── bids.js             # Bid submission & withdrawal
└── frontend/
    └── src/
        ├── api/axios.js        # HTTP client with token interceptor
        ├── pages/              # Login, Register, Dashboards, History, Profile
        └── components/         # Navbar, AuctionsMap, CityPredictor, Profile
```

## API Endpoints

### Auth — `/api/auth`
| Method | Route | Description |
|---|---|---|
| POST | `/register` | Register as company or hotel |
| POST | `/login` | Login and receive JWT |
| GET | `/profile` | Get current user profile |
| PUT | `/update-profile` | Update city/location |

### Auctions — `/api/auctions`
| Method | Route | Access |
|---|---|---|
| POST | `/create` | Company only |
| GET | `/list` | All (filtered by role & city) |
| GET | `/:id/bids` | All |
| PATCH | `/accept-bid` | Company only |
| DELETE | `/auction/:id` | Company only |
| GET | `/history-company` | Company only |
| GET | `/history-hotel` | Hotel only |
| GET | `/my-sent-bids` | Hotel only |

### Bids — `/api/bids`
| Method | Route | Access |
|---|---|---|
| POST | `/place` | Hotel only |
| GET | `/my-bids` | Hotel only |
| DELETE | `/bid/:id` | Hotel only |

## Getting Started

### Prerequisites
- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database

### Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@host/dbname
JWT_SECRET=your_secret_key
```

```bash
npm start   # http://localhost:5005
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5174
```

For production:

```bash
npm run build
```

## Database Schema

```sql
-- Users (companies and hotels)
users (id, name, email, password, role, phone, city)

-- Accommodation requests posted by companies
requests (id, company_id, destination, rooms, check_in, check_out,
          description, required_amenities, category, status, winner_id, created_at)

-- Bids submitted by hotels
bids (id, auction_id, hotel_id, price, message, img1, img2, img3, created_at)
```

## Features

- Role-based access control (company vs hotel)
- City-based auction filtering for hotels
- Interactive map with Leaflet clustering and category icons
- Live market price comparison while bidding
- Image uploads (up to 3 per bid)
- WhatsApp direct contact link on deal completion
- Full deal history for both roles

## Deployed API

The backend is live at: `https://heyhotels.onrender.com/api`
