const { query } = require('../config/db');

const createCategory = async (name, description, icon = null) => {
  const result = await query(
    'INSERT INTO categories (name, description, icon) VALUES ($1, $2, $3) RETURNING *',
    [name, description, icon]
  );
  return result.rows[0];
};

const getAllCategories = async () => {
  const result = await query('SELECT * FROM categories ORDER BY name');
  return result.rows;
};

const getCategoryById = async (id) => {
  const result = await query('SELECT * FROM categories WHERE id = $1', [id]);
  return result.rows[0];
};

const updateCategory = async (id, name, description, icon = null) => {
  const result = await query(
    'UPDATE categories SET name = $1, description = $2, icon = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
    [name, description, icon, id]
  );
  return result.rows[0];
};

const deleteCategory = async (id) => {
  await query('DELETE FROM categories WHERE id = $1', [id]);
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};