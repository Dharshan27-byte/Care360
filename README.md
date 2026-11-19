# Care360

Care360 is a personal healthcare information and record-keeping web app. The frontend uses React; the API uses Java 21 and Spring Boot; MySQL stores accounts, appointments, health measurements, notifications and emergency request records.

## Requirements

- Java 21
- Maven 3.9+
- Node.js 20 or newer and npm
- MySQL 8.0, running locally

The local setup expects the MySQL service to be running and a MySQL account that can create the `care360` database. The database is created automatically when the API connects.

## First-time setup

### One-command start

From a PowerShell terminal opened in the Care360 folder, run:

```powershell
.\start-care360.ps1
```

Enter the local MySQL root password when prompted. The script opens the API and frontend in separate PowerShell windows and opens the website when it is ready. It passes the password to the API process through its environment; it does not write the password to a project file.

### Manual start

If you prefer separate setup, copy `backend/.env.example` to `backend/.env` and set `DB_PASSWORD` to your MySQL password. Keep `.env` private; it is ignored by Git. Then start the API:

```powershell
cd C:\Users\ydhar\care360\backend
mvn spring-boot:run
```

In a second terminal, start React:

```powershell
cd C:\Users\ydhar\care360\frontend
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000), choose **Create an account**, and sign in. The API listens on port `5000`.

To create a production build, run `npm run build` inside `frontend`, and `mvn -DskipTests package` inside `backend`.

## Local configuration

`backend/.env` supports these settings:

| Setting                | Default                        | Purpose                                                       |
| ---------------------- | ------------------------------ | ------------------------------------------------------------- |
| `DB_USERNAME`          | `root`                         | MySQL account                                                 |
| `DB_PASSWORD`          | empty                          | MySQL password                                                |
| `DB_URL`               | local MySQL `care360` database | Override only if your MySQL host or port differs              |
| `SERVER_PORT`          | `5000`                         | API port                                                      |
| `CARE360_JWT_SECRET`   | local development value        | Set a private random value (32+ characters) before deployment |
| `JWT_EXPIRATION_HOURS` | `12`                           | Sign-in session lifetime                                      |

The React app uses `http://localhost:5000` by default. To point it elsewhere, set `REACT_APP_API_URL` before starting/building the frontend.

The starter SQL schema is in `backend/database/schema.sql`. In normal local development, Spring Boot creates/updates the tables automatically when it connects.

## Features

- Account registration and sign-in with BCrypt password hashing and signed JWT sessions.
- Profile name and phone number updates.
- Private health-measurement history (weight, height, blood pressure, heart rate and blood sugar).
- Location-aware appointment planning: request current location, browse nearby facilities on an interactive OpenStreetMap, then save a visit reminder with the selected place prefilled.
- Nearby hospital and clinic explorer with 3 km, 7 km and 15 km search radii, text filtering, map markers, listed phone numbers and directions.
- Notification list with mark-as-read and delete actions.
- Appointment confirmations are added to the signed-in account's notification list.
- General symptom guidance with an urgent-symptom warning and emergency call link.
- Emergency shortcut: records the request and location on the signed-in account, then offers the phone's `112` dialer.
- Daily wellbeing note and dashboard counts.

## Demo account

For a local portfolio walkthrough, run Care360 and sign in with this synthetic demo account:

- **Email:** `demo@care360.local`
- **Password:** `Care360Demo!2026`

The account includes three sample health measurements, one upcoming visit-plan reminder and its notification. All profile and health details are fictional. The visit plan is a reminder only; it is not booked with a real clinic. This demo password is public by design and must never be reused for a personal or production account. The account and sample records are created in the local MySQL database; a fresh database needs the demo account to be registered once before signing in.
## API overview

All API routes start with `/api`.

| Method        | Route                                | Sign-in required | Purpose                                         |
| ------------- | ------------------------------------ | ---------------- | ----------------------------------------------- |
| `GET`         | `/health`                            | No               | API health check                                |
| `POST`        | `/auth/register`                     | No               | Create an account                               |
| `POST`        | `/auth/login`                        | No               | Sign in                                         |
| `GET`, `PUT`  | `/profile`                           | Yes              | Read/update profile                             |
| `GET`         | `/dashboard`                         | Yes              | Summary counts and latest measurement           |
| `GET`, `POST` | `/metrics`                           | Yes              | List/add health measurements                    |
| `GET`, `POST` | `/appointments`                      | Yes              | List/book appointment records                   |
| `DELETE`      | `/appointments/{id}`                 | Yes              | Cancel an owned appointment                     |
| `GET`         | `/notifications`                     | Yes              | List account notifications                      |
| `PATCH`       | `/notifications/{id}/read`           | Yes              | Mark an owned notification as read              |
| `DELETE`      | `/notifications/{id}`                | Yes              | Delete an owned notification                    |
| `POST`        | `/emergency`                         | Yes              | Save an emergency request and optional location |
| `GET`         | `/tips/today`                        | No               | Get today's wellbeing note                      |
| `GET`         | `/symptoms`                          | No               | Get the educational symptom list                |
| `POST`        | `/symptoms/assess`                   | Yes              | Get non-diagnostic general guidance             |
| `GET`         | `/hospitals?lat=…&lon=…&radius=7000` | No               | Search OpenStreetMap for nearby facilities      |

## Maps and location

The appointment and nearby-care pages request browser location access when opened. If access is declined or unavailable, the map starts near Coimbatore; use **Use my location** to try again. Location access works on `localhost` and secure HTTPS sites. The interactive map uses Leaflet and OpenStreetMap tiles, with facility listings from OpenStreetMap data.

Choosing a facility fills its name into a personal visit plan. You can optionally add a provider, specialty and notes, and open directions or call a listed number.

## Important limits

- Care360 stores a personal appointment entry; it does not book a real appointment with a doctor or clinic.
- The symptom guide is deterministic educational guidance, not a trained diagnostic model. No training dataset was present in the supplied project.
- Nearby facility information depends on OpenStreetMap coverage and network availability. Call the facility to confirm current services and hours.
- Emergency records are saved for the account and the app can open the device dialer. The app does not dispatch an ambulance or contact emergency services by itself. In India, call `112` directly for an emergency.
- This project is a local/demo application, not a certified medical device or a production-ready clinical records system. Before handling real patient data or deploying publicly, add a privacy/security review, HTTPS, managed secrets, a production database user, backups, audit controls and applicable legal/compliance review.
