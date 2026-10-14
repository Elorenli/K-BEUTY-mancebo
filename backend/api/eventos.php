<?php
declare(strict_types=1);

require_once __DIR__ . '/_common.php';

api_run(static function (): void {
    api_method('GET');
    $pdo = conectar();
    $sql = 'SELECT id, titulo, fecha, tipo, descripcion
            FROM eventos
            ORDER BY fecha IS NULL, fecha, id';
    api_json($pdo->query($sql)->fetchAll());
});
