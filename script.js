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

// 更新服务器状态
function updateServerStatus(isConnected) {
  const statusElem = document.getElementById('serverStatus');
  const statusTextElem = document.getElementById('serverStatusText');

  if (isConnected) {
    statusElem.className = 'connection-status status-connected';
    statusTextElem.textContent = '已连接';
  } else {
    statusElem.className = 'connection-status status-disconnected';
    statusTextElem.textContent = '已断开';
  }
}


// --- WebSocket事件处理 ---

ws.onopen = () => {
  updateStatus(true, '已连接到数据服务');
  startTime = Date.now();
};

// 这是合并修正后的、唯一的 ws.onmessage 函数
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  const now = new Date();

  // 检查是否是心跳消息
  if (data.raw && data.raw.includes("HEARTBEAT")) {
    document.getElementById('lastHeartbeat').textContent = now.toLocaleTimeString();
    updateServerStatus(true);
    return; // 心跳消息处理完毕，直接返回
  }
  
  // --- 以下是处理普通数据包的完整逻辑 ---

  // 1. 更新统计数据
  packetCounter++;
  document.getElementById('lastDataTime').textContent = now.toLocaleTimeString();
  
  // 2. 更新设备信息
  deviceId.textContent = data.device_id || 'DEVICE_001';
  updateLastActive(data.timestamp);
  updatePacketCount();

  // 3. 创建新的数据项并显示
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

  // 4. 添加到数据容器顶部
  dataContainer.insertBefore(dataItem, dataContainer.firstChild);

  // 5. 移除旧数据，只保留最近的50条
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

// --- 初始化时钟 ---
updateClock();
setInterval(updateClock, 1000);
setInterval(updateUptime, 1000);
setInterval(updatePacketRate, 500);