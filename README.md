# WebXR Remote Debugger

This project is a WebXR application with a remote debugging tool that allows you to view live hand tracking data from a separate browser window.

## How to Run

### 1. Serve the Application Files

You need to serve the root directory using a local web server. If you have Python installed, you can run this command from the project's root directory:

```bash
python -m http.server
```

Then, open `http://localhost:8000` (or the appropriate address for your webserver) in your browser.

### 2. Run the WebSocket Server

The remote debugger requires a Python WebSocket server to be running in the background.

First, you may need to install the `websockets` library. You can do this using pip:
```bash
pip install websockets
```

Then, start the server by running the following command from the project's root directory:
```bash
python websocket_server.py
```

The server will be running on `ws://<your-server-address>:8080`.

### 3. Use the Debugger

1.  Open the main application, for example: `http://your-subdomain.your-domain.com/index.html`
2.  Open the debugger client in a separate tab, for example: `http://your-subdomain.your-domain.com/debugger.html`
3.  In the main application, enter an AR or VR session with hand tracking enabled.
4.  You should see the live hand tracking data appearing in the debugger window.
