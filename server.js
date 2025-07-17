require('dotenv').config();
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paystackRoutes = require('./routes/paystackRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const adminOrderRoutes = require('./routes/adminOrderRoutes');
const adminSettingsRoutes = require('./routes/adminSettingsRoutes');
const upload = require('./middlewares/upload');
const jwt = require('jsonwebtoken');
const { getUserById } = require('./models/userModel');
const { adminProtect, protect } = require('./middlewares/auth');
const nocache = require('./middlewares/nocache');
const { getAllCategories, getCategoryById } = require('./models/categoryModel');
const { getAllProducts, getProductsByCategory } = require('./models/productModel');
const { getEditProduct, updateProductAjax, deleteProductAjax, getAllProductsPage, getProductDetailsPage } = require('./controllers/productController');
const uploadMiddleware = require('./middlewares/upload');
const userProductRoutes = require('./routes/userProductRoutes');
const csrf = require('csurf')({ 
  cookie: true, 
  value: (req) => {
    // Check for token in headers first (for AJAX requests)
    if (req.headers['x-csrf-token']) {
      return req.headers['x-csrf-token'];
    }
    // Then check in the body (for form submissions)
    if (req.body && req.body._csrf) {
      return req.body._csrf;
    }
    // Finally check in query parameters
    if (req.query && req.query._csrf) {
      return req.query._csrf;
    }
    return null;
  }
});
const addressBookRoutes = require('./routes/addressBookRoutes');

const app = express();

// Set views directory path
app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "ejs");

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// Static files middleware (if you have public directory)
app.use(express.static(path.join(__dirname, 'public')));

app.use(async (req, res, next) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await getUserById(decoded.id);
            res.locals.user = user;
            req.user = user;
        } catch (err) {
            console.error('Token verification failed:', err);
        }
    }
    next();
});

// Exclude authentication, cart, address book, and API endpoints from CSRF protection
const csrfExcluded = [
    '/api/users/login', 
    '/api/users/register', 
    '/api/users/logout',
    '/api/users/request-otp', // Exclude OTP request from CSRF protection
    '/api/users/verify-otp', // Exclude OTP verification from CSRF protection
    '/api/users/profile', // Exclude profile update from CSRF protection
    '/api/users/change-password', // Exclude password change from CSRF protection
    '/api/users/forgot-password', // Exclude forgot password from CSRF protection
    '/api/users/verify-reset-otp', // Exclude reset OTP verification from CSRF protection
    '/api/users/reset-password', // Exclude password reset from CSRF protection
    '/api/admin/logout',
    '/api/cart',
    '/api/paystack/webhook', // Exclude Paystack webhook from CSRF protection
    '/cart',
    '/address-book',
    '/api/products/productCreate'
];

// Make sure all cart API endpoints are excluded from CSRF protection
app.use((req, res, next) => {
    if (req.path.startsWith('/api/cart/')) {
        csrfExcluded.push(req.path);
    }
    next();
});
app.use((req, res, next) => {
    // Exclude paths in the list or any cart API endpoints or address book paths
    if (csrfExcluded.includes(req.path) || req.path.startsWith('/api/cart') || req.path.startsWith('/address-book')) {
        return next();
    } else {
        // Apply CSRF protection
        return csrf(req, res, (err) => {
            if (err) {
                // Log the error for debugging
                console.error('CSRF Error:', err.message, 'Path:', req.path, 'Method:', req.method);
                
                // For AJAX requests, return a JSON error
                if (req.xhr || req.headers.accept?.includes('application/json')) {
                    return res.status(403).json({ error: 'CSRF token validation failed' });
                }
                
                // For regular requests, redirect to an error page or back to the form
                return res.status(403).render('error', { 
                    message: 'CSRF token validation failed. Please try again.',
                    error: { status: 403 },
                    user: res.locals.user || null
                });
            }
            next();
        });
    }
});

// Add CSRF protection middleware (must be after CSRF middleware)
const csrfProtection = require('./middlewares/csrfProtection');
app.use(csrfProtection);

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/paystack', paystackRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/admin', adminSettingsRoutes);

