<?php
declare(strict_types=1);

require_once __DIR__ . '/_common.php';

api_run(static function (): void {
    $method = $_SERVER['REQUEST_METHOD'] ?? '';
    api_method('GET', 'POST', 'PUT', 'DELETE');
    $pdo = conectar();

    if ($method === 'GET') {
        $rows = $pdo->query('SELECT id, categoria AS tag, titulo AS title, contenido AS text FROM noticias ORDER BY creado_en DESC, id DESC')->fetchAll();
        api_json($rows);
    }

    api_current_admin();
    api_require_csrf();

    if ($method === 'DELETE') {
        $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        if (!$id) {
            api_json(['error' => 'Falta un identificador de noticia válido'], 422);
        }
        $statement = $pdo->prepare('DELETE FROM noticias WHERE id = ?');
        $statement->execute([$id]);
        if ($statement->rowCount() === 0) {
            api_json(['error' => 'No se encontró la noticia'], 404);
        }
        api_json(['message' => 'Noticia eliminada']);
    }

    $data = api_read_json();
    $tag = api_required_string($data, 'tag', 80);
    $title = api_required_string($data, 'title', 150);
    $text = api_required_string($data, 'text', 10000);

    if ($method === 'POST') {
        $statement = $pdo->prepare('INSERT INTO noticias (categoria, titulo, contenido) VALUES (?, ?, ?)');
        $statement->execute([$tag, $title, $text]);
        api_json(['id' => (int) $pdo->lastInsertId()], 201);
    }

    $id = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT);
    if (!$id) {
        api_json(['error' => 'Falta un identificador de noticia válido'], 422);
    }
    $statement = $pdo->prepare('UPDATE noticias SET categoria = ?, titulo = ?, contenido = ? WHERE id = ?');
    $statement->execute([$tag, $title, $text, $id]);
    if ($statement->rowCount() === 0) {
        $check = $pdo->prepare('SELECT COUNT(*) FROM noticias WHERE id = ?');
        $check->execute([$id]);
        if ((int) $check->fetchColumn() === 0) {
            api_json(['error' => 'No se encontró la noticia'], 404);
        }
    }
    api_json(['message' => 'Noticia actualizada']);
});
