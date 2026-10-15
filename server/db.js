import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultDatabasePath = resolve(projectRoot, "data", "seoul-glow.sqlite");

const brands = [
  [101, "Beauty of Joseon", "Corea del Sur"],
  [102, "COSRX", "Corea del Sur"],
  [103, "Anua", "Corea del Sur"],
  [104, "SKIN1004", "Corea del Sur"],
  [105, "The Ordinary", "Canadá"],
];

const categories = [
  [1, "Protectores Solares", "Protección UV diaria con fórmulas ligeras"],
  [2, "Esencias y Sérums", "Tratamientos concentrados para problemas específicos"],
  [3, "Tónicos", "Balancean el pH e hidratan profundamente"],
  [4, "Limpiadores", "Limpieza profunda en base a agua o aceite"],
  [5, "Sérums", "Sérums y ampollas para complementar la rutina"],
];

const products = [
  ["Relief Sun: Rice + Probiotics", 101, 1, 18, 50, "Todo tipo de piel", "Extracto de arroz (30%), probióticos y filtros solares.", "Protector solar orgánico ligero para uso diario. Revisa las instrucciones del envase y reaplica según corresponda.", "https://images.unsplash.com/photo-1741896135490-4062a3b21abf?auto=format&fit=crop&w=900&q=85"],
  ["Low pH Good Morning Gel Cleanser", 102, 4, 12, 35, "Mixta o grasa", "Betaína salicilato y aceite de árbol de té.", "Limpiador en gel de pH ligeramente ácido para el primer paso de la rutina.", "https://images.unsplash.com/photo-1688413467024-c539918fdd7c?auto=format&fit=crop&w=900&q=85"],
  ["Heartleaf 77% Soothing Toner", 103, 3, 19, 40, "Todo tipo de piel", "Extracto de Houttuynia cordata (heartleaf).", "Tónico ligero para complementar la rutina de hidratación. Consulta la lista INCI completa antes de usarlo.", "./images/Anua 🫧 🎀.jfif"],
  ["Madagascar Centella Ampoule", 104, 5, 18, 35, "Todo tipo de piel", "Centella asiática.", "Ampolla de centella asiática incluida en la galería local del proyecto.", "./images/SKIN1004.png"],
  ["Niacinamide 10% + Zinc 1%", 105, 5, 12, 30, "Mixta o grasa", "Niacinamida 10% y zinc 1%.", "Sérum incluido en la galería de imágenes del proyecto. Revisa las instrucciones del fabricante.", "./images/the-ordinary-niacinamide.jfif"],
];

const events = [
  ["Actividad 1.1 · Maquetación HTML", "2025-10-02", "Entrega / actividad", "Fecha indicada en la planificación académica."],
  ["Entrega del proyecto web", null, "Entrega", "Fecha por confirmar con el docente."],
  ["Exposición del proyecto y galería multimedia", null, "Exposición", "Fecha por confirmar con el docente."],
  ["Evaluación y retroalimentación", null, "Evaluación", "Fecha por confirmar con el docente."],
];

const articles = [
  ["HTML", "Una web clara empieza con buena estructura", "Usar etiquetas como header, nav, main y section ayuda a organizar el contenido y facilita la navegación."],
  ["DISEÑO RESPONSIVE", "Diseñar para móvil también es diseñar para todos", "Una presentación que se adapta a distintos tamaños hace que las recomendaciones sean fáciles de consultar."],
  ["TECNOLOGÍA", "De una maqueta a una aplicación web", "HTML da la estructura; CSS, JavaScript, Node.js y una base de datos pueden ampliar el proyecto en próximas etapas."],
];

export function createDatabase(databasePath = process.env.SQLITE_DB_PATH || defaultDatabasePath) {
  if (databasePath !== ":memory:") mkdirSync(dirname(resolve(databasePath)), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL COLLATE NOCASE UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'cliente' CHECK (role IN ('cliente', 'admin')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      country TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand_id INTEGER NOT NULL REFERENCES brands(id),
      category_id INTEGER NOT NULL REFERENCES categories(id),
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      skin_type TEXT,
      ingredients TEXT,
      description TEXT,
      image TEXT
    );

    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL DEFAULT 'General',
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT,
      type TEXT NOT NULL DEFAULT 'Actividad académica',
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      csrf_token TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_expires_at ON sessions(expires_at);
  `);

  if (databasePath !== ":memory:") database.exec("PRAGMA journal_mode = WAL");
  seedDatabase(database);
  return database;
}

function seedDatabase(database) {
  database.exec("BEGIN IMMEDIATE");
  try {
    if (database.prepare("SELECT COUNT(*) AS count FROM brands").get().count === 0) {
      const insert = database.prepare("INSERT INTO brands (id, name, country) VALUES (?, ?, ?)");
      for (const brand of brands) insert.run(...brand);
    }

    if (database.prepare("SELECT COUNT(*) AS count FROM categories").get().count === 0) {
      const insert = database.prepare("INSERT INTO categories (id, name, description) VALUES (?, ?, ?)");
      for (const category of categories) insert.run(...category);
    }

    if (database.prepare("SELECT COUNT(*) AS count FROM products").get().count === 0) {
      const insert = database.prepare(`
        INSERT INTO products (name, brand_id, category_id, price, stock, skin_type, ingredients, description, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const product of products) insert.run(...product);
    }

    if (database.prepare("SELECT COUNT(*) AS count FROM events").get().count === 0) {
      const insert = database.prepare("INSERT INTO events (title, date, type, description) VALUES (?, ?, ?, ?)");
      for (const event of events) insert.run(...event);
    }

    if (database.prepare("SELECT COUNT(*) AS count FROM news").get().count === 0) {
      const insert = database.prepare("INSERT INTO news (category, title, content) VALUES (?, ?, ?)");
      for (const article of articles) insert.run(...article);
    }

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
