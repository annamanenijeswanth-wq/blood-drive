# Community Blood Donation Campaign (MERN)

## Run
1. Start MongoDB locally (or use Atlas and set MONGO_URI).
2. Backend: `cd server && cp .env.example .env && npm install && npm run dev` (port 5000)
3. (Optional) Load demo data: `cd server && npm run seed` (creates admin@blooddrive.com and donor1..donor6@blooddrive.com, all with password `password123`; it clears existing data first)
4. Frontend: `cd client && npm install && npm run dev` (open http://localhost:5173)

## Roles
- **Donor** (default): sign up, browse campaigns, register to donate, view/cancel own registrations.
- **Admin**: sign up with the organizer code from `.env` (ADMIN_CODE). Full CRUD on campaigns, view/filter all donors, mark donations, delete records.

## REST API
| Method | Endpoint | Access |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | Public |
| GET | /api/campaigns?location=&status= | Public |
| POST/PUT/DELETE | /api/campaigns[/:id] | Admin |
| GET | /api/campaigns/:id/priority?slots=10 | Admin (greedy donor ranking) |
| GET | /api/donors?campaign=&bloodGroup= | Logged in (donors see own) |
| POST | /api/donors | Logged in |
| PUT | /api/donors/:id | Owner (cancel) / Admin |
| DELETE | /api/donors/:id | Admin |

## Data model
User(name,email,password,role) · Campaign(title,location,date,bloodGroupsNeeded,capacity,status) · Donor(user,campaign,name,phone,bloodGroup,status)

## Algorithm paradigm
Greedy: `server/greedy.js` ranks registered donors, picking needed blood groups first, then earliest registration. Registration itself is first-come-first-served until capacity.

## RaktaSetu-style features
- **Availability (home page):** units per blood group across all centers; tap a group or search a city to find centers with stock. Admins add/edit/delete centers and stock.
- **Emergency requests:** logged-in users post requests (blood group, units, hospital, city, urgency); anyone can browse open requests, most urgent first.
- API: `GET /api/centers/availability`, `GET|POST|PUT|DELETE /api/centers`, `GET|POST|PUT|DELETE /api/requests`
