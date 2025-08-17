// DOM元素
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const dataContainer = document.getElementById('dataContainer');
const lastActive = document.getElementById('lastActive');
const connectionStatus = document.getElementById('connectionStatus');
const packetCount = document.getElementById('packetCount');
const packetRate = document.getElementById('packetRate');
const deviceId = document.getElementById('deviceId');
const uptime = document.getElementById('uptime');
const currentTime = document.getElementById('currentTime');

// 状态变量
let packetCounter = 0;
let startTime = Date.now();
let lastSecondPackets = 0;
let lastSecondTime = Date.now();

// 初始化WebSocket连接
const ws = new WebSocket('ws://localhost:8765');

// 更新当前时间
function updateClock() {
  const now = new Date();
  currentTime.textContent = now.toLocaleTimeString();
}

// 更新运行时间
function updateUptime() {
  const seconds = Math.floor((Date.now() - startTime) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  uptime.textContent =
    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 更新状态显示
function updateStatus(isConnected, message) {
  statusIndicator.className = isConnected ?
    'status-indicator connected' : 'status-indicator';
  statusText.textContent = message;
  connectionStatus.textContent = isConnected ? '已连接' : '未连接';
}

// 更新最后活跃时间
function updateLastActive(timeString) {
  lastActive.textContent = new Date(timeString).toLocaleTimeString();
}

// 更新数据包计数
function updatePacketCount() {
  packetCount.textContent = packetCounter;
}

// 更新数据包速率
function updatePacketRate() {
  const now = Date.now();
  const elapsed = (now - lastSecondTime) / 1000;

  if (elapsed >= 1) {
    const rate = (packetCounter - lastSecondPackets) / elapsed;
    packetRate.textContent = `${rate.toFixed(1)}/s`;

    lastSecondPackets = packetCounter;
    lastSecondTime = now;
  }
}

// WebSocket事件处理
ws.onopen = () => {
  updateStatus(true, '已连接到数据服务');
  startTime = Date.now();
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  packetCounter++;

  // 更新设备信息
  deviceId.textContent = data.device_id || 'DEVICE_001';
  updateLastActive(data.timestamp);
  updatePacketCount();

  // 创建新的数据项
  const dataItem = document.createElement('div');
  dataItem.className = 'data-item';

  const dataContent = document.createElement('div');
  dataContent.className = 'data-content';
  dataContent.textContent = data.raw;

  const dataTime = document.createElement('div');
  dataTime.className = 'data-time';
  dataTime.textContent = new Date(data.timestamp).toLocaleTimeString();

  dataItem.appendChild(dataContent);
  dataItem.appendChild(dataTime);

  // 添加到数据容器顶部
  dataContainer.insertBefore(dataItem, dataContainer.firstChild);

  // 保留最近的50条消息
  if (dataContainer.children.length > 50) {
    dataContainer.removeChild(dataContainer.lastChild);
  }
};

ws.onerror = (error) => {
  console.error('WebSocket错误:', error);
  updateStatus(false, '连接错误');
};

ws.onclose = () => {
  updateStatus(false, '连接已关闭');
  // 尝试重新连接
  setTimeout(() => {
    location.reload();
  }, 3000);
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  // 如果是心跳响应
  if (data.raw.includes("HEARTBEAT")) {
    document.getElementById('lastHeartbeat').textContent =
      new Date().toLocaleTimeString();
    updateServerStatus(true);
  }
  // 如果是普通数据
  else {
    // ...原有处理逻辑...
    document.getElementById('lastDataTime').textContent =
      new Date().toLocaleTimeString();
  }
};

// 初始化时钟
updateClock();
setInterval(updateClock, 1000);
setInterval(updateUptime, 1000);
setInterval(updatePacketRate, 500);

// 更新服务器状态
function updateServerStatus(isConnected) {
  const statusElem = document.getElementById('serverStatus');
  const statusText = document.getElementById('serverStatusText');

  if (isConnected) {
    statusElem.className = 'connection-status status-connected';
    statusText.textContent = '已连接';
  } else {
    statusElem.className = 'connection-status status-disconnected';
    statusText.textContent = '已断开';
  }
}