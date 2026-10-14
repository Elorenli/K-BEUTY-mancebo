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
    image: "./images/SKIN1004.png",
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
  {
    number: "04",
    category: "TÓNICO",
    title: "Anua Heartleaf 77% Soothing Toner",
    description: "Tónico de heartleaf para complementar una rutina de hidratación.",
    image: "./images/Anua 🫧 🎀.jfif",
    alt: "Tónico Anua Heartleaf 77%",
    content: "Revisa la lista de ingredientes y las instrucciones del envase antes de usarlo.",
    advantages: "Formato de tónico fácil de integrar en una rutina sencilla.",
    disadvantages: "Los extractos vegetales pueden causar sensibilidad individual.",
    use: "Aplica sobre la piel limpia siguiendo las instrucciones del fabricante.",
    officialUrl: "https://anua.com/",
  },
  {
    number: "05",
    category: "SÉRUM",
    title: "The Ordinary Niacinamide 10% + Zinc 1%",
    description: "Sérum de niacinamida incluido en la galería de productos del proyecto.",
    image: "./images/the-ordinary-niacinamide.jfif",
    alt: "Sérum The Ordinary Niacinamide 10% + Zinc 1%",
    content: "Fórmula con niacinamida y zinc. Consulta el envase para confirmar ingredientes y concentración.",
    advantages: "Su etiqueta permite practicar la lectura y comparación de ingredientes.",
    disadvantages: "La niacinamida puede no ser adecuada para todas las pieles; suspende su uso si causa irritación.",
    use: "Sigue las instrucciones del fabricante y prueba el producto en una zona pequeña antes de incorporarlo a la rutina.",
    officialUrl: "https://theordinary.com/",
  },
];

const storageKey = "ipidb-demo-products";
let products = loadProducts();

function resolveProductImage(image) {
  if (!image?.startsWith("./images/")) return image;

  const filename = image.slice("./images/".length);
  let decodedFilename = filename;
  try {
    decodedFilename = decodeURIComponent(filename);
  } catch {
    // Encode malformed percent sequences as literal filename characters.
  }
  if (decodedFilename.startsWith("The Ordinary Niacinamide 10% + Zinc 1%")) {
    return "./images/the-ordinary-niacinamide.jfif";
  }
  return `./images/${encodeURIComponent(decodedFilename)}`;
}

function addProductImageFallback(image) {
  const fallbackImage = resolveProductImage("./images/descarga%20(1).jfif");
  image.addEventListener("error", () => {
    if (image.dataset.fallbackApplied === "true") return;
    image.dataset.fallbackApplied = "true";
    image.src = fallbackImage;
    image.alt = "Selección de productos para el cuidado de la piel";
  });
}

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

export async function loadProductsFromApi() {
  const status = document.querySelector("#products-status");

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}api/productos.php`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("La API devolvió un formato inesperado.");

    const databaseProducts = data.map((product, index) => ({
      ...product,
      number: String(product.id).padStart(2, "0"),
      category: product.categoria,
      title: product.nombre,
      alt: `Producto ${product.nombre}`,
      image: resolveProductImage(product.imagen || initialProducts[index % initialProducts.length].image),
      source: "database",
    }));

    setProducts(databaseProducts);
    status.textContent = databaseProducts.length
      ? ""
      : "El catálogo de la base de datos todavía no tiene productos.";
    return true;
  } catch (error) {
    console.error("No se pudo cargar el catálogo desde la API PHP.", error);
    status.textContent = "No se pudo conectar con el catálogo de la base de datos. Se muestran recomendaciones de ejemplo.";
    return false;
  }
}

export function renderRecommendations(items = products) {
  const grid = document.querySelector("#recommendations-grid");
  const template = document.querySelector("#recommendation-template");
  grid.replaceChildren(...items.map((product) => {
    const card = template.content.cloneNode(true);
    const image = card.querySelector(".recommendation-image img");
    addProductImageFallback(image);
    image.src = resolveProductImage(product.image);
    image.alt = product.alt;
    card.querySelector(".product-number").textContent = product.number;
    card.querySelector(".product-category").textContent = product.category;
    card.querySelector(".product-title").textContent = product.title;
    card.querySelector(".product-description").textContent = product.description;

    const databaseDetails = card.querySelector(".database-product-details");
    if (product.source === "database") {
      card.querySelector(".product-details").hidden = true;
      databaseDetails.hidden = false;
      card.querySelector(".database-product-brand").textContent = `Marca: ${product.marca}`;
      card.querySelector(".database-product-brand").hidden = false;
      card.querySelector(".database-product-price").textContent = `Precio: $${Number(product.precio).toFixed(2)}`;
      card.querySelector(".database-product-price").hidden = false;
      card.querySelector(".database-product-skin").textContent = product.tipoPiel || "No especificado";
      card.querySelector(".database-product-ingredients").textContent = product.ingredientes || "No especificados";
      card.querySelector(".database-product-stock").textContent = `${product.stock} unidades`;
      return card;
    }

    card.querySelector(".product-content").textContent = product.content;
    card.querySelector(".product-use").textContent = product.use;
    card.querySelector(".product-advantages").textContent = product.advantages;
    card.querySelector(".product-disadvantages").textContent = product.disadvantages;
    card.querySelector(".product-official-link").href = product.officialUrl;
    return card;
  }));
}