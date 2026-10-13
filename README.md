# Seoul Glow: catálogo conectado a MySQL

## Preparar la base de datos

1. Inicia el servicio MySQL que tengas instalado.
2. En phpMyAdmin, importa `backend/database/schema.sql` y después `backend/database/seed.sql`.
3. La conexión PHP usa por defecto `127.0.0.1`, la base `seoul_glow`, el usuario `root` y contraseña vacía. Puedes cambiar esos valores con las variables `DB_HOST`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`.

## Iniciar el sitio

Abre dos terminales desde la raíz del proyecto. Necesitas PHP con PDO MySQL habilitado:

```sh
php -S localhost:8000 -t backend
```

```sh
pnpm dev
```

Abre la dirección que indique Vite (normalmente `http://localhost:5173`). Vite redirige las solicitudes `/api` al servidor PHP. Los endpoints `http://localhost:8000/api/productos.php` y `http://localhost:8000/api/eventos.php` devuelven el catálogo y el calendario académico en JSON. Las actividades sin fecha confirmada se guardan con `fecha` nula y se muestran como **Por confirmar**; actualiza esa columna cuando el docente confirme el calendario.

La galería usa fotografías incluidas en `public/images`. En la sección multimedia puedes seleccionar un archivo de video para previsualizarlo localmente; no se carga al servidor.

Si PHP o la base de datos no están disponibles, la página informa del problema y muestra las recomendaciones y actividades de ejemplo. La edición del panel administrativo sigue siendo una demostración local y no modifica MySQL.