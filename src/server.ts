import express from "express";
import path from "path";
import { devices, PORT, DeviceConfig } from "./config";

const app = express();

app.use(express.static(path.join(__dirname, "..", "public")));

// Return device list to frontend
app.get("/api/devices", (_req, res) => {
  res.json(devices.map(d => ({ id: d.id, name: d.name, type: d.type })));
});

async function fetchDeviceStatus(device: DeviceConfig) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`http://${device.ip}/status`, {
      signal: controller.signal,
    });
    const data = await response.json();
    return parseDeviceData(device, data);
  } catch {
    return {
      id: device.id,
      name: device.name,
      type: device.type,
      online: false,
      error: "Device unreachable",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function parseDeviceData(device: DeviceConfig, data: any) {
  if (device.type === "em3") {
    const emeters = data.emeters || [];
    const channels = emeters.map((em: any, i: number) => ({
      channel: i + 1,
      power: em.power ?? 0,
      reactive: em.reactive ?? 0,
      voltage: em.voltage ?? 0,
      current: em.current ?? 0,
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
    };
  }

  // Shelly Plug S
  const meter = data.meters?.[0] || {};
  const relay = data.relays?.[0] || {};
  return {
    id: device.id,
    name: device.name,
    type: device.type,
    online: true,
    power: meter.power ?? 0,
    total: meter.total ?? 0,
    relayOn: relay.ison ?? false,
    temperature: data.temperature ?? null,
    overtemperature: data.overtemperature ?? false,
  };
}

// Fetch status for all devices
app.get("/api/status", async (_req, res) => {
  const results = await Promise.all(devices.map(fetchDeviceStatus));
  res.json(results);
});

// Fetch status for a single device
app.get("/api/status/:id", async (req, res) => {
  const device = devices.find(d => d.id === req.params.id);
  if (!device) {
    res.status(404).json({ error: "Device not found" });
    return;
  }
  const result = await fetchDeviceStatus(device);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`ShellyHome dashboard running at http://localhost:${PORT}`);
});
