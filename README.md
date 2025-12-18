# Zenith : Deployment as a Service

A scalable, distributed system that mimics the core functionality of Vercel. This platform allows users to deploy web projects via GitHub URLs, automatically builds them in a containerized environment, and serves them via custom subdomains.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Screen Recording](#screen-recording)
- [Environment Variables](#environment-variables)
- [Going Live](#going-live)

## Tech Stack

- **Language:** TypeScript (Node.js)
- **Framework:** Express.js
- **Orchestration:** Docker & Docker Compose
- **Architecture:** Microservices (Monorepo)
- **Queue System:** Redis (Upstash / Local)
- **Object Storage:** AWS S3 (for source code and build artifacts)
- **Deployment Target:** AWS EC2 / DigitalOcean Droplet
- **Tools:** Simple-Git, AWS-SDK


## Screen Recording


https://drive.google.com/file/d/1k1Eu60vR_z3x7omq-2VDyS0RY70C56P0/view?usp=sharing

---

## Environment Variables

```
# AWS Credentials

AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# Redis Connection

UPSTASH_REDIS_REST_URL=
```

---

## Going Live
We use a VPS approach to handle resource-heavy build processes that often timeout on serverless platforms.

### The Server Setup
**AWS:** Launch an EC2 Instance (t2.micro is free tier, but t3.small is better for building). Use Ubuntu.
SSH into it: 
```
ssh ubuntu@<your-server-ip>
```
**Install Docker:** Run the commands to install Docker and Docker Compose on Ubuntu.

### Critical Step: Add Swap Memory
**Why?** `npm install` consumes lots of RAM. A cheap server has 512MB or 1GB RAM. NPM will crash it.
**Fix:** Create a "Swap File" (fake RAM on the hard drive):
```
sudo fallocate -l 1G /swapfile &&
sudo chmod 600 /swapfile &&
sudo mkswap /swapfile &&
sudo swapon /swapfile
```

### Deployment Steps
1. **Clone your code** on the server:
```
   git clone <your-repo-url>
```
3. **Secrets:** Create a `.env` file on the server with your real AWS keys and Redis URL.
4. **Run:**
```
   docker-compose up -d
```

### The DNS Magic (Wildcards)
This is the final piece. You need `http://project-id.yourdomain.com` to work.

1. Go to your domain provider
2. **A Record (`@`):** Point `yourdomain.com` to your VPS IP Address
3. **A Record (`*`):** Create a wildcard record `*` pointing to the same VPS IP Address

### The Reverse Proxy (Nginx)
Right now, your user has to type `http://domain.com:3000`. That's ugly. We want port 80.
**Nginx routes:**

- `api.yourdomain.com` → Forward to Local Port 3000 (Upload Service)
- `*.yourdomain.com` → Forward to Local Port 3001 (Request Handler)

**Update Docker Compose:** Add an Nginx container or install Nginx directly on the host.
**Config:** Configure `nginx.conf` to proxy pass `server_name *.yourdomain.com` to `http://localhost:3001`.

**Simpler Alternative for MVP:** Change your `docker-compose.yml` so the Request Handler binds to port 80 directly (`"80:3001"`). Then point your wildcard DNS to the server. _(Note: You can only have one service on port 80, so your Upload API might need to move to `api.yourdomain.com` or stay on port 3000)_.

---
