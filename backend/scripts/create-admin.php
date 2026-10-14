<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../config/db.php';

fwrite(STDOUT, "Crear cuenta administradora de Seoul Glow\n");
fwrite(STDOUT, "Nombre: ");
$name = trim((string) fgets(STDIN));
fwrite(STDOUT, "Correo: ");
$email = filter_var(trim((string) fgets(STDIN)), FILTER_VALIDATE_EMAIL);
fwrite(STDOUT, "Contraseña (mínimo 12 caracteres): ");
$password = trim((string) fgets(STDIN));

if (mb_strlen($name) < 2 || mb_strlen($name) > 80 || !$email || mb_strlen($email) > 120 ||
    strlen($password) < 12 || strlen($password) > 1024) {
    fwrite(STDERR, "Nombre, correo o contraseña no válidos.\n");
    exit(1);
}

try {
    $pdo = conectar();
    $statement = $pdo->prepare(
        "INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, 'admin')"
    );
    $statement->execute([$name, mb_strtolower($email), password_hash($password, PASSWORD_DEFAULT)]);
    fwrite(STDOUT, "Cuenta administradora creada correctamente.\n");
} catch (PDOException $error) {
    if ($error->getCode() === '23000') {
        fwrite(STDERR, "Ya existe una cuenta con ese correo.\n");
        exit(1);
    }
    fwrite(STDERR, "No se pudo crear la cuenta. Revisa la conexión y la base de datos.\n");
    error_log($error->getMessage());
    exit(1);
}
