<?php
declare(strict_types=1);

function conectar(): PDO
{
    $envFile = __DIR__ . '/../../.env';
    $fileConfig = is_file($envFile) ? parse_ini_file($envFile, false, INI_SCANNER_RAW) : [];
    $host = getenv('DB_HOST') ?: ($fileConfig['DB_HOST'] ?? '127.0.0.1');
    $database = getenv('DB_NAME') ?: ($fileConfig['DB_NAME'] ?? 'seoul_glow');
    $username = getenv('DB_USER') ?: ($fileConfig['DB_USER'] ?? 'root');
    $password = getenv('DB_PASSWORD') ?: ($fileConfig['DB_PASSWORD'] ?? '');
    $dsn = "mysql:host={$host};dbname={$database};charset=utf8mb4";

    return new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}
