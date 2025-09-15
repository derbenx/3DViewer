#!/usr/bin/env python

import asyncio
import websockets
import json
import ssl
import pathlib

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
    # --- SSL Configuration ---
    # The server will try to start securely if the certificate and key files are found in the 'certs' directory.
    # Otherwise, it will fall back to a non-secure server.
    ssl_context = None
    cert_path = pathlib.Path(__file__).parent / "certs"
    cert_file = cert_path / "apache.cert"
    key_file = cert_path / "apache.key"

    try:
        ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ssl_context.load_cert_chain(cert_file, key_file)
        print("SSL certificates found. Starting secure WebSocket server (wss://).")
    except FileNotFoundError:
        print("SSL certificates not found in 'certs' directory. Starting non-secure WebSocket server (ws://).")
    except Exception as e:
        print(f"Error loading SSL certificates: {e}")
        print("Falling back to non-secure WebSocket server (ws://).")

    # The server will listen on all available network interfaces
    async with websockets.serve(handler, "0.0.0.0", 8080, ssl=ssl_context):
        if ssl_context:
            print("Secure WebSocket server started on port 8080")
        else:
            print("WebSocket server started on port 8080")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Server shutting down.")
