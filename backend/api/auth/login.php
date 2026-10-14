<?php
declare(strict_types=1);

require_once __DIR__ . '/../_common.php';

api_run(static function (): void {
    api_method('POST');
    $data = api_read_json();
    $email = filter_var($data['correo'] ?? null, FILTER_VALIDATE_EMAIL);
    $password = $data['password'] ?? null;
    if (!$email || !is_string($password) || $password === '' || strlen($password) > 1024) {
        api_json(['error' => 'Correo o contraseña incorrectos'], 401);
    }

    $pdo = conectar();
    $statement = $pdo->prepare(
        'SELECT id, nombre, correo, password_hash, rol FROM usuarios WHERE correo = ? LIMIT 1'
    );
    $statement->execute([mb_strtolower($email)]);
    $user = $statement->fetch();
    if (!$user || !password_verify($password, $user['password_hash'])) {
        api_json(['error' => 'Correo o contraseña incorrectos'], 401);
    }

    api_start_session();
    session_regenerate_id(true);
    $_SESSION['user'] = [
        'id' => (int) $user['id'],
        'nombre' => $user['nombre'],
        'correo' => $user['correo'],
        'rol' => $user['rol'],
    ];
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    api_json([
        'user' => [
            'id' => (int) $user['id'],
            'nombre' => $user['nombre'],
            'correo' => $user['correo'],
            'rol' => $user['rol'],
        ],
        'csrfToken' => $_SESSION['csrf_token'],
    ]);
});
