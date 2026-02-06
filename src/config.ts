export interface DeviceConfig {
  id: string;
  name: string;
  type: "em3" | "plugs";
  ip: string;
}

export const devices: DeviceConfig[] = [
  { id: "em3-1", name: "Shelly EM3 #1", type: "em3", ip: "192.168.1.111" },
  { id: "em3-2", name: "Shelly EM3 #2", type: "em3", ip: "192.168.1.197" },
  { id: "plugs-1", name: "Shelly Plug S #1", type: "plugs", ip: "192.168.1.166" },
  { id: "plugs-2", name: "Shelly Plug S #2", type: "plugs", ip: "192.168.1.140" },
  { id: "plugs-3", name: "Shelly Plug S #3", type: "plugs", ip: "192.168.1.153" },
];

export const PORT = 3000;
