#!/usr/bin/env python

import asyncio
import websockets
import json

# A set to store all connected WebSocket clients
CONNECTED_CLIENTS = set()

async def handler(websocket, path):
    """
    Handle incoming WebSocket connections.
    """
    # Add the new client to our set of connected clients
    CONNECTED_CLIENTS.add(websocket)
    print(f"Client connected: {websocket.remote_address}")
    try:
        # Keep the connection open and listen for messages
        async for message in websocket:
            # When a message is received, broadcast it to all other clients
            clients_to_send = [client for client in CONNECTED_CLIENTS if client != websocket]
            if clients_to_send:
                await asyncio.wait([client.send(message) for client in clients_to_send])
    except websockets.exceptions.ConnectionClosed:
        print(f"Client disconnected: {websocket.remote_address}")
    finally:
        # Remove the client from our set when they disconnect
        CONNECTED_CLIENTS.remove(websocket)

async def main():
    """
    Start the WebSocket server.
    """
    # The server will listen on all available network interfaces
    async with websockets.serve(handler, "0.0.0.0", 8080):
        print("WebSocket server started on port 8080")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Server shutting down.")
