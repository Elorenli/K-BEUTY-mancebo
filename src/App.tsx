import { FormEvent, useMemo, useState } from "react";

const photos = {
  hero: "https://images.unsplash.com/photo-1688413467228-296b52dc4a34?auto=format&fit=crop&w=1400&q=85",
  serum: "https://images.unsplash.com/photo-1688413467024-c539918fdd7c?auto=format&fit=crop&w=900&q=85",
  cream: "https://images.unsplash.com/photo-1688380353667-a6d3ddb85600?auto=format&fit=crop&w=900&q=85",
  duo: "https://images.unsplash.com/photo-1741896135490-4062a3b21abf?auto=format&fit=crop&w=1000&q=85",
  pink: "https://images.unsplash.com/photo-1741896136071-3f8c1d472aa8?auto=format&fit=crop&w=900&q=85",
};

const initialProducts = [
  { name: "Ampolla de Centella", type: "Tratamientos", benefit: "Calma y fortalece la barrera cutánea.", price: 29.9, image: photos.serum, tag: "MÁS VENDIDO" },
  { name: "Crema Barrera 1025", type: "Hidratación", benefit: "Hidratación profunda y duradera.", price: 24.5, image: photos.cream, tag: "NUEVO" },
  { name: "Mascarilla Glass Skin", type: "Mascarillas", benefit: "Un ritual intensivo para una piel luminosa.", price: 8.9, image: photos.duo, tag: "RITUAL" },
  { name: "Sérum de Arroz", type: "Tratamientos", benefit: "Ilumina y suaviza la piel.", price: 27.9, image: photos.pink, tag: "GLOW" },
  { name: "Limpiador Matcha", type: "Limpieza", benefit: "Limpia suavemente sin resecar.", price: 18.5, image: photos.hero, tag: "SUAVE" },
  { name: "Protector Solar Hanbang SPF50", type: "Protección solar", benefit: "Protección diaria ligera y cómoda.", price: 21.9, image: photos.cream, tag: "SPF 50+" },
];

const categories = ["Todos", "Limpieza", "Hidratación", "Tratamientos", "Protección solar", "Mascarillas"];
const initialArticles = [
  { category: "GUÍA", title: "Cómo crear una rutina coreana en 4 pasos", image: photos.duo },
  { category: "INGREDIENTES", title: "Centella asiática: un aliado para calmar la piel", image: photos.serum },
  { category: "NOVEDADES", title: "Qué buscar en tu protector solar diario", image: photos.cream },
];
type Product = (typeof initialProducts)[number];
type Cart = Record<string, number>;
type User = { name: string; email: string };
type Article = (typeof initialArticles)[number];

function loadValue<T,>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatPrice(price: number) {
  return `${price.toFixed(2).replace(".", ",")} €`;
}