// User Product Routes
app.use('/', userProductRoutes);

// Address Book Routes
app.use('/address-book', addressBookRoutes);

// View Routes
app.get("/", async (req, res) => {
    try {
        // Get the latest 6 products
        const { getAllProducts } = require('./models/productModel');
        const db = require('./config/db');
        const allProducts = await getAllProducts();
        const latestProducts = allProducts.slice(0, 6);
        
        // Add image URLs to each product
        for (const product of latestProducts) {
            const result = await db.query(
                'SELECT image_url FROM product_images WHERE product_id = $1 LIMIT 1',
                [product.id]
            );
            product.image_url = result.rows[0]?.image_url || '';
        }
        
        res.render("index", { 
            user: res.locals.user || null,
            latestProducts: latestProducts
        });
    } catch (error) {
        console.error('Error fetching latest products:', error);
        res.render("index", { user: res.locals.user || null, latestProducts: [] });
    }
});

// Products listing and details (EJS)
app.get('/products', getAllProductsPage);
app.get('/products/:id', getProductDetailsPage);




app.get("/about", (req, res) => {
    res.render("about", { user: res.locals.user || null });
});

app.get("/contact", (req, res) => {
    res.render("contact", { user: res.locals.user || null });
});

app.get("/cart", async (req, res) => {
    try {
        // If user is logged in, fetch their cart data
        if (req.user) {
            const { getOrCreateCart, getCartItems, calculateCartTotals } = require('./models/cartModel');
            const cart = await getOrCreateCart(req.user.id);
            const items = await getCartItems(cart.id);
            const totals = await calculateCartTotals(items);
            
            return res.render("cart", { 
                user: req.user, 
                cart: {
                    cartId: cart.id,
                    items,
                    ...totals
                },
                FREE_DELIVERY_THRESHOLD: totals.freeDeliveryThreshold // Use the value from settings
            });
        }
        
        // For guest users, pass null cart
        res.render("cart", { user: res.locals.user || null, cart: null });
    } catch (error) {
        console.error('Error fetching cart for view:', error);
        res.render("cart", { user: res.locals.user || null, cart: null, error: 'Failed to load cart data' });
    }
});

app.get("/login", (req, res) => {
    res.render("login", { user: res.locals.user || null, message: req.query.message });
});

app.get("/forgot-password", (req, res) => {
    res.render("forgot-password", { user: res.locals.user || null, message: req.query.message });
});

app.get("/reset-password", (req, res) => {
    const { email, token } = req.query;
    if (!email || !token) {
        return res.redirect('/forgot-password?message=Invalid or expired reset link');
    }
    res.render("reset-password", { user: res.locals.user || null, email, token });
});

app.get("/register", (req, res) => {
    res.render("register", { user: res.locals.user || null });
});

app.get("/dashboard", nocache, async (req, res) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    
    // Get the user's default address
    const addressBookModel = require('./models/addressBookModel');
    let defaultAddress = null;
    
    try {
        const addresses = await addressBookModel.getUserAddresses(req.user.id);
        defaultAddress = addresses.find(addr => addr.is_default === true);
    } catch (error) {
        console.error('Error fetching default address:', error);
    }
    
    // Get the user's order count
    const { getUserOrderCount } = require('./models/orderModel');
    let orderCount = 0;
    
    try {
        orderCount = await getUserOrderCount(req.user.id);
    } catch (error) {
        console.error('Error fetching user order count:', error);
    }
    
    res.render("dashboard", { 
        user: req.user,
        defaultAddress: defaultAddress,
        orderCount: orderCount
    });
});

// Edit Profile page
app.get("/edit-profile", nocache, async (req, res) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    
    // Get the user's order count for sidebar
    const { getUserOrderCount } = require('./models/orderModel');
    let orderCount = 0;
    
    try {
        orderCount = await getUserOrderCount(req.user.id);
    } catch (error) {
        console.error('Error fetching user order count:', error);
    }
    
    res.render("edit-profile", { 
        user: req.user,
        orderCount: orderCount
    });
});

