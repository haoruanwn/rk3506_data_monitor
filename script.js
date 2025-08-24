// DOM元素
const loginPage = document.getElementById('loginPage');
const mainSystem = document.getElementById('mainSystem');
const loginForm = document.getElementById('loginForm');
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const currentTimeElement = document.getElementById('currentTime');
const logoutBtn = document.getElementById('logoutBtn');

// 模拟设备数据
const sampleData = [
  "Node:Node_01, AirTemp:28.5, AirHumi:65.2, SoilWet:45.0",
  "Node:Node_01, AirTemp:28.7, AirHumi:64.8, SoilWet:45.2",
  "Node:Node_01, AirTemp:29.0, AirHumi:64.5, SoilWet:45.5",
  "Node:Node_01, AirTemp:28.8, AirHumi:64.7, SoilWet:45.3",
  "Node:Node_01, AirTemp:28.6, AirHumi:65.0, SoilWet:45.1",
  "Node:Node_01, AirTemp:28.9, AirHumi:64.3, SoilWet:45.7",
  "Node:Node_01, AirTemp:29.2, AirHumi:63.9, SoilWet:46.0",
  "Node:Node_01, AirTemp:29.1, AirHumi:64.1, SoilWet:45.8"
];

// 初始化变量
let packetCounter = 0;
let startTime = Date.now();
let lastSecondPackets = 0;
let lastSecondTime = Date.now();
let tempHumidityChart = null;



// 登录功能
loginForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  // 简单验证
  if (username === '123' && password === '123456') {
    loginPage.style.display = 'none';
    mainSystem.style.display = 'block';
    initSystem();
  } else {
    alert('用户名或密码错误！请使用用户名:123 密码:123456');
  }
});

// 退出登录
logoutBtn.addEventListener('click', function () {
  mainSystem.style.display = 'none';
  loginPage.style.display = 'flex';
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
});

// 添加页面切换时的布局调整
function adjustLayoutForPage(pageId) {
  // 给一点延迟确保DOM完全渲染
  setTimeout(() => {
    if (pageId === 'monitorPage') {
      // 数据监测页面特定布局调整
      initChart();
    } else if (pageId === 'trafficPage') {
      // 流量管理页面特定布局调整
      const dataContainer = document.getElementById('dataContainer');
      if (dataContainer.children.length === 0) {
        dataContainer.innerHTML = '<div class="data-item"><div class="data-content">等待数据连接...</div><div class="data-time">--:--:--</div></div>';
      }
    } else if (pageId === 'userPage') {
      // 用户管理页面特定布局调整
      // 不需要特殊处理
    }

    // 触发resize事件以确保图表正确渲染
    window.dispatchEvent(new Event('resize'));
  }, 100);
}


// 导航切换
navItems.forEach(item => {
  if (item.id !== 'logoutBtn') {
    item.addEventListener('click', function () {
      const targetPage = this.getAttribute('data-page');

      // 更新活动状态
      navItems.forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');

      // 显示目标页面
      pages.forEach(page => page.classList.remove('active'));
      const targetPageElement = document.getElementById(`${targetPage}Page`);
      targetPageElement.classList.add('active');

      // 调整特定页面的布局
      adjustLayoutForPage(`${targetPage}Page`);
    });
  }
});

// 更新当前时间
function updateClock() {
  const now = new Date();
  currentTimeElement.textContent = now.toLocaleTimeString();
}

// 更新运行时间
function updateUptime() {
  const seconds = Math.floor((Date.now() - startTime) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  document.getElementById('monitorUptime').textContent =
    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 更新数据包计数
function updatePacketCount() {
  document.getElementById('packetCount').textContent = packetCounter;
  document.getElementById('trafficPacketCount').textContent = packetCounter;
}

// 更新数据包速率
function updatePacketRate() {
  const now = Date.now();
  const elapsed = (now - lastSecondTime) / 1000;

  if (elapsed >= 1) {
    const rate = (packetCounter - lastSecondPackets) / elapsed;
    document.getElementById('packetRate').textContent = `${rate.toFixed(1)}/s`;
    document.getElementById('trafficPacketRate').textContent = `${rate.toFixed(1)}/s`;

    lastSecondPackets = packetCounter;
    lastSecondTime = now;
  }
}

// 解析设备数据
function parseDeviceData(data) {
  const airTempMatch = data.match(/AirTemp:([\d.]+)/);
  const airHumiMatch = data.match(/AirHumi:([\d.]+)/);
  const soilWetMatch = data.match(/SoilWet:([\d.]+)/);

  return {
    airTemperature: airTempMatch ? parseFloat(airTempMatch[1]) : null,
    airHumidity: airHumiMatch ? parseFloat(airHumiMatch[1]) : null,
    soilWetness: soilWetMatch ? parseFloat(soilWetMatch[1]) : null
  };
}

// 初始化图表
function initChart(empty = false) {
  const ctx = document.getElementById('tempHumidityChart').getContext('2d');
  if (tempHumidityChart) {
      tempHumidityChart.destroy();
  }

  const labels = [];
  const airTempData = [];
  const airHumiData = [];
  const soilWetData = [];

  if (empty) {
      // 创建一个带有8个空标签的图表，等待数据填充
      for (let i = 0; i < 8; i++) labels.push('');
  } else {
        // (这部分代码现在不会被调用，但保留以备后用)
      for (let i = 7; i >= 0; i--) {
          labels.push(`${i * 5}分钟前`);
          const data = parseDeviceData(sampleData[i]);
          airTempData.push(data.airTemperature);
          airHumiData.push(data.airHumidity);
          soilWetData.push(data.soilWetness);
      }
  }

  tempHumidityChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: '空气温度 (°C)',
          data: airTempData,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderWidth: 2,
          tension: 0.3,
          fill: false
        },
        {
          label: '空气湿度 (%)',
          data: airHumiData,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderWidth: 2,
          tension: 0.3,
          fill: false
        },
        {
          label: '土壤湿度 (%)',
          data: soilWetData,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderWidth: 2,
          tension: 0.3,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: '数值'
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: '环境数据监测'
        }
      }
    }
  });
}

