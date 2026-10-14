# Seoul Glow: catálogo conectado a MySQL

## Requisitos

- Node.js y pnpm (o npm).
- PHP 8.1 o posterior con las extensiones `pdo_mysql` y `mbstring`.
- MySQL 8 o compatible.

## Preparar la base de datos

1. Inicia MySQL y crea la base de datos importando `backend/database/schema.sql`.
2. Importa `backend/database/seed.sql` para cargar el catálogo de ejemplo.
3. Copia `.env.example` a `.env` y ajusta `DB_HOST`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`. Pon entre comillas los valores que contengan `;` o `#`. El archivo `.env` solo se lee en PHP y no se publica.
4. Crea una cuenta de administrador desde la raíz del proyecto con `php backend/scripts/create-admin.php`. La contraseña se solicita en la terminal y debe tener al menos 12 caracteres.

Si ya tenías instalada una versión anterior de la base de datos, ejecuta **una sola vez** `backend/database/migration_backend.sql` antes de iniciar el servidor. En una base nueva no ejecutes esa migración: los cambios ya están incluidos en `schema.sql`.

Los archivos SQL establecen `utf8mb4` para conservar las tildes y la `ñ`. Si ya importaste datos desde una terminal de Windows y aparecen letras dañadas, importa una vez `backend/database/fix_seed_text.sql` para reparar los textos de ejemplo existentes.

## Iniciar el sitio y el servidor

Abre dos terminales en la raíz del proyecto:

```sh
pnpm dev:api
```

```sh
pnpm dev
```

Abre la dirección que muestre Vite (normalmente `http://localhost:5173`). Vite reenvía `/api` a PHP en `http://127.0.0.1:8000`. También puedes comprobar la API directamente en `http://127.0.0.1:8000/api/productos.php` y `http://127.0.0.1:8000/api/eventos.php`.

## API

- `GET /api/productos.php`: catálogo; requiere base de datos.
- `GET /api/eventos.php`: calendario académico.
- `GET /api/noticias.php`: noticias públicas.
- `POST /api/contacto.php`: valida y guarda mensajes del formulario.
- `GET /api/catalogos.php`: marcas y categorías para el panel.
- `POST /api/auth/register.php`: crea una cuenta de cliente. El formulario del sitio permite registrarse y entrar con una cuenta existente.
- `POST /api/auth/login.php`, `GET /api/auth/session.php` y `POST /api/auth/logout.php`: inicio, consulta y cierre de sesión para clientes y administradores.
- `/api/productos.php`, `/api/noticias.php` y `/api/usuarios.php`: operaciones administrativas protegidas por sesión y token CSRF.

El registro público solo crea cuentas con rol cliente. Las operaciones del panel siguen disponibles únicamente para cuentas con rol administrador; el registro no permite crear administradores. Las contraseñas se guardan con `password_hash`; no hay contraseñas predeterminadas ni credenciales de demostración. El servidor registra los errores internos en el log de PHP y no los devuelve al navegador.

Las actividades sin fecha confirmada se guardan con `fecha` nula y se muestran como **Por confirmar**; actualiza esa columna cuando el docente confirme el calendario. En la sección multimedia se pueden seleccionar videos para previsualizarlos localmente; no se cargan al servidor.