// Settings page
app.get("/settings", nocache, async (req, res) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    
    // Get the user's order count for sidebar
    const { getUserOrderCount } = require('./models/orderModel');
    let orderCount = 0;
    
    try {
        orderCount = await getUserOrderCount(req.user.id);
    } catch (error) {
        console.error('Error fetching user order count:', error);
    }
    
    res.render("settings", { 
        user: req.user,
        orderCount: orderCount
    });
});

// Payment Methods page
app.get("/payment-methods", nocache, async (req, res) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    
    // Get the user's order count for sidebar
    const { getUserOrderCount } = require('./models/orderModel');
    let orderCount = 0;
    
    try {
        orderCount = await getUserOrderCount(req.user.id);
    } catch (error) {
        console.error('Error fetching user order count:', error);
    }
    
    res.render("payment-methods", { 
        user: req.user,
        orderCount: orderCount
    });
});

// Change Password page
app.get("/change-password", nocache, async (req, res) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    
    // Get the user's order count for sidebar
    const { getUserOrderCount } = require('./models/orderModel');
    let orderCount = 0;
    
    try {
        orderCount = await getUserOrderCount(req.user.id);
    } catch (error) {
        console.error('Error fetching user order count:', error);
    }
    
    res.render("change-password", { 
        user: req.user,
        orderCount: orderCount
    });
});

// My Orders page
app.get("/my-orders", nocache, async (req, res) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    
    // Get the user's order count
    const { getUserOrderCount } = require('./models/orderModel');
    let orderCount = 0;
    
    try {
        orderCount = await getUserOrderCount(req.user.id);
    } catch (error) {
        console.error('Error fetching user order count:', error);
    }
    
    res.render("my-orders", { 
        user: req.user,
        orderCount: orderCount
    });
});

// My Orders page
app.get("/my-orders", nocache, async (req, res) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    
    // Get the user's order count
    const { getUserOrderCount } = require('./models/orderModel');
    let orderCount = 0;
    
    try {
        orderCount = await getUserOrderCount(req.user.id);
    } catch (error) {
        console.error('Error fetching user order count:', error);
    }
    
    // Render the page without pre-loading orders
    // Orders will be loaded via AJAX with pagination
    res.render("my-orders", { 
        user: req.user,
        orders: [], // Empty array as orders will be loaded client-side
        orderCount: orderCount
    });
});

