# data_bridge.py
import socket
import asyncio
import websockets
import json
from datetime import datetime
import time
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('bridge.log')
    ]
)

# 配置参数
SERVER_ADDR = "116.62.171.150"   # TCP 服务端地址
SERVER_PORT = 8080              # TCP 服务端端口
WS_PORT = 8765                  # WebSocket 服务端口
DEVICE_ID = "DEVICE_001"        # 设备ID
RETRY_DELAY = 5                 # 重连等待时间(秒)
HEARTBEAT_INTERVAL = 30         # 心跳间隔(秒)

# 全局数据结构
connected_clients = set()
last_data = {"raw": "等待数据...", "timestamp": datetime.now().isoformat()}

async def websocket_server(websocket):
    """WebSocket 服务器处理函数"""
    connected_clients.add(websocket)
    logging.info(f"前端客户端已连接: {websocket.remote_address}")
    
    # 立即发送最新数据给新连接的客户端
    await websocket.send(json.dumps(last_data))
    
    try:
        # 保持连接打开
        async for _ in websocket:
            pass
    except websockets.exceptions.ConnectionClosed:
        logging.info("WebSocket连接正常关闭")
    finally:
        connected_clients.remove(websocket)
        logging.info(f"前端客户端已断开: {websocket.remote_address}")

async def broadcast_data(data):
    """向所有连接的WebSocket客户端广播数据"""
    global last_data
    
    # 更新最新数据
    last_data = {
        "raw": data,
        "timestamp": datetime.now().isoformat(),
        "device_id": DEVICE_ID
    }
    
    # 广播给所有连接的客户端
    if connected_clients:
        message = json.dumps(last_data)
        await asyncio.gather(
            *[client.send(message) for client in connected_clients],
            return_exceptions=True
        )

async def send_heartbeat(writer):
    """定期发送心跳包保持连接"""
    while True:
        # 确保注册消息有足够时间被独立发送和处理
        await asyncio.sleep(HEARTBEAT_INTERVAL)
        try:
            heartbeat_msg = f"HEARTBEAT:{DEVICE_ID}\n"
            writer.write(heartbeat_msg.encode())
            await writer.drain()
            logging.info(f"已发送心跳包: {heartbeat_msg.strip()}")
            await asyncio.sleep(HEARTBEAT_INTERVAL)
        except Exception as e:
            logging.error(f"发送心跳包失败: {e}")
            break

async def tcp_client():
    """TCP客户端连接和数据处理"""
    while True:
        try:
            logging.info(f"正在连接服务器 {SERVER_ADDR}:{SERVER_PORT}...")
            
            # 创建TCP连接
            reader, writer = await asyncio.open_connection(SERVER_ADDR, SERVER_PORT)
            logging.info("成功连接到服务器!")
            
            # 发送设备注册信息
            register_msg = f"REGISTER:MONITOR:{DEVICE_ID}\n"
            writer.write(register_msg.encode())
            await writer.drain()
            logging.info(f"已发送注册信息: {register_msg.strip()}")
            
            # 启动心跳任务
            heartbeat_task = asyncio.create_task(send_heartbeat(writer))
            
            # 持续接收数据
            while True:
                try:
                    data = await asyncio.wait_for(reader.read(1024), timeout=HEARTBEAT_INTERVAL * 2)
                    if not data:
                        logging.warning("收到空数据，连接可能已关闭")
                        break
                        
                    # 解码并处理数据
                    decoded_data = data.decode().strip()
                    logging.info(f"收到数据: {decoded_data}")
                    
                    # 广播到WebSocket客户端
                    await broadcast_data(decoded_data)
                    
                except asyncio.TimeoutError:
                    # 没有数据时发送心跳包
                    logging.debug("读取超时，发送心跳包...")
                    heartbeat_msg = f"HEARTBEAT:{DEVICE_ID}\n"
                    writer.write(heartbeat_msg.encode())
                    await writer.drain()
                    continue
                except Exception as e:
                    logging.error(f"处理数据时出错: {e}")
                    break
                    
            # 清理工作
            heartbeat_task.cancel()
            writer.close()
            await writer.wait_closed()
            logging.warning("与服务器的连接已断开")
            
        except (ConnectionRefusedError, OSError) as e:
            logging.error(f"连接错误: {e}")
        except Exception as e:
            logging.error(f"发生错误: {e}")
        
        logging.info(f"{RETRY_DELAY}秒后尝试重新连接...")
        await asyncio.sleep(RETRY_DELAY)

async def main():
    """主函数"""
    # 同时启动WebSocket服务器和TCP客户端
    async with websockets.serve(websocket_server, "0.0.0.0", WS_PORT):
        logging.info(f"WebSocket 服务器启动，监听端口: {WS_PORT}")
        await tcp_client()

if __name__ == "__main__":
    print(f"启动数据桥接服务...")
    print(f"WebSocket 服务器监听端口: {WS_PORT}")
    print(f"设备ID: {DEVICE_ID}")
    print(f"按 Ctrl+C 停止服务")
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n服务已停止")