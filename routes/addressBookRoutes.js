const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const addressBookController = require('../controllers/addressBookController');
const multer = require('multer');
const upload = multer();

// Render the address book page for the logged-in user
router.get('/', protect, addressBookController.getAddresses);

// Create a new address
router.post('/', protect, upload.none(), addressBookController.createAddress);

// Get a specific address
router.get('/:id', protect, addressBookController.getAddress);

// Update an address
router.put('/:id', protect, upload.none(), addressBookController.updateAddress);

// Delete an address
router.delete('/:id', protect, addressBookController.deleteAddress);

// Set address as default
router.put('/:id/default', protect, addressBookController.setDefaultAddress);

module.exports = router;