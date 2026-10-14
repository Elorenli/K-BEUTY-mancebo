<?php
declare(strict_types=1);

require_once __DIR__ . '/_common.php';

api_run(static function (): void {
    $method = $_SERVER['REQUEST_METHOD'] ?? '';
    api_method('GET', 'POST', 'PUT', 'DELETE');
    $currentUser = api_current_admin();
    $pdo = conectar();

    if ($method === 'GET') {
        $rows = $pdo->query('SELECT id, nombre AS name, correo AS email, rol FROM usuarios ORDER BY nombre')->fetchAll();
        foreach ($rows as &$row) {
            $row['id'] = (int) $row['id'];
            $row['role'] = $row['rol'] === 'admin' ? 'Administrador' : 'Cliente';
            unset($row['rol']);
        }
        api_json($rows);
    }

    api_require_csrf();

    if ($method === 'DELETE') {
        $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        if (!$id) {
            api_json(['error' => 'Falta un identificador de usuario válido'], 422);
        }
        if ($id === (int) $currentUser['id']) {
            api_json(['error' => 'No puedes eliminar tu propia cuenta'], 422);
        }
        $statement = $pdo->prepare('DELETE FROM usuarios WHERE id = ?');
        $statement->execute([$id]);
        if ($statement->rowCount() === 0) {
            api_json(['error' => 'No se encontró el usuario'], 404);
        }
        api_json(['message' => 'Usuario eliminado']);
    }

    $data = api_read_json();
    $name = api_required_string($data, 'name', 80);
    $email = filter_var($data['email'] ?? null, FILTER_VALIDATE_EMAIL);
    $role = $data['role'] ?? null;
    if (!$email || mb_strlen($email) > 120 || !in_array($role, ['cliente', 'admin'], true)) {
        api_json(['error' => 'Correo o rol no válido'], 422);
    }
    $email = mb_strtolower($email);

    if ($method === 'POST') {
        $password = $data['password'] ?? null;
        if (!is_string($password) || strlen($password) < 12 || strlen($password) > 1024) {
            api_json(['error' => 'La contraseña debe tener al menos 12 caracteres'], 422);
        }
        $statement = $pdo->prepare(
            'INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, ?)'
        );
        try {
            $statement->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT), $role]);
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') {
                api_json(['error' => 'Ya existe una cuenta con ese correo'], 409);
            }
            throw $error;
        }
        api_json(['id' => (int) $pdo->lastInsertId()], 201);
    }

    $id = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT);
    if (!$id) {
        api_json(['error' => 'Falta un identificador de usuario válido'], 422);
    }
    $password = $data['password'] ?? '';
    if (!is_string($password) || ($password !== '' && (strlen($password) < 12 || strlen($password) > 1024))) {
        api_json(['error' => 'La nueva contraseña debe tener al menos 12 caracteres'], 422);
    }

    $pdo->beginTransaction();
    $statement = $pdo->prepare('SELECT id, rol FROM usuarios WHERE id = ? FOR UPDATE');
    $statement->execute([$id]);
    $target = $statement->fetch();
    if (!$target) {
        $pdo->rollBack();
        api_json(['error' => 'No se encontró el usuario'], 404);
    }
    if ($target['rol'] === 'admin' && $role !== 'admin') {
        $count = (int) $pdo->query("SELECT COUNT(*) FROM usuarios WHERE rol = 'admin'")->fetchColumn();
        if ($count <= 1) {
            $pdo->rollBack();
            api_json(['error' => 'Debe quedar al menos una cuenta administradora'], 422);
        }
    }
    $statement = $pdo->prepare('UPDATE usuarios SET nombre = ?, correo = ?, rol = ? WHERE id = ?');
    try {
        $statement->execute([$name, $email, $role, $id]);
    } catch (PDOException $error) {
        $pdo->rollBack();
        if ($error->getCode() === '23000') {
            api_json(['error' => 'Ya existe una cuenta con ese correo'], 409);
        }
        throw $error;
    }
    if ($password !== '') {
        $statement = $pdo->prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?');
        $statement->execute([password_hash($password, PASSWORD_DEFAULT), $id]);
    }
    $pdo->commit();

    if ($id === (int) $currentUser['id'] && $role !== 'admin') {
        $_SESSION = [];
        session_destroy();
    }
    api_json(['message' => 'Usuario actualizado']);
});
