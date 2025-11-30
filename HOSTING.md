# Hosting Guide for Node.js + SQLite E-commerce App

Since this application uses **SQLite** (a file-based database), you need a hosting provider that supports **persistent storage** (disk).

## Recommended Options

### 1. Render (Easiest)
- **Type**: PaaS (Platform as a Service)
- **Pros**: Free tier available, easy setup.
- **Cons**: Free tier spins down (slow start), SQLite data is lost on restart unless you use a **Disk** (paid feature).
- **How to**:
    1. Push code to GitHub.
    2. Connect repo to Render.
    3. Add a "Disk" and mount it to `/database`.

### 2. Fly.io
- **Type**: PaaS
- **Pros**: Good for SQLite (supports Volumes), runs close to users.
- **Cons**: CLI-based setup.
- **How to**:
    1. Install `flyctl`.
    2. Run `fly launch`.
    3. Create a volume: `fly volumes create data_storage`.
    4. Mount volume in `fly.toml`.

### 3. VPS (DigitalOcean, Linode, Hetzner)
- **Type**: Virtual Private Server
- **Pros**: Full control, cheapest for persistent data ($4-5/mo), data is safe.
- **Cons**: Manual setup (SSH, installing Node.js, setting up Nginx/PM2).
- **How to**:
    1. Buy a Droplet/VPS.
    2. SSH in.
    3. Install Node.js & NPM.
    4. Clone repo.
    5. Run with `pm2 start server.js`.

## NOT Recommended for SQLite
- **Vercel / Netlify**: These are serverless platforms. They do not support persistent files. Your database would be reset every time the function sleeps. (Unless you use an external DB like Turso or Neon).
- **Heroku (Free/Basic)**: Ephemeral filesystem. Data is lost on restart.

## Deployment Steps (General)
1. Ensure `package.json` has a start script: `"start": "node server.js"`.
2. Set environment variables (e.g., `PORT`).
3. Build/Run.
