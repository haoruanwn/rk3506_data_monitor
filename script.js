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
  "Node:Node Mock 01, Temp:28.5, Humi:65.2",
  "Node:Node Mock 01, Temp:28.7, Humi:64.8",
  "Node:Node Mock 01, Temp:29.0, Humi:64.5",
  "Node:Node Mock 01, Temp:28.8, Humi:64.7",
  "Node:Node Mock 01, Temp:28.6, Humi:65.0",
  "Node:Node Mock 01, Temp:28.9, Humi:64.3",
  "Node:Node Mock 01, Temp:29.2, Humi:63.9",
  "Node:Node Mock 01, Temp:29.1, Humi:64.1"
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
      document.getElementById(`${targetPage}Page`).classList.add('active');

      // 如果是监控页面，初始化图表
      if (targetPage === 'monitor') {
        initChart();
      }
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
  const tempMatch = data.match(/Temp:([\d.]+)/);
  const humiMatch = data.match(/Humi:([\d.]+)/);

  return {
    temperature: tempMatch ? parseFloat(tempMatch[1]) : null,
    humidity: humiMatch ? parseFloat(humiMatch[1]) : null
  };
}

// 初始化图表
function initChart() {
  const ctx = document.getElementById('tempHumidityChart').getContext('2d');

  if (tempHumidityChart) {
    tempHumidityChart.destroy();
  }

  // 模拟一些数据
  const labels = [];
  const tempData = [];
  const humiData = [];

  for (let i = 7; i >= 0; i--) {
    labels.push(`${i * 5}分钟前`);
    const data = parseDeviceData(sampleData[i]);
    tempData.push(data.temperature);
    humiData.push(data.humidity);
  }

  tempHumidityChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: '温度 (°C)',
          data: tempData,
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        },
        {
          label: '湿度 (%)',
          data: humiData,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
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
          text: '温度湿度变化趋势'
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

  // 更新温度湿度显示
  if (parsedData.temperature !== null) {
    document.getElementById('deviceTemp').textContent = `${parsedData.temperature}°C`;
  }
  if (parsedData.humidity !== null) {
    document.getElementById('deviceHumi').textContent = `${parsedData.humidity}%`;
  }

  // 更新数据包计数
  updatePacketCount();

  // 在流量页面添加数据项
  if (document.getElementById('trafficPage').classList.contains('active')) {
    const dataContainer = document.getElementById('dataContainer');

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
  if (tempHumidityChart) {
    const tempData = tempHumidityChart.data.datasets[0].data;
    const humiData = tempHumidityChart.data.datasets[1].data;

    // 移除第一个数据点
    tempData.shift();
    humiData.shift();

    // 添加新数据点
    tempData.push(parsedData.temperature);
    humiData.push(parsedData.humidity);

    // 更新图表
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
  setInterval(simulateData, 3000);

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


// 处理设备方向变化
window.addEventListener('orientationchange', function () {
  // 延迟执行以确保尺寸正确
  setTimeout(detectDeviceAndAdapt, 300);
});

