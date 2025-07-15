// models/userProductModel.js
const { query } = require('../config/db');

/**
 * Fetch products for user-facing page with optional filters, search, and sorting.
 * @param {Object} options - { search, category, sort, price, page, limit }
 */
async function getUserProducts(options = {}) {
    const { search, category, sort, price, page = 1, limit = 12 } = options;
    
    let sql = `
        SELECT 
            p.*, 
            c.name as category_name,
            (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY created_at ASC LIMIT 1) as image_url
        FROM products p
        JOIN categories c ON p.category_id = c.id
    `;
    
    const where = [];
    const params = [];
    let paramIndex = 1;

    if (search) {
        where.push(`(LOWER(p.name) LIKE $${paramIndex} OR LOWER(p.description) LIKE $${paramIndex})`);
        params.push(`%${search.toLowerCase()}%`);
        paramIndex++;
    }

    if (category && category !== 'all') {
        where.push(`c.id = $${paramIndex}`);
        params.push(category);
        paramIndex++;
    }

    if (price) {
        where.push(`p.price <= $${paramIndex}`);
        params.push(price);
        paramIndex++;
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    
    // Build the count query first before adding sorting and pagination
    const countSql = `SELECT COUNT(*) FROM products p JOIN categories c ON p.category_id = c.id ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Sorting
    let orderBy = 'ORDER BY p.name ASC'; // Default sort
    switch (sort) {
        case 'priceLow':
            orderBy = 'ORDER BY p.price ASC';
            break;
        case 'priceHigh':
            orderBy = 'ORDER BY p.price DESC';
            break;
        case 'newest':
            orderBy = 'ORDER BY p.created_at DESC';
            break;
        case 'name':
        default:
            orderBy = 'ORDER BY p.name ASC';
            break;
    }

    // Pagination
    const offset = (page - 1) * limit;
    const paginationSql = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const finalSql = `${sql} ${whereClause} ${orderBy} ${paginationSql}`;
    
    const result = await query(finalSql, params);
    
    return { products: result.rows, total };
}

module.exports = { getUserProducts };

