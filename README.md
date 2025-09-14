# WebXR Remote Debugger

This project is a WebXR application with a remote debugging tool that allows you to view live hand tracking data from a separate browser window.

## How to Run

### 1. Serve the Application Files

You need to serve the root directory using a local web server. If you have Python installed, you can run:

```bash
python -m http.server
```

Then, open `http://localhost:8000` in your browser.

### 2. Run the WebSocket Server

The remote debugger requires a WebSocket server to be running in the background.

First, install the dependencies:
```bash
npm install
```

Then, start the server:
```bash
npm start
```

The server will be running on `ws://localhost:8080`.

### 3. Use the Debugger

1.  Open the main application: `http://localhost:8000/index.html`
2.  Open the debugger client in a separate tab: `http://localhost:8000/debugger.html`
3.  In the main application, enter an AR or VR session with hand tracking enabled.
4.  You should see the live hand tracking data appearing in the debugger window.
