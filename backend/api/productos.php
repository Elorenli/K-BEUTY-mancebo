<?php
declare(strict_types=1);

require_once __DIR__ . '/_common.php';

api_run(static function (): void {
    $method = $_SERVER['REQUEST_METHOD'] ?? '';
    api_method('GET', 'POST', 'PUT', 'DELETE');
    $pdo = conectar();

    if ($method === 'GET') {
        $sql = 'SELECT p.id, p.nombre, p.precio, p.stock, p.tipo_piel AS tipoPiel,
                       p.ingredientes, p.descripcion, p.imagen,
                       p.marca_id AS marcaId, p.categoria_id AS categoriaId,
                       m.nombre AS marca, c.nombre AS categoria
                FROM productos p
                JOIN marcas m ON m.id = p.marca_id
                JOIN categorias c ON c.id = p.categoria_id
                ORDER BY p.id';
        api_json($pdo->query($sql)->fetchAll());
    }

    api_current_admin();
    api_require_csrf();

    if ($method === 'DELETE') {
        $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        if (!$id) {
            api_json(['error' => 'Falta un identificador de producto válido'], 422);
        }
        $statement = $pdo->prepare('DELETE FROM productos WHERE id = ?');
        $statement->execute([$id]);
        if ($statement->rowCount() === 0) {
            api_json(['error' => 'No se encontró el producto'], 404);
        }
        api_json(['message' => 'Producto eliminado']);
    }

    $data = api_read_json();
    $name = api_required_string($data, 'nombre', 150);
    $description = api_required_string($data, 'descripcion', 2000);
    $image = api_required_string($data, 'imagen', 255);
    $ingredients = api_optional_string($data, 'ingredientes', 2000);
    $skinType = api_optional_string($data, 'tipoPiel', 120);
    $price = filter_var($data['precio'] ?? null, FILTER_VALIDATE_FLOAT);
    $stock = filter_var($data['stock'] ?? null, FILTER_VALIDATE_INT);
    $brandId = filter_var($data['marcaId'] ?? null, FILTER_VALIDATE_INT);
    $categoryId = filter_var($data['categoriaId'] ?? null, FILTER_VALIDATE_INT);
    $imageScheme = parse_url($image, PHP_URL_SCHEME);
    $validImage = in_array(strtolower((string) $imageScheme), ['http', 'https'], true) ||
        ($imageScheme === null && str_starts_with($image, './images/') && !str_contains($image, '..'));

    if ($price === false || $price < 0 || $price > 999999.99 ||
        $stock === false || $stock < 0 || $stock > 2147483647 ||
        !$brandId || !$categoryId || !$validImage) {
        api_json(['error' => 'Precio, existencia, marca o categoría no válidos'], 422);
    }

    $lookup = $pdo->prepare('SELECT COUNT(*) FROM marcas WHERE id = ?');
    $lookup->execute([$brandId]);
    $brandExists = (int) $lookup->fetchColumn() > 0;
    $lookup = $pdo->prepare('SELECT COUNT(*) FROM categorias WHERE id = ?');
    $lookup->execute([$categoryId]);
    $categoryExists = (int) $lookup->fetchColumn() > 0;
    if (!$brandExists || !$categoryExists) {
        api_json(['error' => 'La marca o categoría seleccionada no existe'], 422);
    }

    if ($method === 'POST') {
        $statement = $pdo->prepare(
            'INSERT INTO productos (nombre, marca_id, categoria_id, precio, stock, tipo_piel, ingredientes, descripcion, imagen)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $statement->execute([$name, $brandId, $categoryId, $price, $stock, $skinType, $ingredients, $description, $image]);
        api_json(['id' => (int) $pdo->lastInsertId()], 201);
    }

    $id = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT);
    if (!$id) {
        api_json(['error' => 'Falta un identificador de producto válido'], 422);
    }
    $statement = $pdo->prepare(
        'UPDATE productos
         SET nombre = ?, marca_id = ?, categoria_id = ?, precio = ?, stock = ?,
             tipo_piel = ?, ingredientes = ?, descripcion = ?, imagen = ?
         WHERE id = ?'
    );
    $statement->execute([$name, $brandId, $categoryId, $price, $stock, $skinType, $ingredients, $description, $image, $id]);
    if ($statement->rowCount() === 0) {
        $check = $pdo->prepare('SELECT COUNT(*) FROM productos WHERE id = ?');
        $check->execute([$id]);
        if ((int) $check->fetchColumn() === 0) {
            api_json(['error' => 'No se encontró el producto'], 404);
        }
    }
    api_json(['message' => 'Producto actualizado']);
});
