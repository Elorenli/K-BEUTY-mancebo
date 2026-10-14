SET NAMES utf8mb4;
USE seoul_glow;

UPDATE marcas SET pais = 'Canadá' WHERE id = 105;

UPDATE categorias SET nombre = 'Esencias y Sérums', descripcion = 'Tratamientos concentrados para problemas específicos' WHERE id = 2;
UPDATE categorias SET nombre = 'Tónicos', descripcion = 'Balancean el pH e hidratan profundamente' WHERE id = 3;
UPDATE categorias SET nombre = 'Sérums', descripcion = 'Sérums y ampollas para complementar la rutina' WHERE id = 5;
UPDATE categorias SET descripcion = 'Protección UV diaria con fórmulas ligeras' WHERE id = 1;

UPDATE productos
SET ingredientes = 'Extracto de arroz (30%), probióticos y filtros solares.',
    descripcion = 'Protector solar orgánico ligero para uso diario. Revisa las instrucciones del envase y reaplica según corresponda.'
WHERE id = 1;
UPDATE productos
SET ingredientes = 'Betaína salicilato y aceite de árbol de té.',
    descripcion = 'Limpiador en gel de pH ligeramente ácido para el primer paso de la rutina.'
WHERE id = 2;
UPDATE productos
SET descripcion = 'Tónico ligero para complementar la rutina de hidratación. Consulta la lista INCI completa antes de usarlo.'
WHERE id = 3;
UPDATE productos
SET ingredientes = 'Centella asiática.',
    descripcion = 'Ampolla de centella asiática incluida en la galería local del proyecto.'
WHERE id = 4;
UPDATE productos
SET ingredientes = 'Niacinamida 10% y zinc 1%.',
    descripcion = 'Sérum incluido en la galería de imágenes del proyecto. Revisa las instrucciones del fabricante.'
WHERE id = 5;

UPDATE eventos
SET titulo = 'Actividad 1.1 · Maquetación HTML',
    descripcion = 'Fecha indicada en la planificación académica.'
WHERE id = 1;
UPDATE eventos
SET titulo = 'Exposición del proyecto y galería multimedia',
    tipo = 'Exposición',
    descripcion = 'Fecha por confirmar con el docente.'
WHERE id = 3;
UPDATE eventos
SET titulo = 'Evaluación y retroalimentación',
    tipo = 'Evaluación',
    descripcion = 'Fecha por confirmar con el docente.'
WHERE id = 4;

UPDATE noticias
SET categoria = 'HTML',
    contenido = 'Usar etiquetas como header, nav, main y section ayuda a organizar el contenido y facilita la navegación.'
WHERE id = 1;
UPDATE noticias
SET categoria = 'DISEÑO RESPONSIVE',
    titulo = 'Diseñar para móvil también es diseñar para todos',
    contenido = 'Una presentación que se adapta a distintos tamaños hace que las recomendaciones sean fáciles de consultar.'
WHERE id = 2;
UPDATE noticias
SET categoria = 'TECNOLOGÍA',
    titulo = 'De una maqueta a una aplicación web',
    contenido = 'HTML da la estructura; CSS, JavaScript, PHP y una base de datos pueden ampliar el proyecto en próximas etapas.'
WHERE id = 3;
