import express from "express";
import path from "path";
import { devices, PORT, SHELLY_AUTH_KEY, SHELLY_SERVER_URL, DeviceConfig } from "./config";

const app = express();

app.use(express.static(path.join(__dirname, "..", "public")));

// Return device list to frontend
app.get("/api/devices", (_req, res) => {
  res.json(devices.map(d => ({ id: d.id, name: d.name, type: d.type })));
});

async function fetchAllDeviceStatuses(): Promise<Map<string, any>> {
  const result = new Map<string, any>();
  try {
    const response = await fetch(`${SHELLY_SERVER_URL}/device/all_status`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `auth_key=${encodeURIComponent(SHELLY_AUTH_KEY)}`,
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    if (data.isok && data.data?.devices_status) {
      for (const [cloudId, status] of Object.entries(data.data.devices_status)) {
        result.set(cloudId, status);
      }
    }
  } catch (err) {
    console.error("Failed to fetch from Shelly Cloud:", err);
  }
  return result;
}

function parseDeviceData(device: DeviceConfig, cloudData: any | undefined) {
  if (!cloudData) {
    return {
      id: device.id,
      name: device.name,
      type: device.type,
      online: false,
      error: "No data from cloud",
    };
  }

  if (device.type === "em3") {
    const emeters = cloudData.emeters || [];
    const channels = emeters.map((em: any, i: number) => ({
      channel: i + 1,
      power: em.power ?? 0,
      reactive: em.reactive ?? 0,
      voltage: em.voltage ?? 0,
      current: em.current ?? 0,
      pf: em.pf ?? 0,
      total: em.total ?? 0,
      total_returned: em.total_returned ?? 0,
    }));
    const totalPower = channels.reduce((sum: number, ch: any) => sum + ch.power, 0);
    return {
      id: device.id,
      name: device.name,
      type: device.type,
      online: true,
      totalPower,
      channels,
      updated: cloudData._updated || null,
    };
  }

  // Shelly Plug S
  const meter = cloudData.meters?.[0] || {};
  const relay = cloudData.relays?.[0] || {};
  return {
    id: device.id,
    name: device.name,
    type: device.type,
    online: true,
    power: meter.power ?? 0,
    total: meter.total ?? 0,
    relayOn: relay.ison ?? false,
    temperature: cloudData.temperature ?? cloudData.tmp?.tC ?? null,
    overtemperature: cloudData.overtemperature ?? false,
    updated: cloudData._updated || null,
  };
}

// Fetch status for all configured devices (single cloud API call)
app.get("/api/status", async (_req, res) => {
  const cloudStatuses = await fetchAllDeviceStatuses();
  const results = devices.map(device =>
    parseDeviceData(device, cloudStatuses.get(device.cloudId))
  );
  res.json(results);
});

// Fetch status for a single device
app.get("/api/status/:id", async (req, res) => {
  const device = devices.find(d => d.id === req.params.id);
  if (!device) {
    res.status(404).json({ error: "Device not found" });
    return;
  }
  const cloudStatuses = await fetchAllDeviceStatuses();
  const result = parseDeviceData(device, cloudStatuses.get(device.cloudId));
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`ShellyHome dashboard running at http://localhost:${PORT}`);
  console.log(`Using Shelly Cloud: ${SHELLY_SERVER_URL}`);
  console.log(`Monitoring ${devices.length} devices`);
});