// Order Details page
app.get("/orders/:id", nocache, async (req, res) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    
    try {
        const { getOrderById, getUserOrderCount } = require('./models/orderModel');
        const { getTransactionByOrderId } = require('./services/paystackService');
        const { getAddressById } = require('./models/addressBookModel');
        
        const orderDetails = await getOrderById(req.params.id);
        
        // Check if order belongs to user
        if (orderDetails.order.user_id !== req.user.id) {
            return res.status(403).render('error', { 
                message: 'You do not have permission to view this order',
                error: { status: 403 },
                user: req.user
            });
        }
        
        // Get transaction if exists
        let transaction = null;
        try {
            transaction = await getTransactionByOrderId(req.params.id);
        } catch (err) {
            console.log('No transaction found for order');
        }
        
        // Get address if exists
        let address = null;
        if (orderDetails.order.address_id) {
            try {
                address = await getAddressById(orderDetails.order.address_id);
            } catch (err) {
                console.log('No address found for order');
            }
        }
        
        // Get the user's order count
        let orderCount = 0;
        try {
            orderCount = await getUserOrderCount(req.user.id);
        } catch (error) {
            console.error('Error fetching user order count:', error);
        }
        
        res.render("order-details", { 
            user: req.user,
            order: orderDetails.order,
            items: orderDetails.items,
            transaction: transaction,
            address: address,
            orderCount: orderCount
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(404).render('error', { 
            message: 'Order not found',
            error: { status: 404 },
            user: req.user
        });
    }
});

// Import order controller functions
const { getCheckoutPage, verifyPayment } = require('./controllers/orderController');

// Checkout page
app.get("/checkout", nocache, getCheckoutPage);

// Payment verification page
app.get("/payment/verify/:reference", nocache, protect, verifyPayment);

// Admin View Routes
app.get("/adminLogin", (req, res) => {
    res.render("admin/adminLogin");
});

// Admin dashboard route
app.get("/admin/dashboard", adminProtect, async (req, res) => {
    try {
        // Get total product count
        const products = await getAllProducts();
        const productCount = Array.isArray(products) ? products.length : 0;
        
        // Get total category count
        const categories = await getAllCategories();
        const categoryCount = Array.isArray(categories) ? categories.length : 0;
        
        // Get total order count
        const { getOrderCount } = require('./models/orderModel');
        const orderCount = await getOrderCount();
        
        console.log('Dashboard counts:', { productCount, categoryCount, orderCount });
        
        res.render("admin/adminDashboard", {
            admin: req.admin || null,
            productCount,
            categoryCount,
            orderCount,
            page: 'dashboard'
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.render("admin/adminDashboard", {
            admin: req.admin || null,
            productCount: '--',
            categoryCount: '--',
            orderCount: '--',
            page: 'dashboard'
        });
    }
});

// Admin categories view
app.get('/admin/categories', adminProtect, async (req, res) => {
  const categories = await getAllCategories();
  const products = await getAllProducts();
  res.render('admin/categories', {
    admin: req.admin || null,
    categories,
    totalProducts: products.length
  });
});

// Admin products view
app.get('/admin/products', adminProtect, nocache, async (req, res) => {
  const categories = await getAllCategories();
  // For each category, get the product count
  const categoriesWithCount = await Promise.all(
    categories.map(async (category) => {
      const products = await getProductsByCategory(category.id || category._id);
      return {
        ...category,
        productCount: products.length
      };
    })
  );
  res.render('admin/adminProducts', {
    admin: req.admin || null,
    categories: categoriesWithCount,
    page: 'products'
  });
});

// Admin products by category view
app.get('/admin/products/category/:categoryId', adminProtect, async (req, res) => {
  const categoryId = req.params.categoryId;
  const category = await getCategoryById(categoryId);
  const products = await getProductsByCategory(categoryId);
  res.render('admin/productsList', {
    admin: req.admin || null,
    category,
    products
  });
});

// Admin orders page
app.get("/admin/orders", adminProtect, (req, res) => {
    res.render("admin/orders", { admin: req.admin || null });
});

// Admin users page
app.get("/admin/users", adminProtect, (req, res) => {
    res.render("admin/users", { admin: req.admin || null, page: 'users' });
});

// Admin users API endpoint
app.get("/admin/api/users", adminProtect, async (req, res) => {
    try {
        const { getAllUsers } = require('./models/userModel');
        const users = await getAllUsers();
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

// Admin delete user endpoint
app.delete("/admin/api/users/:id", adminProtect, async (req, res) => {
    try {
        const { deleteUser } = require('./models/userModel');
        const userId = req.params.id;
        
        await deleteUser(userId);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
});

// Admin order detail page
app.get("/admin/orders/:id", adminProtect, async (req, res) => {
    try {
        const { getOrderById } = require('./models/orderModel');
        const { getAllOrderStatuses } = require('./models/orderModel');
        
        const orderDetails = await getOrderById(req.params.id);
        const statuses = await getAllOrderStatuses();
        
        // Get user details
        const { query } = require('./config/db');
        const userResult = await query('SELECT id, username, email FROM users WHERE id = $1', [orderDetails.order.user_id]);
        
        // Get address details if exists
        let address = null;
        if (orderDetails.order.address_id) {
            const { getAddressById } = require('./models/addressBookModel');
            address = await getAddressById(orderDetails.order.address_id);
        }
        
        res.render("admin/order-detail", { 
            admin: req.admin || null,
            order: orderDetails.order,
            items: orderDetails.items,
            user: userResult.rows[0],
            address,
            statuses
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(404).send('Order not found');
    }
});

// Admin AJAX edit/delete routes for popup
app.get('/admin/products/edit/:id', adminProtect, getEditProduct);
app.post('/admin/products/edit/:id', adminProtect, uploadMiddleware.single('image'), updateProductAjax);
app.delete('/admin/products/delete/:id', adminProtect, deleteProductAjax);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
