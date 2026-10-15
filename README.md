# Seoul Glow: catálogo con Node.js y SQLite

## Requisitos

- Node.js 22.5 o posterior y npm (o pnpm).

No necesitas instalar ni iniciar XAMPP, PHP o MySQL. La primera ejecución crea automáticamente una base de datos SQLite local en `data/seoul-glow.sqlite` y carga los datos iniciales del catálogo.

## Iniciar el sitio y la API

```sh
npm install
npm run dev:all
```

El comando inicia juntos el servidor Node.js y Vite. Abre la dirección que muestre Vite, normalmente `http://127.0.0.1:5173`. Para iniciarlos por separado, usa `npm run dev:api` y `npm run dev` en dos terminales. La API está disponible en `http://127.0.0.1:8000/api/health`.

## Crear una cuenta administradora

```sh
npm run create-admin
```

El comando pide el nombre, el correo y una contraseña de al menos 12 caracteres. Después, abre **Administración** e inicia sesión con ese correo y contraseña. Al cambiar de MySQL a SQLite, la cuenta y los datos guardados en la antigua base de XAMPP no se copian; crea una cuenta nueva para esta base SQLite.

La base local se conserva entre reinicios y está excluida de Git. Para empezar de nuevo, detén el servidor y elimina únicamente `data/seoul-glow.sqlite` y sus archivos `data/seoul-glow.sqlite-*`; la próxima ejecución la vuelve a crear con los datos iniciales.

El registro público solo crea cuentas de cliente. Las acciones administrativas están protegidas por sesión, rol de administrador y token CSRF. Las contraseñas se derivan con scrypt y no hay credenciales predeterminadas. Los errores internos se registran en la consola del servidor, no se envían al navegador.

## Dónde cambiar el proyecto

- `public/partials/`: una plantilla HTML por sección de la web. Cambia `team.html` para editar los datos y las fotos de las integrantes, y `about.html` para la descripción y la información académica.
- `src/styles/base.css`: colores globales, tipografía y estilos base.
- `src/styles/layout.css`: cabecera, pie de página y estructura del panel.
- `src/styles/components.css`: componentes de las secciones y del catálogo.
- `src/styles/team.css`: diseño y adaptación a móvil de las fichas del equipo.
- `src/styles/sections.css`: fondos y distribución adaptable de las secciones principales.
- `src/js/partials.js`: lista de plantillas HTML que se cargan en la página.
- `src/js/`: comportamiento de navegación, catálogo, formularios, autenticación y panel.
- `server/`: API Node.js, base SQLite y autenticación.
- `scripts/`: comandos de desarrollo y creación de la cuenta administradora.

## API

- `GET /api/health`: estado de la API y conexión SQLite.
- `GET /api/products`, `GET /api/news`, `GET /api/events` y `GET /api/catalogs`: datos públicos del sitio.
- `POST /api/contact`: valida y guarda mensajes del formulario.
- `/api/auth/login`, `/api/auth/session`, `/api/auth/logout` y `POST /api/auth/register`: autenticación y registro público de clientes.
- `/api/products`, `/api/news` y `/api/users`: gestión administrativa protegida por sesión y token CSRF.

Las actividades sin fecha confirmada se guardan con fecha nula y se muestran como **Por confirmar**. En la sección multimedia se pueden seleccionar videos para previsualizarlos localmente; no se cargan al servidor.