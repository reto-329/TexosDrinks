const Joi = require('joi');

const addToCartSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().positive().min(1).default(1)
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().positive().min(1).required()
});

module.exports = {
  addToCartSchema,
  updateCartItemSchema
};