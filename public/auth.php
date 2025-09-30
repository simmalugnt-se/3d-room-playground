<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Simple auth for development - just allow everyone
// In production, add proper user authentication here
$socket_id = $_POST['socket_id'];
$channel_name = $_POST['channel_name'];

// For presence channels, include user info
if (strpos($channel_name, 'presence-') === 0) {
    $user_id = uniqid(); // Generate unique user ID
    $user_info = [
        'name' => 'Player ' . substr($user_id, -6)
    ];
    
    $string_to_sign = $socket_id . ':' . $channel_name . ':' . json_encode($user_info);
} else {
    $string_to_sign = $socket_id . ':' . $channel_name;
}

$key = getenv('PUSHER_SECRET') ?: 'your-pusher-secret-here'; // Replace with your actual secret
$signature = hash_hmac('sha256', $string_to_sign, $key);

$response = [
    'auth' => getenv('PUSHER_KEY') . ':' . $signature
];

if (strpos($channel_name, 'presence-') === 0) {
    $response['channel_data'] = json_encode($user_info);
}

echo json_encode($response);
?>