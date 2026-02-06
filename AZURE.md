# ShellyHome - Azure Deployment Guide

## Architecture

```
Browser  -->  Azure Container Instance (ACI)  -->  Shelly Cloud API  -->  Shelly Devices
               shellyhome.westeurope.              shelly-41-eu.          (your home
               azurecontainer.io:3000              shelly.cloud           network)
```

The container runs in Azure and fetches device data via the **Shelly Cloud API**, so it does not need direct access to your home network.

## Prerequisites

- Azure CLI installed (`az --version`)
- Docker Desktop installed
- Azure account with active subscription
- Shelly Cloud account with devices connected

## Azure Resources Created

| Resource | Name | Purpose |
|---|---|---|
| Resource Group | `shellyhome-rg` | Logical container for all resources |
| Container Registry | `shellyhomecr` | Stores the Docker image |
| Container Instance | `shellyhome` | Runs the dashboard |

## Step-by-Step Deployment

### Step 1 - Login to Azure

```bash
az login --tenant <YOUR_TENANT_ID>
```

### Step 2 - Create resource group

```bash
az group create --name shellyhome-rg --location westeurope
```

### Step 3 - Create Azure Container Registry (ACR)

```bash
az acr create --resource-group shellyhome-rg --name shellyhomecr --sku Basic
az acr update --name shellyhomecr --admin-enabled true
```

### Step 4 - Get ACR credentials

```bash
az acr credential show --name shellyhomecr
```

Save the username and password for Step 6.

### Step 5 - Build and push Docker image

```bash
# Login to ACR
az acr login --name shellyhomecr

# Build locally
docker compose build

# Tag for ACR
docker tag shellyhome-shellyhome:latest shellyhomecr.azurecr.io/shellyhome:latest

# Push to ACR
docker push shellyhomecr.azurecr.io/shellyhome:latest
```

### Step 6 - Deploy to Azure Container Instance

```bash
az container create \
  --resource-group shellyhome-rg \
  --name shellyhome \
  --image shellyhomecr.azurecr.io/shellyhome:latest \
  --cpu 0.5 \
  --memory 0.5 \
  --ports 3000 \
  --ip-address Public \
  --registry-login-server shellyhomecr.azurecr.io \
  --registry-username shellyhomecr \
  --registry-password "<ACR_PASSWORD>" \
  --environment-variables \
    SHELLY_AUTH_KEY="<YOUR_AUTH_KEY>" \
    SHELLY_SERVER_URL="https://shelly-41-eu.shelly.cloud" \
    PORT="3000" \
  --dns-name-label shellyhome
```

### Step 7 - Verify deployment

```bash
# Check container status
az container show --resource-group shellyhome-rg --name shellyhome \
  --query "{fqdn:ipAddress.fqdn, ip:ipAddress.ip, state:instanceView.state}" -o table

# View logs
az container logs --resource-group shellyhome-rg --name shellyhome
```

### Step 8 - Open the dashboard

```
http://shellyhome.westeurope.azurecontainer.io:3000
```

## Management Commands

### View container status

```bash
az container show --resource-group shellyhome-rg --name shellyhome -o table
```

### View logs

```bash
az container logs --resource-group shellyhome-rg --name shellyhome
```

### Follow logs in real-time

```bash
az container logs --resource-group shellyhome-rg --name shellyhome --follow
```

### Restart container

```bash
az container restart --resource-group shellyhome-rg --name shellyhome
```

### Stop container (saves cost)

```bash
az container stop --resource-group shellyhome-rg --name shellyhome
```

### Start container again

```bash
az container start --resource-group shellyhome-rg --name shellyhome
```

### Delete container (keeps ACR image)

```bash
az container delete --resource-group shellyhome-rg --name shellyhome --yes
```

## Updating the Deployment

After code changes:

```bash
# Rebuild locally
docker compose build

# Tag and push to ACR
docker tag shellyhome-shellyhome:latest shellyhomecr.azurecr.io/shellyhome:latest
docker push shellyhomecr.azurecr.io/shellyhome:latest

# Delete old container and redeploy (Step 6)
az container delete --resource-group shellyhome-rg --name shellyhome --yes
az container create ... (same command as Step 6)
```

## Clean Up All Azure Resources

To remove everything and stop all costs:

```bash
az group delete --name shellyhome-rg --yes --no-wait
```

This deletes the resource group and all resources inside it (ACR, ACI).

## Environment Variables Reference

| Variable | Description | Example |
|---|---|---|
| `SHELLY_AUTH_KEY` | Shelly Cloud authorization key | `MTEwNTQ3dWlk...` |
| `SHELLY_SERVER_URL` | Shelly Cloud server endpoint | `https://shelly-41-eu.shelly.cloud` |
| `PORT` | HTTP port for the dashboard | `3000` |

## Cost Estimate

| Resource | Approximate Cost |
|---|---|
| Container Registry (Basic) | ~$5/month |
| Container Instance (0.5 CPU, 0.5 GB) | ~$15-25/month |
| **Total** | **~$20-30/month** |

Stop the container when not in use to reduce costs.
