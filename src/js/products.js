const initialProducts = [
  {
    number: "01",
    category: "LIMPIEZA",
    title: "COSRX Low pH Good Morning Gel Cleanser",
    description: "Limpiador en gel de pH ligeramente ácido para el primer paso de la rutina.",
    image: "https://images.unsplash.com/photo-1688413467024-c539918fdd7c?auto=format&fit=crop&w=900&q=85",
    alt: "Limpiador facial coreano en presentación de gel",
    content: "Tubo de 150 ml. Incluye betaína salicilato y aceite de árbol de té; revisa la lista INCI completa en el envase o en la web oficial.",
    advantages: "Formato práctico, textura en gel y limpieza sencilla para mañana o noche.",
    disadvantages: "El aceite de árbol de té puede no ser adecuado para pieles sensibles a aceites esenciales; algunos limpiadores pueden dejar sensación seca.",
    use: "Humedece el rostro, emulsiona una pequeña cantidad en las manos, masajea suavemente y enjuaga. Evita el contorno de los ojos.",
    officialUrl: "https://www.cosrx.com/products/low-ph-good-morning-gel-cleanser",
  },
  {
    number: "02",
    category: "HIDRATACIÓN",
    title: "SKIN1004 Madagascar Centella Ampoule",
    description: "Ampoule ligera con centella asiática para complementar la hidratación.",
    image: "https://images.unsplash.com/photo-1688380353667-a6d3ddb85600?auto=format&fit=crop&w=900&q=85",
    alt: "Ampoule coreana de centella asiática",
    content: "Presentación habitual de 100 ml. Su lista INCI comienza con agua, glicerina, butylene glycol y extracto de Centella asiatica.",
    advantages: "Textura ligera y lista de ingredientes breve; se puede combinar con una crema hidratante.",
    disadvantages: "Por sí sola puede no ser suficiente para pieles secas; los extractos vegetales también pueden causar sensibilidad individual.",
    use: "Después de limpiar y aplicar tónico si se usa, distribuye unas gotas sobre rostro y cuello. Continúa con hidratante.",
    officialUrl: "https://www.skin1004.com/products/skin1004-madagascar-centella-ampoule",
  },
  {
    number: "03",
    category: "PROTECCIÓN SOLAR",
    title: "COSRX Aloe Soothing Sun Cream",
    description: "Protector solar facial SPF 50+ PA+++ con extracto de aloe.",
    image: "https://images.unsplash.com/photo-1741896135490-4062a3b21abf?auto=format&fit=crop&w=900&q=85",
    alt: "Productos de protección solar para el cuidado diario",
    content: "Tubo de 50 ml. Contiene filtros solares y extracto de Aloe barbadensis; la fórmula también incluye fragancia.",
    advantages: "Combina protección solar alta con una textura de crema que puede funcionar como último paso de la rutina de día.",
    disadvantages: "Contiene fragancia y componentes aromáticos; puede no ser la mejor opción para personas sensibles a estos ingredientes.",
    use: "Como último paso de la rutina de mañana, aplica una cantidad generosa y uniforme antes de la exposición solar. Reaplica según las indicaciones del envase, especialmente después de sudar, nadar o secarte.",
    officialUrl: "https://www.cosrx.com/products/aloe-soothing-sun-cream-spf50-pa",
  },
];

const storageKey = "ipidb-demo-products";
let products = loadProducts();

function loadProducts() {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : initialProducts;
  } catch (error) {
    console.error("No se pudieron leer las recomendaciones guardadas.", error);
    return initialProducts;
  }
}

export function getProducts() {
  return products;
}

export function setProducts(nextProducts) {
  localStorage.setItem(storageKey, JSON.stringify(nextProducts));
  products = nextProducts;
}

export function renderRecommendations(items = products) {
  const grid = document.querySelector("#recommendations-grid");
  const template = document.querySelector("#recommendation-template");
  grid.replaceChildren(...items.map((product) => {
    const card = template.content.cloneNode(true);
    card.querySelector(".recommendation-image img").src = product.image;
    card.querySelector(".recommendation-image img").alt = product.alt;
    card.querySelector(".product-number").textContent = product.number;
    card.querySelector(".product-category").textContent = product.category;
    card.querySelector(".product-title").textContent = product.title;
    card.querySelector(".product-description").textContent = product.description;
    card.querySelector(".product-content").textContent = product.content;
    card.querySelector(".product-use").textContent = product.use;
    card.querySelector(".product-advantages").textContent = product.advantages;
    card.querySelector(".product-disadvantages").textContent = product.disadvantages;
    card.querySelector(".product-official-link").href = product.officialUrl;
    return card;
  }));
}