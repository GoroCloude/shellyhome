const REFRESH_INTERVAL = 5000;

function renderEM3Card(device) {
  if (!device.online) {
    return `<div class="device-card offline">
      <div class="device-header">
        <span class="device-name">${device.name}</span>
        <span class="device-badge badge-em3">EM3</span>
      </div>
      <div class="error-msg">Device offline</div>
    </div>`;
  }

  const channelsHtml = device.channels.map(ch => `
    <div class="channel">
      <div class="ch-label">Channel ${ch.channel}</div>
      <div class="ch-power">${ch.power.toFixed(1)} <span class="unit">W</span></div>
      <div class="ch-detail">${ch.voltage.toFixed(1)} V / ${ch.current.toFixed(2)} A</div>
      <div class="ch-detail">${(ch.total / 1000).toFixed(2)} kWh</div>
    </div>
  `).join("");

  return `<div class="device-card">
    <div class="device-header">
      <span class="device-name">${device.name}</span>
      <span class="device-badge badge-em3">EM3</span>
    </div>
    <div class="device-power">${device.totalPower.toFixed(1)} <span class="unit">W</span></div>
    <div class="channels">${channelsHtml}</div>
  </div>`;
}

function renderPlugSCard(device) {
  if (!device.online) {
    return `<div class="device-card offline">
      <div class="device-header">
        <span class="device-name">${device.name}</span>
        <span class="device-badge badge-plugs">Plug S</span>
      </div>
      <div class="error-msg">Device offline</div>
    </div>`;
  }

  const relayClass = device.relayOn ? "relay-on" : "relay-off";
  const relayText = device.relayOn ? "ON" : "OFF";
  const tempText = device.temperature != null ? `${device.temperature} °C` : "N/A";

  return `<div class="device-card">
    <div class="device-header">
      <span class="device-name">${device.name}</span>
      <span class="device-badge badge-plugs">Plug S</span>
    </div>
    <div class="device-power">${device.power.toFixed(1)} <span class="unit">W</span></div>
    <div class="plug-details">
      <div class="detail-item">
        <div class="dl">Relay</div>
        <div class="dv ${relayClass}">${relayText}</div>
      </div>
      <div class="detail-item">
        <div class="dl">Temperature</div>
        <div class="dv">${tempText}</div>
      </div>
      <div class="detail-item">
        <div class="dl">Total Energy</div>
        <div class="dv">${(device.total / 1000).toFixed(2)} kWh</div>
      </div>
      <div class="detail-item">
        <div class="dl">Overtemp</div>
        <div class="dv">${device.overtemperature ? "YES" : "No"}</div>
      </div>
    </div>
  </div>`;
}

function renderDashboard(devices) {
  const em3Devices = devices.filter(d => d.type === "em3");
  const plugDevices = devices.filter(d => d.type === "plugs");

  // Calculate total power
  let totalPower = 0;
  for (const d of devices) {
    if (!d.online) continue;
    if (d.type === "em3") totalPower += d.totalPower || 0;
    if (d.type === "plugs") totalPower += d.power || 0;
  }

  document.getElementById("totalPower").innerHTML =
    `${totalPower.toFixed(1)} <span class="unit">W</span>`;

  document.getElementById("em3Grid").innerHTML =
    em3Devices.map(renderEM3Card).join("");

  document.getElementById("plugsGrid").innerHTML =
    plugDevices.map(renderPlugSCard).join("");
}

async function fetchStatus() {
  try {
    const res = await fetch("/api/status");
    const devices = await res.json();
    renderDashboard(devices);

    document.getElementById("statusDot").className = "status-dot live";
    document.getElementById("statusText").textContent = "Live";
    document.getElementById("lastUpdate").textContent =
      "Updated: " + new Date().toLocaleTimeString();
  } catch {
    document.getElementById("statusDot").className = "status-dot off";
    document.getElementById("statusText").textContent = "Connection lost";
  }
}

// Initial fetch and start interval
fetchStatus();
setInterval(fetchStatus, REFRESH_INTERVAL);
