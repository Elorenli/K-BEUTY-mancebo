USE seoul_glow;

INSERT INTO marcas (id, nombre, pais) VALUES
  (101, 'Beauty of Joseon', 'Corea del Sur'),
  (102, 'COSRX', 'Corea del Sur'),
  (103, 'Anua', 'Corea del Sur'),
  (104, 'SKIN1004', 'Corea del Sur'),
  (105, 'The Ordinary', 'Canadá');

INSERT INTO categorias (id, nombre, descripcion) VALUES
  (1, 'Protectores Solares', 'Protección UV diaria con fórmulas ligeras'),
  (2, 'Esencias y Sérums', 'Tratamientos concentrados para problemas específicos'),
  (3, 'Tónicos', 'Balancean el pH e hidratan profundamente'),
  (4, 'Limpiadores', 'Limpieza profunda en base a agua o aceite'),
  (5, 'Sérums', 'Sérums y ampollas para complementar la rutina');

INSERT INTO productos (
  id, nombre, marca_id, categoria_id, precio, stock, tipo_piel,
  ingredientes, descripcion, imagen
) VALUES
  (
    1, 'Relief Sun: Rice + Probiotics', 101, 1, 18.00, 50, 'Todo tipo de piel',
    'Extracto de arroz (30%), probióticos y filtros solares.',
    'Protector solar orgánico ligero para uso diario. Revisa las instrucciones del envase y reaplica según corresponda.',
    'https://images.unsplash.com/photo-1741896135490-4062a3b21abf?auto=format&fit=crop&w=900&q=85'
  ),
  (
    2, 'Low pH Good Morning Gel Cleanser', 102, 4, 12.00, 35, 'Mixta o grasa',
    'Betaína salicilato y aceite de árbol de té.',
    'Limpiador en gel de pH ligeramente ácido para el primer paso de la rutina.',
    'https://images.unsplash.com/photo-1688413467024-c539918fdd7c?auto=format&fit=crop&w=900&q=85'
  ),
  (
    3, 'Heartleaf 77% Soothing Toner', 103, 3, 19.00, 40, 'Todo tipo de piel',
    'Extracto de Houttuynia cordata (heartleaf).',
    'Tónico ligero para complementar la rutina de hidratación. Consulta la lista INCI completa antes de usarlo.',
    './images/Anua 🫧 🎀.jfif'
  ),
  (
    4, 'Madagascar Centella Ampoule', 104, 5, 18.00, 35, 'Todo tipo de piel',
    'Centella asiática.',
    'Ampolla de centella asiática incluida en la galería local del proyecto.',
    './images/SKIN1004.png'
  ),
  (
    5, 'Niacinamide 10% + Zinc 1%', 105, 5, 12.00, 30, 'Mixta o grasa',
    'Niacinamida 10% y zinc 1%.',
    'Sérum incluido en la galería de imágenes del proyecto. Revisa las instrucciones del fabricante.',
    './images/The Ordinary Niacinamide 10% + Zinc 1%, Smoothing Serum for Blemish-Prone Skin_.jfif'
  );

INSERT INTO eventos (titulo, fecha, tipo, descripcion) VALUES
  ('Actividad 1.1 · Maquetación HTML', '2025-10-02', 'Entrega / actividad', 'Fecha indicada en la planificación académica.'),
  ('Entrega del proyecto web', NULL, 'Entrega', 'Fecha por confirmar con el docente.'),
  ('Exposición del proyecto y galería multimedia', NULL, 'Exposición', 'Fecha por confirmar con el docente.'),
  ('Evaluación y retroalimentación', NULL, 'Evaluación', 'Fecha por confirmar con el docente.');