// 模拟WebSocket数据接收
function simulateData() {
  const now = new Date();
  const dataIndex = Math.floor(Math.random() * sampleData.length);
  const data = sampleData[dataIndex];

  // 解析数据
  const parsedData = parseDeviceData(data);

  // 更新数据包计数
  packetCounter++;
  document.getElementById('lastDataTime').textContent = now.toLocaleTimeString();

  // 更新设备信息
  document.getElementById('monitorDeviceId').textContent = 'DEVICE_001';
  document.getElementById('monitorLastActive').textContent = now.toLocaleTimeString();

  // 更新空气温度、空气湿度和土壤湿度显示
  if (parsedData.airTemperature !== null) {
    document.getElementById('airTemp').textContent = `${parsedData.airTemperature}°C`;
  }
  if (parsedData.airHumidity !== null) {
    document.getElementById('airHumi').textContent = `${parsedData.airHumidity}%`;
  }
  if (parsedData.soilWetness !== null) {
    document.getElementById('soilWet').textContent = `${parsedData.soilWetness}%`;
  }

  // 更新数据包计数
  updatePacketCount();

  // 在流量页面添加数据项
  if (document.getElementById('trafficPage').classList.contains('active')) {
    const dataContainer = document.getElementById('dataContainer');

    // 清除"等待数据连接"提示
    if (dataContainer.children.length === 1 &&
      dataContainer.children[0].textContent.includes('等待数据连接')) {
      dataContainer.innerHTML = '';
    }

    // 创建新的数据项
    const dataItem = document.createElement('div');
    dataItem.className = 'data-item';

    const dataContent = document.createElement('div');
    dataContent.className = 'data-content';
    dataContent.textContent = data;

    const dataTime = document.createElement('div');
    dataTime.className = 'data-time';
    dataTime.textContent = now.toLocaleTimeString();

    dataItem.appendChild(dataContent);
    dataItem.appendChild(dataTime);

    // 添加到数据容器顶部
    dataContainer.insertBefore(dataItem, dataContainer.firstChild);

    // 移除旧数据，只保留最近的20条
    if (dataContainer.children.length > 20) {
      dataContainer.removeChild(dataContainer.lastChild);
    }
  }

  // 更新图表数据（如果图表已初始化）
  if (tempHumidityChart && document.getElementById('monitorPage').classList.contains('active')) {
    const airTempData = tempHumidityChart.data.datasets[0].data;
    const airHumiData = tempHumidityChart.data.datasets[1].data;
    const soilWetData = tempHumidityChart.data.datasets[2].data;

    // 移除第一个数据点
    airTempData.shift();
    airHumiData.shift();
    soilWetData.shift();

    // 添加新数据点
    airTempData.push(parsedData.airTemperature);
    airHumiData.push(parsedData.airHumidity);
    soilWetData.push(parsedData.soilWetness);

    // 更新标签
    const labels = tempHumidityChart.data.labels;
    labels.shift();
    labels.push(now.toLocaleTimeString());

    // 更新图表
    tempHumidityChart.update();
  }
}

function connectWebSocket() {
    // 请确保这里的 IP 地址和端口与您的 data_bridge.py 服务匹配
    // 如果您在本地运行，就是 'ws://localhost:8765'
    // 如果部署在服务器上，请替换为 'ws://服务器IP:8765'
    const ws = new WebSocket('ws://localhost:8765');

    ws.onopen = function() {
        console.log('成功连接到 WebSocket 数据服务！');
        document.getElementById('statusText').textContent = '已连接到数据服务';
        document.getElementById('statusIndicator').classList.add('connected');
        document.getElementById('wsStatusText').textContent = '已连接';
        // 清除可能存在的"等待数据"提示
        const dataContainer = document.getElementById('dataContainer');
        if (dataContainer.children.length === 1 && dataContainer.children[0].textContent.includes('等待数据连接')) {
            dataContainer.innerHTML = '';
        }
    };

    ws.onmessage = function(event) {
        // 我们的 Python 服务发送的是 JSON 字符串，所以先解析
        const message = JSON.parse(event.data);
        
        // 检查消息类型，我们只处理原始数据广播
        if (message.raw) {
            processRealData(message.raw);
        }
    };

    ws.onclose = function() {
        console.log('WebSocket 连接已断开，5秒后尝试重连...');
        document.getElementById('statusText').textContent = '数据服务已断开';
        document.getElementById('statusIndicator').classList.remove('connected');
        document.getElementById('wsStatusText').textContent = '已断开';
        // 简单的自动重连机制
        setTimeout(connectWebSocket, 5000);
    };

    ws.onerror = function(error) {
        console.error('WebSocket 发生错误: ', error);
        ws.close(); // 发生错误时主动关闭，触发 onclose 中的重连逻辑
    };
}

