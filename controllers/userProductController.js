const { getUserProducts } = require('../models/userProductModel');
const { getAllCategories } = require('../models/categoryModel');
const { getProductById } = require('../models/productModel');
const { query } = require('../config/db');

// Function to get overall stats
const getStats = async () => {
    const totalProductsResult = await query('SELECT COUNT(*) FROM products');
    const totalCategoriesResult = await query('SELECT COUNT(*) FROM categories');
    return {
        totalProducts: parseInt(totalProductsResult.rows[0].count, 10),
        categories: parseInt(totalCategoriesResult.rows[0].count, 10),
    };
};

exports.renderUserProducts = async (req, res) => {
    try {
        const { search, category, sort, price } = req.query;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 6;

        const options = { search, category, sort, price, page, limit };
        
        const [{ products, total }, categories, stats] = await Promise.all([
            getUserProducts(options),
            getAllCategories(),
            getStats()
        ]);

        const totalPages = Math.ceil(total / limit);

        res.render('products', {
            user: req.user || null,
            products: products.map(p => ({ ...p, categoryName: p.category_name, inStock: p.stock > 0 })),
            categories,
            totalPages,
            currentPage: page,
            totalProducts: total,
            stats,
            query: req.query,
            limit: limit
        });
    } catch (error) {
        console.error('Error rendering user products:', error);
        res.status(500).render('products', { 
            user: req.user || null, 
            products: [], 
            categories: [],
            totalPages: 1, 
            currentPage: 1, 
            totalProducts: 0,
            stats: { totalProducts: 0, categories: 0 },
            query: req.query,
            error: 'Could not load products.' 
        });
    }
};

exports.renderProductDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await getProductById(id);

        if (!product) {
            return res.status(404).render('productDetails', { 
                user: req.user || null, 
                product: null, 
                notFound: true 
            });
        }

        // Normalize images to a simple array of URLs
        const images = (product.images && product.images.length > 0 && product.images[0] !== null)
            ? product.images.map(img => img.url)
            : [];

        res.render('productDetails', {
            user: req.user || null,
            product: {
                ...product,
                images,
                categoryName: product.category_name,
                inStock: product.stock > 0,
            },
            notFound: false
        });
    } catch (error) {
        console.error('Error rendering product details:', error);
        res.status(500).render('productDetails', { 
            user: req.user || null, 
            product: null, 
            notFound: true, 
            error: 'Could not load product details.' 
        });
    }
};
