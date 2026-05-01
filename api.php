<?php
// api.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$storageFile = 'planner_data.json';

// Manejo de requisição OPTIONS (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// AÇÃO: CARREGAR DADOS (GET)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($storageFile)) {
        echo file_get_contents($storageFile);
    } else {
        echo json_encode(["ok" => false, "error" => "Arquivo não encontrado"]);
    }
    exit;
}

// AÇÃO: SALVAR DADOS (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    
    // Valida se o input é um JSON válido antes de salvar
    if (json_decode($input)) {
        if (file_put_contents($storageFile, $input)) {
            echo json_encode(["ok" => true]);
        } else {
            echo json_encode(["ok" => false, "error" => "Falha ao escrever no servidor. Verifique permissões de pasta."]);
        }
    } else {
        echo json_encode(["ok" => false, "error" => "Dados JSON inválidos recebidos."]);
    }
    exit;
}
?>
