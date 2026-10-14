<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

function api_bootstrap(): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
}

function api_json(mixed $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR
    );
    exit;
}

function api_run(callable $handler): void
{
    api_bootstrap();

    try {
        $handler();
    } catch (Throwable $error) {
        error_log('Error de API: ' . $error->getMessage());
        api_json(['error' => 'Ocurrió un error interno en el servidor'], 500);
    }
}

function api_method(string ...$allowed): void
{
    if (!in_array($_SERVER['REQUEST_METHOD'] ?? '', $allowed, true)) {
        header('Allow: ' . implode(', ', $allowed));
        api_json(['error' => 'Método no permitido'], 405);
    }
}

function api_read_json(): array
{
    try {
        $data = json_decode(file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        api_json(['error' => 'El cuerpo debe ser JSON válido'], 400);
    }

    if (!is_array($data)) {
        api_json(['error' => 'El cuerpo debe ser un objeto JSON'], 400);
    }

    return $data;
}

function api_required_string(array $data, string $key, int $maxLength): string
{
    $value = $data[$key] ?? null;
    if (!is_string($value)) {
        api_json(['error' => "El campo {$key} es obligatorio"], 422);
    }

    $value = trim($value);
    if ($value === '' || mb_strlen($value) > $maxLength) {
        api_json(['error' => "El campo {$key} no es válido"], 422);
    }

    return $value;
}

function api_optional_string(array $data, string $key, int $maxLength): string
{
    $value = $data[$key] ?? '';
    if (!is_string($value) || mb_strlen(trim($value)) > $maxLength) {
        api_json(['error' => "El campo {$key} no es válido"], 422);
    }

    return trim($value);
}

function api_start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_set_cookie_params([
        'httponly' => true,
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'samesite' => 'Strict',
        'path' => '/',
    ]);
    session_start();
}

function api_current_admin(): array
{
    api_start_session();
    $user = $_SESSION['user'] ?? null;
    if (!is_array($user) || ($user['rol'] ?? '') !== 'admin') {
        api_json(['error' => 'Debes iniciar sesión como administrador'], 401);
    }

    return $user;
}

function api_require_csrf(): void
{
    api_start_session();
    $expected = $_SESSION['csrf_token'] ?? '';
    $provided = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

    if (!is_string($expected) || $expected === '' || !is_string($provided) || !hash_equals($expected, $provided)) {
        api_json(['error' => 'La sesión expiró. Inicia sesión nuevamente'], 403);
    }
}
