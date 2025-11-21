<?php
// Get the raw POST data
$log_data = file_get_contents('php://input');

// Define the log file path
$log_file = 'debug.log';

// Append the data to the log file
// The FILE_APPEND flag prevents overwriting the file
// The LOCK_EX flag prevents other scripts from writing to the file at the same time
if ($log_data) {
    file_put_contents($log_file, $log_data . "\n", FILE_APPEND | LOCK_EX);
    echo "Log saved.";
} else {
    http_response_code(400); // Bad Request
    echo "No log data received.";
}
?>