function processRealData(dataString) {
    const now = new Date();
    
    // 解析数据
    const parsedData = parseDeviceData(dataString);

    // 更新数据包计数
    packetCounter++;
    document.getElementById('lastDataTime').textContent = now.toLocaleTimeString();

    // 更新设备信息
    document.getElementById('monitorDeviceId').textContent = 'DEVICE_001';
    document.getElementById('monitorLastActive').textContent = now.toLocaleTimeString();

    // 更新空气温度、空气湿度和土壤湿度显示
    if (parsedData.airTemperature !== null) {
        document.getElementById('airTemp').textContent = `${parsedData.airTemperature}°C`;
    }
    if (parsedData.airHumidity !== null) {
        document.getElementById('airHumi').textContent = `${parsedData.airHumidity}%`;
    }
    if (parsedData.soilWetness !== null) {
        document.getElementById('soilWet').textContent = `${parsedData.soilWetness}%`;
    }

    updatePacketCount();

    // 在流量页面添加数据项
    if (document.getElementById('trafficPage').classList.contains('active')) {
        const dataContainer = document.getElementById('dataContainer');
        const dataItem = document.createElement('div');
        dataItem.className = 'data-item';
        const dataContent = document.createElement('div');
        dataContent.className = 'data-content';
        dataContent.textContent = dataString;
        const dataTime = document.createElement('div');
        dataTime.className = 'data-time';
        dataTime.textContent = now.toLocaleTimeString();
        dataItem.appendChild(dataContent);
        dataItem.appendChild(dataTime);
        dataContainer.insertBefore(dataItem, dataContainer.firstChild);
        if (dataContainer.children.length > 20) {
            dataContainer.removeChild(dataContainer.lastChild);
        }
    }

    // 更新图表数据
    if (tempHumidityChart && document.getElementById('monitorPage').classList.contains('active')) {
        const labels = tempHumidityChart.data.labels;
        labels.shift();
        labels.push(now.toLocaleTimeString());
        
        const datasets = tempHumidityChart.data.datasets;
        datasets[0].data.shift();
        datasets[0].data.push(parsedData.airTemperature);
        datasets[1].data.shift();
        datasets[1].data.push(parsedData.airHumidity);
        datasets[2].data.shift();
        datasets[2].data.push(parsedData.soilWetness);
        
        tempHumidityChart.update();
    }
}

// 初始化系统
function initSystem() {
  // 启动时钟
  updateClock();
  setInterval(updateClock, 1000);
  setInterval(updateUptime, 1000);
  setInterval(updatePacketRate, 500);

  // 模拟数据接收
  //  setInterval(simulateData, 3000);

  // 启用 WebSocket 连接
  connectWebSocket();

  // 初始化图表
  initChart();

  // 设备检测和适配
  detectDeviceAndAdapt();
  window.addEventListener('resize', detectDeviceAndAdapt);

}

// 设备检测和适配函数
function detectDeviceAndAdapt() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isMobile = width <= 768;
  const isTablet = width > 768 && width <= 992;

  // 根据设备类型添加相应的类名
  document.body.classList.toggle('mobile-device', isMobile);
  document.body.classList.toggle('tablet-device', isTablet);
  document.body.classList.toggle('desktop-device', !isMobile && !isTablet);

  // 可以根据需要调整特定元素的样式
  if (isMobile) {
    // 移动设备特定的调整
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.style.padding = '8px 12px';
    });
  }

  // 记录设备信息（可选）
  console.log(`设备分辨率: ${width}x${height}, 类型: ${isMobile ? '移动' : isTablet ? '平板' : '桌面'}`);
}

// 在页面加载时立即检测一次
window.addEventListener('DOMContentLoaded', detectDeviceAndAdapt);

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', function () {
  // 初始化图表
  if (document.getElementById('monitorPage').classList.contains('active')) {
    initChart();
  }

  // 初始化数据容器
  if (document.getElementById('trafficPage').classList.contains('active')) {
    const dataContainer = document.getElementById('dataContainer');
    if (dataContainer.children.length === 0) {
      dataContainer.innerHTML = '<div class="data-item"><div class="data-content">等待数据连接...</div><div class="data-time">--:--:--</div></div>';
    }
  }
});


// 处理设备方向变化
window.addEventListener('orientationchange', function () {
  // 延迟执行以确保尺寸正确
  setTimeout(detectDeviceAndAdapt, 300);
});

