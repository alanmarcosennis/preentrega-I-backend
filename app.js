const express = require('express');
const app = express();

const fs = require('fs');


// Middleware para el manejo del cuerpo de las solicitudes en formato JSON
app.use(express.json());

// Ruta raíz GET /products: devuelve todos los productos
app.get('/products', (req, res) => {
  const products = getProductsFromFile();
  res.json(products);
});

// Ruta GET /products/limited: devuelve los primeros N productos según el límite especificado
app.get('/products/limited', (req, res) => {
    const limit = parseInt(req.query.limit);
    const productsData = fs.readFileSync('productos.json', 'utf8');
    const products = JSON.parse(productsData);
    
    if (limit) {
      const limitedProducts = products.slice(0, limit);
      res.json(limitedProducts);
    } else {
      res.json(products);
    }
  });


// Ruta GET /products/:id: devuelve un producto según el ID proporcionado
app.get('/products/:id', (req, res) => {
  const productId = req.params.id;
  const products = getProductsFromFile();
  const product = products.find((p) => p.id === productId);

  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Producto no encontrado' });
  }
});

// Ruta raíz POST /products: agrega un nuevo producto
app.post('/products', (req, res) => {
  const newProduct = req.body;
  const products = getProductsFromFile();
  const productId = generateProductId(products);
  newProduct.id = productId;

  products.push(newProduct);
  saveProductsToFile(products);

  res.status(201).json(newProduct);
});

// Ruta PUT /products/:id: actualiza un producto existente según el ID proporcionado
app.put('/products/:id', (req, res) => {
  const productId = req.params.id;
  const updatedProduct = req.body;
  const products = getProductsFromFile();
  const productIndex = products.findIndex((p) => p.id === productId);

  if (productIndex !== -1) {
    products[productIndex] = { ...products[productIndex], ...updatedProduct };
    saveProductsToFile(products);
    res.json(products[productIndex]);
  } else {
    res.status(404).json({ error: 'Producto no encontrado' });
  }
});

// Ruta DELETE /products/:id: elimina un producto según el ID proporcionado
app.delete('/products/:id', (req, res) => {
  const productId = req.params.id;
  const products = getProductsFromFile();
  const filteredProducts = products.filter((p) => p.id !== productId);

  if (filteredProducts.length < products.length) {
    saveProductsToFile(filteredProducts);
    res.sendStatus(204);
  } else {
    res.status(404).json({ error: 'Producto no encontrado' });
  }
});

// Ruta raíz POST /carts: crea un nuevo carrito
app.post('/carts', (req, res) => {
  const newCart = { id: generateCartId(), products: [] };
  saveCartToFile(newCart);
  res.status(201).json(newCart);
});

// Ruta GET /carts/:id: lista los productos de un carrito según el ID proporcionado
app.get('/carts/:id', (req, res) => {
  const cartId = req.params.id;
  const cart = getCartFromFile(cartId);

  if (cart) {
    res.json(cart.products);
  } else {
    res.status(404).json({ error: 'Carrito no encontrado' });
  }
});

// Ruta POST /carts/:id/product/:productId: agrega un producto al carrito según el ID del carrito y del producto
app.post('/carts/:id/product/:productId', (req, res) => {
  const cartId = req.params.id;
  const productId = req.params.productId;
  const cart = getCartFromFile(cartId);

  if (cart) {
    const products = getProductsFromFile();
    const product = products.find((p) => p.id === productId);

    if (product) {
      const existingProduct = cart.products.find((p) => p.product === productId);

      if (existingProduct) {
        existingProduct.quantity++;
      } else {
        cart.products.push({ product: productId, quantity: 1 });
      }

      saveCartToFile(cart);
      res.json(cart);
    } else {
      res.status(404).json({ error: 'Producto no encontrado' });
    }
  } else {
    res.status(404).json({ error: 'Carrito no encontrado' });
  }
});

// Función para leer los productos desde el archivo productos.json
function getProductsFromFile() {
  const productsData = fs.readFileSync('productos.json', 'utf-8');
  return JSON.parse(productsData);
}

// Función para guardar los productos en el archivo productos.json
function saveProductsToFile(products) {
  fs.writeFileSync('productos.json', JSON.stringify(products, null, 2), 'utf-8');
}

// Función para generar un ID único para un nuevo producto
function generateProductId(products) {
  const existingIds = new Set(products.map((p) => p.id));
  let newId = Math.floor(Math.random() * 1000);

  while (existingIds.has(newId)) {
    newId = Math.floor(Math.random() * 1000);
  }

  return newId;
}

// Función para guardar un carrito en el archivo carrito.json
function saveCartToFile(cart) {
  fs.writeFileSync(`carrito_${cart.id}.json`, JSON.stringify(cart, null, 2), 'utf-8');
}

// Función para leer un carrito desde el archivo carrito.json
function getCartFromFile(cartId) {
  try {
    const cartData = fs.readFileSync(`carrito_${cartId}.json`, 'utf-8');
    return JSON.parse(cartData);
  } catch (error) {
    return null;
  }
}

// Función para generar un ID único para un nuevo carrito
function generateCartId() {
  const existingCarts = fs.readdirSync('./').filter((file) => file.startsWith('carrito_'));
  let newId = Math.floor(Math.random() * 1000);

  while (existingCarts.includes(`carrito_${newId}.json`)) {
    newId = Math.floor(Math.random() * 1000);
  }

  return newId;
}


const PORT = 8080;


// Inicio del servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
