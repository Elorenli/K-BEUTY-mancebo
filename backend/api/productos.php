<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/db.php';

try {
    $pdo = conectar();
    $sql = 'SELECT p.id, p.nombre, p.precio, p.stock, p.tipo_piel AS tipoPiel,
                   p.ingredientes, p.descripcion, p.imagen,
                   m.nombre AS marca, c.nombre AS categoria
            FROM productos p
            JOIN marcas m ON m.id = p.marca_id
            JOIN categorias c ON c.id = p.categoria_id
            ORDER BY p.id';

    echo json_encode($pdo->query($sql)->fetchAll(), JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
} catch (Throwable $error) {
    error_log('No se pudo consultar el catálogo de productos: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'No se pudo leer la base de datos'], JSON_UNESCAPED_UNICODE);
}
