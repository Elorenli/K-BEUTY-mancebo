SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS seoul_glow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE seoul_glow;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  correo VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('cliente','admin') NOT NULL DEFAULT 'cliente',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE marcas (
  id INT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  pais VARCHAR(60)
);

CREATE TABLE categorias (
  id INT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  descripcion VARCHAR(255)
);

CREATE TABLE productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  marca_id INT NOT NULL,
  categoria_id INT NOT NULL,
  precio DECIMAL(8,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  tipo_piel VARCHAR(120),
  ingredientes TEXT,
  descripcion TEXT,
  imagen VARCHAR(255),
  FOREIGN KEY (marca_id) REFERENCES marcas(id),
  FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

CREATE TABLE pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  estado ENUM('pendiente','enviado','entregado') DEFAULT 'pendiente',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE pedido_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(8,2) NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE noticias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  categoria VARCHAR(80) NOT NULL DEFAULT 'General',
  titulo VARCHAR(150) NOT NULL,
  contenido TEXT NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eventos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  fecha DATE,
  tipo VARCHAR(60) NOT NULL DEFAULT 'Actividad académica',
  descripcion VARCHAR(255)
);

CREATE TABLE contactos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  correo VARCHAR(120) NOT NULL,
  mensaje TEXT NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE multimedia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  url VARCHAR(255) NOT NULL
);
