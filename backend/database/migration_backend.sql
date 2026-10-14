SET NAMES utf8mb4;

USE seoul_glow;

ALTER TABLE productos
  MODIFY id INT NOT NULL AUTO_INCREMENT;

ALTER TABLE noticias
  ADD COLUMN categoria VARCHAR(80) NOT NULL DEFAULT 'General' AFTER id;

INSERT INTO noticias (categoria, titulo, contenido)
SELECT 'HTML', 'Una web clara empieza con buena estructura', 'Usar etiquetas como header, nav, main y section ayuda a organizar el contenido y facilita la navegación.'
WHERE NOT EXISTS (SELECT 1 FROM noticias WHERE titulo = 'Una web clara empieza con buena estructura');

INSERT INTO noticias (categoria, titulo, contenido)
SELECT 'DISEÑO RESPONSIVE', 'Diseñar para móvil también es diseñar para todos', 'Una presentación que se adapta a distintos tamaños hace que las recomendaciones sean fáciles de consultar.'
WHERE NOT EXISTS (SELECT 1 FROM noticias WHERE titulo = 'Diseñar para móvil también es diseñar para todos');

INSERT INTO noticias (categoria, titulo, contenido)
SELECT 'TECNOLOGÍA', 'De una maqueta a una aplicación web', 'HTML da la estructura; CSS, JavaScript, PHP y una base de datos pueden ampliar el proyecto en próximas etapas.'
WHERE NOT EXISTS (SELECT 1 FROM noticias WHERE titulo = 'De una maqueta a una aplicación web');
