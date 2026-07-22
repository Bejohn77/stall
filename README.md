# Stall Manager

A modern single-owner stall management and reporting web app built with React, Vite, Tailwind CSS, Express, and MongoDB-compatible storage.

## Features

- Dashboard with sales, profit, inventory, and recent activity
- Product management with search, filtering, low stock, and out of stock badges
- Fast checkout flow with cart management, discounts, and payment methods
- Sales history with invoice tracking and delete actions
- Reports for daily, weekly, monthly, and custom ranges with export options
- Settings for store details and Telegram notifications

## Run locally

### Client

```bash
cd client
npm install
npx vite --host 0.0.0.0 --port 5174
```

### Server

```bash
cd server
npm install
npm run dev
```

The frontend will be available at http://localhost:5174 and the backend at http://localhost:5000.

## MongoDB setup

The backend now uses environment-based MongoDB configuration. Open [server/.env](server/.env) and replace the placeholder values with your own connection details.

Required values:

- `MONGODB_URI`: your MongoDB connection string
- `DB_NAME` (optional): the database name to use if it is not already included in the URI

Examples:

- MongoDB Atlas: `mongodb+srv://username:password@cluster0.example.mongodb.net/stall-manager?retryWrites=true&w=majority`
- MongoDB Community: `mongodb://127.0.0.1:27017/stall-manager`

If the connection cannot be established, the server will exit with a clear error message so you can correct the configuration.
