export interface DeviceConfig {
  id: string;
  cloudId: string;
  name: string;
  type: "em3" | "plugs";
}

export const devices: DeviceConfig[] = [
  { id: "em3-1", cloudId: "34945474af4e", name: "Shelly EM3 #1", type: "em3" },
  { id: "em3-2", cloudId: "3494546ed92c", name: "Shelly EM3 #2", type: "em3" },
  { id: "plugs-1", cloudId: "8803fc", name: "Shelly Plug S #1", type: "plugs" },
  { id: "plugs-2", cloudId: "7c87ceba3a69", name: "Shelly Plug S #2", type: "plugs" },
  { id: "plugs-3", cloudId: "7c87ceb4dae4", name: "Shelly Plug S #3", type: "plugs" },
];

export const SHELLY_AUTH_KEY = process.env.SHELLY_AUTH_KEY || "";
export const SHELLY_SERVER_URL = process.env.SHELLY_SERVER_URL || "https://shelly-41-eu.shelly.cloud";
export const PORT = parseInt(process.env.PORT || "3000", 10);
