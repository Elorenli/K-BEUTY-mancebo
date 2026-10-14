<?php
declare(strict_types=1);

require_once __DIR__ . '/../_common.php';

api_run(static function (): void {
    api_method('GET');
    api_start_session();
    $user = $_SESSION['user'] ?? null;
    if (!is_array($user)) {
        api_json(['user' => null, 'csrfToken' => null]);
    }

    api_json([
        'user' => [
            'id' => $user['id'],
            'nombre' => $user['nombre'],
            'correo' => $user['correo'],
            'rol' => $user['rol'],
        ],
        'csrfToken' => $_SESSION['csrf_token'] ?? null,
    ]);
});
