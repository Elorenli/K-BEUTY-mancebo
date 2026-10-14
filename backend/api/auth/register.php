<?php
declare(strict_types=1);

require_once __DIR__ . '/../_common.php';

api_run(static function (): void {
    api_method('POST');
    $data = api_read_json();
    $name = api_required_string($data, 'nombre', 80);
    $email = filter_var($data['correo'] ?? null, FILTER_VALIDATE_EMAIL);
    $password = $data['password'] ?? null;
    $confirmation = $data['confirmacion'] ?? null;

    if (mb_strlen($name) < 2 || !$email || mb_strlen($email) > 120 ||
        !is_string($password) || strlen($password) < 12 || strlen($password) > 1024 ||
        !is_string($confirmation) || !hash_equals($password, $confirmation)) {
        api_json(['error' => 'Revisa los datos. La contraseña debe tener al menos 12 caracteres y ambas deben coincidir.'], 422);
    }

    $pdo = conectar();
    $statement = $pdo->prepare(
        "INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, 'cliente')"
    );
    try {
        $statement->execute([
            $name,
            mb_strtolower($email),
            password_hash($password, PASSWORD_DEFAULT),
        ]);
    } catch (PDOException $error) {
        if ($error->getCode() === '23000') {
            api_json(['error' => 'Ya existe una cuenta con ese correo'], 409);
        }
        throw $error;
    }

    api_json(['message' => 'Cuenta creada. Ahora puedes iniciar sesión.'], 201);
});
