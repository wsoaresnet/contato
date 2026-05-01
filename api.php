<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$DATA_FILE = __DIR__ . '/data.json';

function readData() {
    global $DATA_FILE;
    if (!file_exists($DATA_FILE)) file_put_contents($DATA_FILE, json_encode((object)[]));
    return json_decode(file_get_contents($DATA_FILE), true) ?: [];
}

function writeData($data) {
    global $DATA_FILE;
    file_put_contents($DATA_FILE, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$action = $_GET['action'] ?? '';

if ($action === 'load') {
    echo json_encode(readData());
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) { http_response_code(400); echo json_encode(['error' => 'JSON inválido']); exit; }

    $data = readData();
    $data['days']      = $input['days']      ?? $data['days']      ?? [];
    $data['habits']    = $input['habits']    ?? $data['habits']    ?? [];
    $data['habitLog']  = $input['habitLog']  ?? $data['habitLog']  ?? [];
    $data['events']    = $input['events']    ?? $data['events']    ?? [];

    writeData($data);
    echo json_encode(['ok' => true]);
    exit;
}

echo json_encode(['error' => 'Ação inválida']);
