# ALINCE LOGISTICS &mdash; Production Deployment Guide

This guide details the complete deployment process for **ALINCE LOGISTICS** on a single **DigitalOcean Ubuntu Droplet** (Ubuntu 22.04 LTS / 24.04 LTS).

---

## 📑 Architecture Overview

- **Frontend**: High-performance static Single Page Application (React 18 + Vite + TypeScript).
- **Web Server**: Nginx with HTTP/2, Gzip compression, immutable caching for hashed chunks, and SPA fallback (`try_files $uri /index.html`).
- **Data Layer**: LocalStorage-backed mock services with seed data (each browser maintains its state until the PostgreSQL backend is deployed).
- **Fonts**: Self-hosted via `@fontsource` (zero external CDN calls, offline & GDPR compliant).
- **Bundle**: Route-level code-splitting keeping initial load under ~80 KB gzipped.

---

## 🛠️ Step 1: Initial Droplet Security & Setup

Connect to your fresh Ubuntu droplet as `root`:

```bash
ssh root@your-droplet-ip
```

### 1.1 Create a non-root sudo user

```bash
# Create deployment user
adduser deployer
usermod -aG sudo deployer

# Set up SSH key access for deployer
rsync --archive --chown=deployer:deployer ~/.ssh /home/deployer
```

### 1.2 Configure UFW Firewall

```bash
# Allow SSH, HTTP, and HTTPS
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Check firewall status
ufw status
```

---

## 🌐 Step 2: Install Nginx

Switch to the `deployer` user:

```bash
su - deployer
```

Install Nginx:

```bash
sudo apt update
sudo apt install -y nginx rsync
sudo systemctl enable nginx
sudo systemctl start nginx
```

Create the application directory:

```bash
sudo mkdir -p /var/www/alince-logistics
sudo chown -R deployer:www-data /var/www/alince-logistics
sudo chmod -R 775 /var/www/alince-logistics
```

---

## ⚙️ Step 3: Nginx Production Configuration

Create the Nginx server block configuration:

```bash
sudo nano /etc/nginx/sites-available/alince-logistics
```

Paste the following configuration (replace `your-domain.com` with your domain or droplet IP):

```nginx
# ==============================================================================
# ALINCE LOGISTICS — Nginx Server Block Configuration
# ==============================================================================

server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    root /var/www/alince-logistics;
    index index.html;

    # 1. Gzip Compression for maximum speed on small droplets
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/xml
        image/svg+xml
        font/woff
        font/woff2;

    # 2. Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self';" always;

    # 3. Long-term immutable caching for Vite hashed assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # 4. Never cache index.html (ensures users always get latest releases)
    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        expires off;
    }

    # 5. SPA Route Fallback (React Router BrowserRouter)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # --------------------------------------------------------------------------
    # FUTURE BACKEND: Express REST API Proxy (when backend is deployed)
    # --------------------------------------------------------------------------
    # location /api/ {
    #     proxy_pass http://127.0.0.1:5000/api/;
    #     proxy_http_version 1.1;
    #     proxy_set_header Upgrade $http_upgrade;
    #     proxy_set_header Connection 'upgrade';
    #     proxy_set_header Host $host;
    #     proxy_cache_bypass $http_upgrade;
    #     proxy_set_header X-Real-IP $remote_addr;
    #     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    #     proxy_set_header X-Forwarded-Proto $scheme;
    # }
}
```

Enable the site and verify configuration:

```bash
sudo ln -s /etc/nginx/sites-available/alince-logistics /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 Step 4: Free SSL / HTTPS with Let's Encrypt (Certbot)

Run Certbot to generate and install SSL certificates automatically:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot automatically configures HTTP-to-HTTPS redirect and daily certificate renewal timers.

---

## 🚀 Step 5: Deploying Frontend Code

### Option A: Local Build & Deploy via `deploy.sh`

On your local development machine:

```bash
# Make script executable
chmod +x deploy.sh

# Run deploy script
./deploy.sh deployer@your-droplet-ip /var/www/alince-logistics
```

### Option B: GitHub Actions Continuous Deployment

Add the following GitHub Repository Secrets (`Settings > Secrets and variables > Actions`):
- `DROPLET_HOST`: Your droplet public IP address
- `DROPLET_USER`: `deployer`
- `SSH_PRIVATE_KEY`: Your SSH private key authorized on the droplet

Every push to `main` will automatically build, execute all unit & component tests, and rsync `dist/` to the droplet.

---

## ⚠️ Important Note Regarding Mock Data

> [!NOTE]
> The frontend defaults to client-side mock data (`VITE_USE_MOCK=true`). **Each browser and device keeps its own dataset** in localStorage. Clicking **"Reset Demo Data"** restores the initial seed state on that device.

---

## 🔮 Later: Adding the Express + PostgreSQL Backend

When you are ready to deploy the real backend:

1. **Install PostgreSQL on Droplet**:
   ```bash
   sudo apt install -y postgresql postgresql-contrib
   sudo -u postgres psql
   CREATE DATABASE alince_erp;
   CREATE USER alince_user WITH ENCRYPTED PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE alince_erp TO alince_user;
   \q
   ```
   *Note: PostgreSQL is bound strictly to `127.0.0.1` by default for maximum security.*

2. **Run Express Backend with PM2**:
   ```bash
   npm install -g pm2
   cd /var/www/alince-api
   npm install --production
   pm2 start server.js --name alince-api
   pm2 startup
   pm2 save
   ```

3. **Enable Nginx API Proxy**:
   Uncomment the `location /api/` block in `/etc/nginx/sites-available/alince-logistics` and reload Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```
4. **Switch Frontend to the Backend (when ready)**:
   Set `VITE_USE_MOCK=false` in `.env.production` and re-run `./deploy.sh`. Keep it set to `true` to continue using mock data.

   Before deploying a backend build that supports Unfinal shipments, apply
   `backend/sql/2026_10_15_unfinal_shipment_status.sql` to PostgreSQL. It adds
   the `Unfinal` value to the shipment-status enum; the Prisma schema and generated
   client must be deployed with the backend.
