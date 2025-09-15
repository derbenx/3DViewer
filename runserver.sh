#!/bin/bash
echo "Starting WebSocket relay server..."

# Start the WebSocket server on port 8080
python3 websocket_server.py &
WS_PID=$!
echo "WebSocket server started with PID: $WS_PID"

# Save the PID to a file so it can be stopped later
# The `trap` command ensures that the pid file is removed on exit
trap "rm -f server.pid" EXIT
echo $WS_PID > server.pid

echo "Server is running. To stop it, run ./stopserver.sh or press Ctrl+C in this window."

# Wait for the user to press Ctrl+C
wait $WS_PID
