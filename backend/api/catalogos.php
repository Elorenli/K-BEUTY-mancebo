<?php
declare(strict_types=1);

require_once __DIR__ . '/_common.php';

api_run(static function (): void {
    api_method('GET');
    $pdo = conectar();
    api_json([
        'marcas' => $pdo->query('SELECT id, nombre FROM marcas ORDER BY nombre')->fetchAll(),
        'categorias' => $pdo->query('SELECT id, nombre FROM categorias ORDER BY nombre')->fetchAll(),
    ]);
});