function Icon({ name }: { name: "sparkle" | "bag" | "search" | "heart" | "arrow" | "close" | "plus" | "minus" | "menu" }) {
  const paths = {
    sparkle: <><path d="m12 3 1.2 4.1L17 9l-3.8 1.9L12 15l-1.2-4.1L7 9l3.8-1.9L12 3Z" /><path d="m19 15 .6 2.1L22 18l-2.4.9L19 21l-.6-2.1L16 18l2.4-.9L19 15Z" /></>,
    bag: <><path d="M6 8h12l1 12H5L6 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    minus: <path d="M5 12h14" />,
    menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function AdminPanel({
  products,
  articles,
  orders,
  user,
  onExit,
  onSaveProduct,
  onDeleteProduct,
  onSaveArticle,
  onDeleteArticle,
}: {
  products: Product[];
  articles: Article[];
  orders: Array<{ id: string; date: string; total: number }>;
  user: User | null;
  onExit: () => void;
  onSaveProduct: (product: Product, originalName?: string) => void;
  onDeleteProduct: (name: string) => void;
  onSaveArticle: (article: Article, originalTitle?: string) => void;
  onDeleteArticle: (title: string) => void;
}) {
  const [section, setSection] = useState("Resumen");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [productError, setProductError] = useState("");
  const [articleError, setArticleError] = useState("");
  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);

  function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const originalName = editingProduct?.name;
    const product = {
      name: String(data.get("name")).trim(),
      type: String(data.get("type")),
      benefit: String(data.get("benefit")).trim(),
      price: Number(data.get("price")),
      image: String(data.get("image")).trim(),
      tag: String(data.get("tag")).trim() || "NUEVO",
    };
    if (!product.name || !Number.isFinite(product.price) || product.price <= 0 || !product.image) {
      setProductError("Revisa el nombre, la imagen y el precio del producto.");
      return;
    }
    if (products.some((item) => item.name === product.name && item.name !== originalName)) {
      setProductError("Ya existe un producto con ese nombre.");
      return;
    }
    onSaveProduct(product, originalName);
    setEditingProduct(null);
    setProductError("");
  }

  function submitArticle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const originalTitle = editingArticle?.title;
    const article = {
      category: String(data.get("category")).trim(),
      title: String(data.get("title")).trim(),
      image: String(data.get("image")).trim(),
    };
    if (!article.category || !article.title || !article.image) {
      setArticleError("Completa la categoría, el título y la imagen.");
      return;
    }
    if (articles.some((item) => item.title === article.title && item.title !== originalTitle)) {
      setArticleError("Ya existe una noticia con ese título.");
      return;
    }
    onSaveArticle(article, originalTitle);
    setEditingArticle(null);
    setArticleError("");
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a href="#inicio" className="logo logo-light admin-brand" onClick={(event) => { event.preventDefault(); onExit(); }}><span><Icon name="sparkle" /></span>SEOUL <b>GLOW</b></a>
        <p className="admin-nav-label">ADMINISTRACIÓN</p>
        <nav aria-label="Secciones administrativas">
          {["Resumen", "Productos", "Noticias", "Pedidos", "Clientes"].map((item) => (
            <button type="button" key={item} className={section === item ? "active" : ""} onClick={() => { setSection(item); setEditingProduct(null); setEditingArticle(null); }}>{item}</button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom"><small>Modo demostración local</small><button type="button" onClick={onExit}>← Volver a la tienda</button></div>
      </aside>
      <main className="admin-main">
        <header className="admin-header"><div><p>Seoul Glow · Administración</p><h1>{section}</h1></div><span className="demo-badge">SOLO DEMOSTRACIÓN</span></header>
        <p className="admin-warning" role="note">Los cambios se guardan en este navegador. Este panel no cuenta con autenticación segura ni backend.</p>

        {section === "Resumen" && <div className="admin-content">
          <div className="admin-welcome"><p>Panel de control</p><h2>Resumen de la tienda</h2><small>Los pedidos y el cliente son datos locales de demostración.</small></div>
          <div className="admin-stats">
            <article><span>Catálogo</span><b>{products.length}</b><small>productos publicados</small></article>
            <article><span>Diario</span><b>{articles.length}</b><small>noticias publicadas</small></article>
            <article><span>Pedidos de prueba</span><b>{orders.length}</b><small>{formatPrice(totalSales)} registrados</small></article>
            <article><span>Perfil local</span><b>{user ? "1" : "0"}</b><small>{user?.email || "Sin perfil guardado"}</small></article>
          </div>
          <section className="admin-panel-card"><h2>Acciones rápidas</h2><div className="admin-quick-actions"><button type="button" onClick={() => { setSection("Productos"); setEditingProduct({ name: "", type: "Tratamientos", benefit: "", price: 0, image: "", tag: "NUEVO" }); }}>＋ Añadir producto</button><button type="button" onClick={() => { setSection("Noticias"); setEditingArticle({ category: "NOVEDADES", title: "", image: "" }); }}>＋ Añadir noticia</button><button type="button" onClick={onExit}>Ir a la tienda ↗</button></div></section>
        </div>}

        {section === "Productos" && <div className="admin-content">
          <div className="admin-section-heading"><div><p>Catálogo de la tienda</p><h2>Productos ({products.length})</h2></div><button type="button" className="admin-primary" onClick={() => { setProductError(""); setEditingProduct({ name: "", type: "Tratamientos", benefit: "", price: 0, image: "", tag: "NUEVO" }); }}>＋ Añadir producto</button></div>
          {editingProduct && <form className="admin-editor" onSubmit={submitProduct}><h3>{editingProduct.name ? "Editar producto" : "Nuevo producto"}</h3><div className="admin-fields">
            <label>Nombre<input name="name" required defaultValue={editingProduct.name} /></label>
            <label>Categoría<select name="type" defaultValue={editingProduct.type}>{categories.filter((item) => item !== "Todos").map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Precio (€)<input name="price" type="number" min="0.01" step="0.01" required defaultValue={editingProduct.price || ""} /></label>
            <label>Etiqueta<input name="tag" defaultValue={editingProduct.tag} /></label>
            <label className="field-wide">Beneficio<input name="benefit" required defaultValue={editingProduct.benefit} /></label>
            <label className="field-wide">URL de imagen<input name="image" type="url" required defaultValue={editingProduct.image} /></label>
          </div>{productError && <p className="admin-error" role="alert">{productError}</p>}<div className="editor-actions"><button className="admin-primary" type="submit">Guardar producto</button><button type="button" onClick={() => setEditingProduct(null)}>Cancelar</button></div></form>}
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Etiqueta</th><th>Acciones</th></tr></thead><tbody>{products.map((product) => <tr key={product.name}><td><div className="admin-product-cell"><img src={product.image} alt="" /><b>{product.name}</b></div></td><td>{product.type}</td><td>{formatPrice(product.price)}</td><td>{product.tag}</td><td><button type="button" className="table-action" onClick={() => { setProductError(""); setEditingProduct(product); }}>Editar</button><button type="button" className="table-action delete-action" onClick={() => { if (window.confirm(`¿Eliminar ${product.name} del catálogo?`)) onDeleteProduct(product.name); }}>Eliminar</button></td></tr>)}</tbody></table></div>
        </div>}

        {section === "Noticias" && <div className="admin-content">
          <div className="admin-section-heading"><div><p>Contenido editorial</p><h2>Noticias ({articles.length})</h2></div><button type="button" className="admin-primary" onClick={() => { setArticleError(""); setEditingArticle({ category: "NOVEDADES", title: "", image: "" }); }}>＋ Añadir noticia</button></div>
          {editingArticle && <form className="admin-editor" onSubmit={submitArticle}><h3>{editingArticle.title ? "Editar noticia" : "Nueva noticia"}</h3><div className="admin-fields">
            <label>Categoría<input name="category" required defaultValue={editingArticle.category} /></label>
            <label>Título<input name="title" required defaultValue={editingArticle.title} /></label>
            <label className="field-wide">URL de imagen<input name="image" type="url" required defaultValue={editingArticle.image} /></label>
          </div>{articleError && <p className="admin-error" role="alert">{articleError}</p>}<div className="editor-actions"><button className="admin-primary" type="submit">Guardar noticia</button><button type="button" onClick={() => setEditingArticle(null)}>Cancelar</button></div></form>}
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Noticia</th><th>Categoría</th><th>Acciones</th></tr></thead><tbody>{articles.map((article) => <tr key={article.title}><td><div className="admin-product-cell"><img src={article.image} alt="" /><b>{article.title}</b></div></td><td>{article.category}</td><td><button type="button" className="table-action" onClick={() => { setArticleError(""); setEditingArticle(article); }}>Editar</button><button type="button" className="table-action delete-action" onClick={() => { if (window.confirm(`¿Eliminar "${article.title}"?`)) onDeleteArticle(article.title); }}>Eliminar</button></td></tr>)}</tbody></table></div>
        </div>}

        {section === "Pedidos" && <div className="admin-content"><div className="admin-section-heading"><div><p>Historial local del navegador</p><h2>Pedidos de demostración ({orders.length})</h2></div></div>{orders.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Referencia</th><th>Fecha</th><th>Total</th></tr></thead><tbody>{[...orders].reverse().map((order) => <tr key={order.id}><td>{order.id}</td><td>{new Date(order.date).toLocaleString("es")}</td><td>{formatPrice(order.total)}</td></tr>)}</tbody></table></div> : <p className="admin-empty">Todavía no hay pedidos de prueba.</p>}</div>}

        {section === "Clientes" && <div className="admin-content"><div className="admin-section-heading"><div><p>Perfil almacenado en este navegador</p><h2>Clientes de demostración</h2></div></div>{user ? <div className="admin-panel-card"><h3>{user.name}</h3><p>{user.email}</p><small>Perfil local de demostración. No es una cuenta verificada.</small></div> : <p className="admin-empty">No hay perfiles locales guardados.</p>}</div>}
      </main>
    </div>
  );
}

function App() {
  const [catalog, setCatalog] = useState<Product[]>(() => loadValue("seoul-glow-products", initialProducts));
  const [news, setNews] = useState<Article[]>(() => loadValue("seoul-glow-articles", initialArticles));
  const [cart, setCart] = useState<Cart>(() => loadValue("seoul-glow-cart", {}));
  const [orders, setOrders] = useState<Array<{ id: string; date: string; total: number }>>(() => loadValue("seoul-glow-orders", []));
  const [user, setUser] = useState<User | null>(() => loadValue("seoul-glow-user", null));
  const [favorites, setFavorites] = useState<string[]>(() => loadValue("seoul-glow-favorites", []));
  const [category, setCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  const visibleProducts = useMemo(() => catalog.filter((product) => {
    const matchesCategory = category === "Todos" || product.type === category;
    const matchesSearch = `${product.name} ${product.type} ${product.benefit}`.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  }), [catalog, category, search]);

  const cartProducts = catalog.filter((product) => cart[product.name]);
  const cartCount = Object.values(cart).reduce((sum, amount) => sum + amount, 0);
  const subtotal = cartProducts.reduce((sum, product) => sum + product.price * cart[product.name], 0);
  const shipping = subtotal === 0 || subtotal >= 49 ? 0 : 4.9;

  function handleAdminLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("email") !== "admin@seoulglow.es" || data.get("password") !== "seoulglow-demo") {
      setAdminError("Correo o contraseña de demostración incorrectos.");
      return;
    }
    setAdminError("");
    setAdminLoginOpen(false);
    setAdminMode(true);
  }

  function saveProduct(product: Product, originalName?: string) {
    setCatalog((current) => {
      const next = originalName
        ? current.map((item) => item.name === originalName ? product : item)
        : [...current, product];
      localStorage.setItem("seoul-glow-products", JSON.stringify(next));
      if (originalName && originalName !== product.name) {
        setCart((currentCart) => {
          const nextCart = { ...currentCart };
          if (nextCart[originalName]) {
            nextCart[product.name] = (nextCart[product.name] || 0) + nextCart[originalName];
            delete nextCart[originalName];
            localStorage.setItem("seoul-glow-cart", JSON.stringify(nextCart));
          }
          return nextCart;
        });
        setFavorites((currentFavorites) => {
          const nextFavorites = currentFavorites.map((name) => name === originalName ? product.name : name);
          localStorage.setItem("seoul-glow-favorites", JSON.stringify(nextFavorites));
          return nextFavorites;
        });
      }
      return next;
    });
  }

  function deleteProduct(name: string) {
    setCatalog((current) => {
      const next = current.filter((product) => product.name !== name);
      localStorage.setItem("seoul-glow-products", JSON.stringify(next));
      return next;
    });
    setCart((current) => {
      const next = { ...current };
      delete next[name];
      localStorage.setItem("seoul-glow-cart", JSON.stringify(next));
      return next;
    });
    setFavorites((current) => {
      const next = current.filter((item) => item !== name);
      localStorage.setItem("seoul-glow-favorites", JSON.stringify(next));
      return next;
    });
  }

  function saveArticle(article: Article, originalTitle?: string) {
    setNews((current) => {
      const next = originalTitle
        ? current.map((item) => item.title === originalTitle ? article : item)
        : [...current, article];
      localStorage.setItem("seoul-glow-articles", JSON.stringify(next));
      return next;
    });
  }

  function deleteArticle(title: string) {
    setNews((current) => {
      const next = current.filter((article) => article.title !== title);
      localStorage.setItem("seoul-glow-articles", JSON.stringify(next));
      return next;
    });
  }

  function updateCart(name: string, amount: number) {
    setCart((current) => {
      const quantity = Math.max(0, (current[name] || 0) + amount);
      const next = { ...current };
      if (quantity === 0) delete next[name];
      else next[name] = quantity;
      localStorage.setItem("seoul-glow-cart", JSON.stringify(next));
      return next;
    });
  }

  function toggleFavorite(name: string) {
    setFavorites((current) => {
      const next = current.includes(name) ? current.filter((item) => item !== name) : [...current, name];
      localStorage.setItem("seoul-glow-favorites", JSON.stringify(next));
      return next;
    });
  }

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const profile = { name: String(data.get("name")), email: String(data.get("email")) };
    localStorage.setItem("seoul-glow-user", JSON.stringify(profile));
    setUser(profile);
    setLoginOpen(false);
    setNotice(`¡Hola, ${profile.name.split(" ")[0]}! Tu perfil de demostración está activo.`);
  }

  function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = `SG-${Date.now().toString().slice(-6)}`;
    const nextOrders = [...orders, { id, date: new Date().toISOString(), total: subtotal + shipping }];
    setOrders(nextOrders);
    localStorage.setItem("seoul-glow-orders", JSON.stringify(nextOrders));
    localStorage.setItem("seoul-glow-cart", "{}");
    setCart({});
    setOrderNumber(id);
    setCheckoutOpen(false);
    setCartOpen(false);
  }

  if (adminMode) {
    return <AdminPanel
      products={catalog}
      articles={news}
      orders={orders}
      user={user}
      onExit={() => setAdminMode(false)}
      onSaveProduct={saveProduct}
      onDeleteProduct={deleteProduct}
      onSaveArticle={saveArticle}
      onDeleteArticle={deleteArticle}
    />;
  }

  return (
    <>
      <div className="announcement">ENVÍO GRATIS EN PEDIDOS +49 € <span>·</span> UNA MUESTRA EN CADA PEDIDO</div>
      <header className="site-header">
        <a href="#inicio" className="logo" aria-label="Seoul Glow, inicio"><span><Icon name="sparkle" /></span>SEOUL <b>GLOW</b></a>
        <button className="menu-button" type="button" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? "close" : "menu"} /></button>
        <nav className={menuOpen ? "main-nav nav-open" : "main-nav"} aria-label="Navegación principal">
          {[["Inicio", "inicio"], ["Productos", "productos"], ["Nosotros", "nosotros"], ["Diario", "diario"], ["Contacto", "contacto"]].map(([label, id]) => (
            <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>{label}</a>
          ))}
        </nav>
        <div className="header-actions">
          <a className="account-link" href="#cuenta" onClick={(event) => { event.preventDefault(); setLoginOpen(true); }}>{user ? `Hola, ${user.name.split(" ")[0]}` : "Mi cuenta"}</a>
          <button className="bag-button" type="button" aria-label={`Cesta, ${cartCount} productos`} onClick={() => setCartOpen(true)}><Icon name="bag" />{cartCount > 0 && <span>{cartCount}</span>}</button>
        </div>
      </header>

      {notice && <div className="notice" role="status">{notice}<button type="button" aria-label="Cerrar aviso" onClick={() => setNotice("")}><Icon name="close" /></button></div>}

      <main>
        <section className="hero" id="inicio">
          <div className="hero-copy">
            <p className="eyebrow"><Icon name="sparkle" /> DIRECTO DE SEÚL A TU RITUAL</p>
            <h1>El glow coreano,<br /><em>ahora es tuyo.</em></h1>
            <p className="hero-text">Fórmulas coreanas seleccionadas con criterio, ingredientes transparentes y rutinas que sí encajan contigo.</p>
            <div className="hero-actions"><a href="#productos" className="button button-dark">Descubrir productos <Icon name="arrow" /></a><a href="#servicios" className="text-link">Encuentra tu rutina <span>↗</span></a></div>
            <div className="hero-proof"><div className="avatars"><span>A</span><span>M</span><span>L</span></div><p><b>+2.400 pieles felices</b><br /><span>El cuidado que tu piel merece.</span></p></div>
          </div>
          <div className="hero-visual">
            <img src={photos.hero} alt="Productos coreanos de cuidado facial para una rutina diaria" />
            <div className="made-card"><span>RITUAL DE HOY</span><b>Tu momento<br />de glow</b><small>Hecho para ti · Seúl</small></div>
            <div className="ingredient-card"><span className="ingredient-icon"><Icon name="sparkle" /></span><p><b>Ingredientes que importan</b><br />Centella · Arroz · Té verde</p></div>
          </div>
        </section>

        <section className="benefits" id="servicios" aria-label="Beneficios de Seoul Glow">
          <div><span>01</span><p><b>Selección experta</b><small>Lo mejor de la cosmética coreana</small></p></div>
          <div><span>02</span><p><b>Rutinas conscientes</b><small>Menos pasos, mejores decisiones</small></p></div>
          <div><span>03</span><p><b>Cuidado para todas</b><small>Tu piel, tus necesidades</small></p></div>
        </section>

        <section className="section services-section">
          <div className="section-heading"><div><p className="eyebrow">EL CUIDADO, A TU MANERA</p><h2>Una rutina sencilla.<br /><em>Una piel que se siente bien.</em></h2></div><p>Elige lo que tu piel necesita hoy. Fórmulas que combinan tradición coreana, innovación y cuidado diario.</p></div>
          <div className="service-grid">
            <article className="service-feature"><span className="service-number">01</span><div><Icon name="sparkle" /><h3>Encuentra tu ritual</h3><p>Productos cuidadosamente seleccionados para que crear tu rutina sea fácil y agradable.</p><a href="#productos">Ver la selección <Icon name="arrow" /></a></div></article>
            <article><span className="service-number">02</span><Icon name="heart" /><h3>Ingredientes honestos</h3><p>Te contamos qué contiene cada fórmula y cómo puede acompañar a tu piel.</p><a href="#diario">Conoce más <Icon name="arrow" /></a></article>
            <article><span className="service-number">03</span><Icon name="bag" /><h3>Un detalle en cada pedido</h3><p>Tu compra llega con muestras para descubrir nuevos favoritos.</p><a href="#contacto">Hablemos <Icon name="arrow" /></a></article>
          </div>
        </section>

        <section className="section portfolio" id="productos">
          <div className="section-heading compact"><div><p className="eyebrow">NUESTRA SELECCIÓN</p><h2>Productos para cada<br /><em>momento de tu piel.</em></h2></div><p className="products-intro">Fórmulas coreanas elegidas por su eficacia, textura y respeto por la barrera natural de tu piel.</p></div>
          <div className="catalog-tools">
            <div className="product-filters" aria-label="Filtrar productos">{categories.map((item) => <button type="button" className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div>
            <label className="search-field"><Icon name="search" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar productos" aria-label="Buscar productos" /></label>
          </div>
          <div className="product-grid">
            {visibleProducts.map((product) => (
              <article className="product-card" key={product.name}>
                <div className="product-image"><img src={product.image} alt={product.name} loading="lazy" /><span>{product.tag}</span><button type="button" className={favorites.includes(product.name) ? "favorite-button is-favorite" : "favorite-button"} aria-label={favorites.includes(product.name) ? `Quitar ${product.name} de favoritos` : `Añadir ${product.name} a favoritos`} aria-pressed={favorites.includes(product.name)} onClick={() => toggleFavorite(product.name)}><Icon name="heart" /></button></div>
                <div className="product-info"><div><small>{product.type} · {product.benefit}</small><h3>{product.name}</h3></div><b>{formatPrice(product.price)}</b></div>
                <button className="add-button" type="button" onClick={() => updateCart(product.name, 1)}><Icon name="bag" />{cart[product.name] ? `En la cesta · ${cart[product.name]}` : "Añadir a la cesta"}</button>
              </article>
            ))}
            {visibleProducts.length === 0 && <p className="no-results">No encontramos productos con esa búsqueda. Prueba otro nombre o categoría.</p>}
          </div>
        </section>

        <section className="ritual" id="nosotros">
          <div className="ritual-image"><img src={photos.pink} alt="Productos de cuidado facial seleccionados por Seoul Glow" loading="lazy" /></div>
          <div className="ritual-copy"><p className="eyebrow">NUESTRA HISTORIA</p><h2>Seúl inspira.<br /><em>Tu piel transforma.</em></h2><p>Seoul Glow nació después de un viaje a Corea del Sur y una pregunta sencilla: ¿por qué cuidar la piel tiene que ser complicado? Nuestra misión es acercarte fórmulas coreanas eficaces, transparentes y respetuosas.</p><blockquote>“Seleccionamos cada producto como si fuera para nuestra propia rutina.”</blockquote><a className="button button-light" href="#contacto">Conócenos <Icon name="arrow" /></a></div>
        </section>

        <section className="section journal" id="diario">
          <div className="section-heading compact"><div><p className="eyebrow">DIARIO SEOUL GLOW</p><h2>Aprende a escuchar<br /><em>lo que pide tu piel.</em></h2></div><a className="outline-button" href="#diario">Ver todas las noticias <Icon name="arrow" /></a></div>
          <div className="journal-grid">{news.map((article) => <article key={article.title}><a className="journal-image" href="#contacto"><img src={article.image} alt="" loading="lazy" /></a><small>{article.category} · 5 MIN DE LECTURA</small><h3>{article.title}</h3><a className="read-link" href="#contacto">Leer artículo <Icon name="arrow" /></a></article>)}</div>
        </section>

        <section className="contact section" id="contacto">
          <div><p className="eyebrow">ESTAMOS AQUÍ</p><h2>¿Hablamos de<br /><em>tu piel?</em></h2><p className="contact-note">Cuéntanos qué necesita tu piel y te ayudaremos a encontrar tu ritual.</p><a className="contact-email" href="mailto:hola@seoulglow.es">hola@seoulglow.es <Icon name="arrow" /></a></div>
          <form className="contact-form" onSubmit={(event) => { event.preventDefault(); event.currentTarget.reset(); setNotice("¡Gracias por escribirnos! Este formulario de demostración no envía el mensaje a un servidor."); }}>
            <label htmlFor="contact-name">Nombre</label><input id="contact-name" name="name" placeholder="Tu nombre" autoComplete="name" required minLength={2} />
            <label htmlFor="contact-email">Correo electrónico</label><input id="contact-email" name="email" type="email" placeholder="tu@email.com" autoComplete="email" required />
            <label htmlFor="contact-message">Mensaje</label><textarea id="contact-message" name="message" rows={4} placeholder="Cuéntanos en qué podemos ayudarte" required minLength={10} />
            <button className="button button-dark" type="submit">Enviar mensaje <Icon name="arrow" /></button>
          </form>
        </section>
      </main>

      <footer className="site-footer"><a href="#inicio" className="logo logo-light"><span><Icon name="sparkle" /></span>SEOUL <b>GLOW</b></a><p>Tu piel, tu ritual, tu glow.</p><nav aria-label="Navegación del pie de página"><a href="#productos">Productos</a><a href="#nosotros">Nosotros</a><a href="#diario">Diario</a><a href="#contacto">Contacto</a><button type="button" onClick={() => { setAdminError(""); setAdminLoginOpen(true); }}>Administración</button></nav><small>© 2026 Seoul Glow · Cosmética coreana para tu día a día</small></footer>

      <div className={`drawer-layer ${cartOpen ? "is-open" : ""}`} aria-hidden={!cartOpen}>
        <button className="drawer-overlay" type="button" aria-label="Cerrar carrito" onClick={() => setCartOpen(false)} />
        <aside className="cart-drawer" aria-label="Tu carrito">
          <div className="drawer-header"><div><p className="eyebrow">TU SELECCIÓN</p><h2>Mi carrito <span>({cartCount})</span></h2></div><button type="button" aria-label="Cerrar" onClick={() => setCartOpen(false)}><Icon name="close" /></button></div>
          {cartProducts.length === 0 ? <div className="empty-cart"><Icon name="bag" /><h3>Tu carrito está esperando</h3><p>Descubre nuestra selección y encuentra el ritual perfecto para tu piel.</p><button className="button button-dark" type="button" onClick={() => setCartOpen(false)}>Ver productos <Icon name="arrow" /></button></div> : <>
            <div className="cart-items">{cartProducts.map((product) => <article className="cart-item" key={product.name}><img src={product.image} alt="" /><div><small>{product.type}</small><h3>{product.name}</h3><b>{formatPrice(product.price)}</b><div className="quantity"><button type="button" aria-label={`Quitar una unidad de ${product.name}`} onClick={() => updateCart(product.name, -1)}><Icon name="minus" /></button><span>{cart[product.name]}</span><button type="button" aria-label={`Añadir una unidad de ${product.name}`} onClick={() => updateCart(product.name, 1)}><Icon name="plus" /></button></div></div></article>)}</div>
            <div className="cart-summary"><div className="summary-total"><span>Subtotal</span><b>{formatPrice(subtotal)}</b></div><p>Impuestos incluidos. El envío se calcula en el siguiente paso.</p>{subtotal < 49 ? <div className="shipping-progress"><span style={{ width: `${Math.min(subtotal / 49 * 100, 100)}%` }} /><small>Te faltan {formatPrice(49 - subtotal)} para el envío gratis</small></div> : <p className="free-shipping">¡Tu pedido tiene envío gratis!</p>}<button className="button button-dark checkout-button" type="button" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>Finalizar compra <Icon name="arrow" /></button><button className="continue-button" type="button" onClick={() => setCartOpen(false)}>Seguir comprando</button></div>
          </>}
        </aside>
      </div>

      {loginOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLoginOpen(false); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="login-title"><button className="modal-close" type="button" aria-label="Cerrar" onClick={() => setLoginOpen(false)}><Icon name="close" /></button><p className="eyebrow">MI CUENTA</p><h2 id="login-title">{user ? "Tu perfil" : "Bienvenida a Seoul Glow"}</h2><p className="modal-description">Guarda un perfil local para esta demostración.</p><form className="contact-form" onSubmit={submitLogin}><label htmlFor="profile-name">Nombre</label><input id="profile-name" name="name" required minLength={2} defaultValue={user?.name} placeholder="Tu nombre" /><label htmlFor="profile-email">Correo electrónico</label><input id="profile-email" name="email" type="email" required defaultValue={user?.email} placeholder="tu@email.com" /><button className="button button-dark" type="submit">{user ? "Actualizar perfil" : "Crear perfil"} <Icon name="arrow" /></button></form><small className="demo-note">Esto no crea una cuenta segura ni transmite datos.</small></section></div>}

      {adminLoginOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAdminLoginOpen(false); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="admin-login-title"><button className="modal-close" type="button" aria-label="Cerrar" onClick={() => setAdminLoginOpen(false)}><Icon name="close" /></button><p className="eyebrow">ACCESO ADMINISTRATIVO</p><h2 id="admin-login-title">Panel de tienda</h2><p className="modal-description">Acceso de demostración local. No es una autenticación segura.</p><form className="contact-form" onSubmit={handleAdminLogin}><label htmlFor="admin-email">Correo</label><input id="admin-email" name="email" type="email" autoComplete="username" required placeholder="admin@seoulglow.es" /><label htmlFor="admin-password">Contraseña</label><input id="admin-password" name="password" type="password" autoComplete="current-password" required placeholder="Contraseña de demostración" />{adminError && <p className="admin-error" role="alert">{adminError}</p>}<button className="button button-dark" type="submit">Entrar al panel <Icon name="arrow" /></button></form><small className="demo-note">Credenciales de prueba: admin@seoulglow.es · seoulglow-demo. No uses estas credenciales con datos reales.</small></section></div>}

      {checkoutOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCheckoutOpen(false); }}><section className="modal-card checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title"><button className="modal-close" type="button" aria-label="Cerrar" onClick={() => setCheckoutOpen(false)}><Icon name="close" /></button><p className="eyebrow">ÚLTIMO PASO</p><h2 id="checkout-title">Finaliza tu pedido</h2><div className="checkout-total"><span>{cartCount} productos · Envío {shipping === 0 ? "gratis" : formatPrice(shipping)}</span><b>{formatPrice(subtotal + shipping)}</b></div><form className="contact-form" onSubmit={submitOrder}><label htmlFor="order-name">Nombre completo</label><input id="order-name" name="name" required minLength={2} defaultValue={user?.name} autoComplete="name" placeholder="Tu nombre" /><label htmlFor="order-email">Correo electrónico</label><input id="order-email" name="email" type="email" required defaultValue={user?.email} autoComplete="email" placeholder="tu@email.com" /><label htmlFor="order-address">Dirección de envío</label><input id="order-address" name="address" required autoComplete="street-address" placeholder="Calle y número" /><button className="button button-dark" type="submit">Confirmar pedido de demostración <Icon name="arrow" /></button></form><small className="demo-note">Pedido de prueba: no se procesa ningún pago ni se envían datos.</small></section></div>}

      {orderNumber && <div className="modal-backdrop"><section className="modal-card order-confirmation" role="dialog" aria-modal="true" aria-labelledby="order-title"><p className="eyebrow">PEDIDO REGISTRADO</p><h2 id="order-title">¡Gracias por tu compra!</h2><p>Referencia de demostración: <b>{orderNumber}</b></p><small>No se realizó ningún cobro. El pedido solo se guardó en este navegador.</small><button className="button button-dark" type="button" onClick={() => setOrderNumber("")}>Seguir explorando <Icon name="arrow" /></button></section></div>}
    </>
  );
}

export default App;
