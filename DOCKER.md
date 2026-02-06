# ShellyHome - Docker Deployment Guide

## Prerequisites

- Docker Desktop installed and running on Windows
- Shelly devices accessible on the local network

## Project Structure

```
shellyhome/
├── Dockerfile            # Multi-stage build (build + production)
├── docker-compose.yml    # Container orchestration
├── .dockerignore         # Files excluded from Docker build
├── src/
│   ├── config.ts         # Device IPs and configuration
│   └── server.ts         # Express backend server
├── public/
│   ├── index.html        # Dashboard UI
│   └── app.js            # Frontend auto-refresh logic
├── package.json
└── tsconfig.json
```

## Step-by-Step: Build & Deploy

### Step 1 - Clone the repository

```bash
git clone git@github.com:GoroCloude/shellyhome.git
cd shellyhome
```

### Step 2 - Configure device IPs

Edit `src/config.ts` and set the IP addresses of your Shelly devices:

```typescript
export const devices: DeviceConfig[] = [
  { id: "em3-1", name: "Shelly EM3 #1", type: "em3", ip: "192.168.1.111" },
  { id: "em3-2", name: "Shelly EM3 #2", type: "em3", ip: "192.168.1.197" },
  { id: "plugs-1", name: "Shelly Plug S #1", type: "plugs", ip: "192.168.1.166" },
  { id: "plugs-2", name: "Shelly Plug S #2", type: "plugs", ip: "192.168.1.140" },
  { id: "plugs-3", name: "Shelly Plug S #3", type: "plugs", ip: "192.168.1.153" },
];
```

### Step 3 - Build the Docker image

```bash
docker compose build
```

This runs a multi-stage build:
1. **Build stage**: Installs all dependencies, compiles TypeScript to JavaScript
2. **Production stage**: Copies only compiled JS and production dependencies (smaller image)

### Step 4 - Start the container

```bash
docker compose up -d
```

- `-d` runs the container in detached (background) mode
- The container is named `shellyhome`
- Port `3000` is mapped from container to host
- Container restarts automatically unless manually stopped

### Step 5 - Open the dashboard

Open your browser and navigate to:

```
http://localhost:3000
```

The dashboard auto-refreshes every 5 seconds.

## Container Management

### View container status

```bash
docker ps --filter name=shellyhome
```

### View logs

```bash
docker logs shellyhome
```

Follow logs in real-time:

```bash
docker logs -f shellyhome
```

### Stop the container

```bash
docker compose down
```

### Restart the container

```bash
docker compose restart
```

### Rebuild after code changes

```bash
docker compose up -d --build
```

This rebuilds the image and recreates the container with the updated code.

## How It Works

### Dockerfile (Multi-Stage Build)

| Stage       | Purpose                                          |
|-------------|--------------------------------------------------|
| `build`     | Install all deps, compile TypeScript with `tsc`  |
| `production`| Copy compiled JS + production deps only          |

This keeps the final image small by excluding TypeScript, dev dependencies, and source files.

### docker-compose.yml

| Setting       | Value                | Purpose                              |
|---------------|----------------------|--------------------------------------|
| `ports`       | `3000:3000`          | Map container port to host           |
| `extra_hosts` | `host.docker.internal` | Allow container to reach host network |
| `restart`     | `unless-stopped`     | Auto-restart on crash or reboot      |

### Network Access

The container reaches Shelly devices on your LAN via Docker Desktop's built-in network routing. The Express server fetches data from each device's local HTTP API (`http://<device-ip>/status`) and serves it to the browser dashboard.

## Troubleshooting

| Problem                    | Solution                                                  |
|----------------------------|-----------------------------------------------------------|
| Container can't reach devices | Verify devices are online: `ping 192.168.1.111`        |
| Port 3000 already in use  | Stop other services on port 3000 or change port in `docker-compose.yml` and `src/config.ts` |
| Dashboard shows "offline"  | Check container logs: `docker logs shellyhome`           |
| Changes not reflected      | Rebuild: `docker compose up -d --build`                  |
