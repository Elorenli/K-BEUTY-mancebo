<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/db.php';

try {
    $pdo = conectar();
    $sql = 'SELECT id, titulo, fecha, tipo, descripcion
            FROM eventos
            ORDER BY fecha IS NULL, fecha, id';

    echo json_encode($pdo->query($sql)->fetchAll(), JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
} catch (Throwable $error) {
    error_log('No se pudo consultar el calendario académico: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'No se pudo leer el calendario académico'], JSON_UNESCAPED_UNICODE);
}
