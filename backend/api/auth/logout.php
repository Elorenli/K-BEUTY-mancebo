<?php
declare(strict_types=1);

require_once __DIR__ . '/../_common.php';

api_run(static function (): void {
    api_method('POST');
    api_start_session();
    if (!is_array($_SESSION['user'] ?? null)) {
        api_json(['error' => 'No hay una sesión iniciada'], 401);
    }
    api_require_csrf();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 42000,
            'path' => $params['path'],
            'domain' => $params['domain'],
            'secure' => $params['secure'],
            'httponly' => $params['httponly'],
            'samesite' => $params['samesite'] ?? 'Strict',
        ]);
    }
    session_destroy();
    api_json(['message' => 'Sesión cerrada']);
});
