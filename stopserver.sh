#!/bin/bash
echo "Stopping WebSocket relay server..."

if [ -f server.pid ]; then
    # Kill the process whose PID is in the file
    kill $(cat server.pid)
    # Remove the pid file
    rm server.pid
    echo "Server stopped."
else
    echo "PID file not found. Was the server started with ./runserver.sh?"
fi
