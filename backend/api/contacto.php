<?php
declare(strict_types=1);

require_once __DIR__ . '/_common.php';

api_run(static function (): void {
    api_method('POST');
    $data = api_read_json();
    $name = api_required_string($data, 'nombre', 80);
    $email = filter_var($data['correo'] ?? null, FILTER_VALIDATE_EMAIL);
    $message = api_required_string($data, 'mensaje', 5000);

    if (!$email || mb_strlen($email) > 120 || mb_strlen($name) < 2 || mb_strlen($message) < 10) {
        api_json(['error' => 'Revisa el nombre, correo y mensaje e inténtalo de nuevo'], 422);
    }

    $pdo = conectar();
    $statement = $pdo->prepare('INSERT INTO contactos (nombre, correo, mensaje) VALUES (?, ?, ?)');
    $statement->execute([$name, mb_strtolower($email), $message]);
    api_json(['message' => 'Mensaje recibido correctamente'], 201);
});
