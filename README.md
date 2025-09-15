# WebXR Remote Debugger

This project is a WebXR application with a remote debugging tool that allows you to view live hand tracking data from a separate browser window.

## How to Run

### 1. Host the Application Files

Serve the project files using your existing web server.

### 2. Run the WebSocket Relay Server

The remote debugger requires a Python WebSocket server to be running. The server can run in two modes: secure (`wss://`) or non-secure (`ws://`).

#### For a Secure (WSS) Server (Recommended for HTTPS pages)

1.  Place your SSL certificate and private key in the `certs/` directory.
    -   The certificate file must be named `apache.cert`.
    -   The private key file must be named `apache.key`.
2.  The server will automatically detect these files and start in secure mode.

#### For a Non-Secure (WS) Server (For local HTTP pages)

If no certificate and key are found in the `certs/` directory, the server will automatically start in non-secure mode.

#### Installation and Execution

First, you may need to install the `websockets` library:
```bash
pip install websockets
```

Then, start the relay server. You can do this by running the provided script from the project's root directory. You may need to make it executable first (`chmod +x runserver.sh`).
```bash
./runserver.sh
```
This will start the WebSocket server. To stop it, press `Ctrl+C` in the same terminal, or run `./stopserver.sh` from another terminal.

### 3. Use the Debugger

1.  Open the main application, for example: `https://your-subdomain.your-domain.com/index.html`
2.  Open the debugger client in a separate tab, for example: `https://your-subdomain.your-domain.com/debugger.html`
3.  In the main application, enter an AR or VR session with hand tracking enabled.
4.  You should see the live hand tracking data appearing in the debugger window.
