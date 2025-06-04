import asyncio
import websockets

SERVER_URL = "wss://barkevunsalruzgarbulutalyamelihonur.glitch.me/socket.io/?EIO=4&transport=websocket"

async def connect():
    try:
        async with websockets.connect(SERVER_URL) as websocket:
            print("Connected to server!")
            while True:
                msg = await websocket.recv()
                print("Received:", msg)
    except Exception as e:
        print("Connection failed:", e)

if __name__ == "__main__":
    asyncio.run(connect())
