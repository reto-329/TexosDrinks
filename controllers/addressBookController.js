const addressBookModel = require('../models/addressBookModel');

// Enhanced validation helper
function validateAddress(data) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    errors.push('Invalid address data');
    return errors;
  }
  
  // Name validation
  if (!data.first_name || data.first_name.trim() === '') {
    errors.push('First name is required');
  } else if (data.first_name.length > 50) {
    errors.push('First name must be less than 50 characters');
  }

  if (!data.last_name || data.last_name.trim() === '') {
    errors.push('Last name is required');
  } else if (data.last_name.length > 50) {
    errors.push('Last name must be less than 50 characters');
  }

  // Enhanced phone validation
  if (!data.phone || data.phone.trim() === '') {
    errors.push('Phone number is required');
  } else {
    const phoneRegex = /^0[0-9]{10}$/;
    if (!phoneRegex.test(data.phone)) {
      errors.push('Phone number must be 11 digits starting with 0 (e.g., 08012345678)');
    }
  }

  // Additional phone validation (optional)
  if (data.additional_phone && data.additional_phone.trim() !== '') {
    const additionalPhoneRegex = /^0[0-9]{10}$/;
    if (!additionalPhoneRegex.test(data.additional_phone)) {
      errors.push('Additional phone must be 11 digits starting with 0 (e.g., 08012345678)');
    }
  }

  // Address validation
  if (!data.street || data.street.trim() === '') {
    errors.push('Street address is required');
  } else if (data.street.length > 255) {
    errors.push('Street address must be less than 255 characters');
  }

  if (data.additional_info && data.additional_info.length > 255) {
    errors.push('Additional information must be less than 255 characters');
  }

  // Location validation
  if (!data.city || data.city.trim() === '') {
    errors.push('City is required');
  } else if (data.city.length > 100) {
    errors.push('City must be less than 100 characters');
  }

  if (!data.state || data.state.trim() === '') {
    errors.push('State is required');
  } else if (data.state.length > 100) {
    errors.push('State must be less than 100 characters');
  }

  if (!data.country || data.country.trim() === '') {
    errors.push('Country is required');
  } else if (data.country.length > 100) {
    errors.push('Country must be less than 100 characters');
  }

  if (!data.zip || data.zip.trim() === '') {
    errors.push('ZIP code is required');
  } else if (data.zip.length > 20) {
    errors.push('ZIP code must be less than 20 characters');
  }

  return errors;
}

// POST /address-book (create address)
exports.createAddress = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user.id;
    
    if (!req.body) {
      return res.status(400).json({ message: 'No data provided' });
    }
    
    const data = { ...req.body };
    
    // Handle is_default properly
    data.is_default = data.is_default === 'on' || data.is_default === true || data.is_default === 'true';

    // Validate
    const errors = validateAddress(data);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Enforce max 5 addresses
    const count = await addressBookModel.countUserAddresses(userId);
    if (count >= 5) {
      return res.status(400).json({ errors: ['Maximum 5 addresses allowed'] });
    }

    // If setting as default, unset previous default
    if (data.is_default) {
      await addressBookModel.unsetDefaultAddress(userId);
    }

    // Insert
    const address = await addressBookModel.createAddress(userId, data);
    res.status(201).json({ address });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({ 
      message: 'Server error while creating address',
      error: error.message 
    });
  }
};

// GET /address-book/:id (get address)
exports.getAddress = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user.id;
    const addressId = req.params.id;
    
    const address = await addressBookModel.getAddressById(addressId, userId);
    
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    res.json(address);
  } catch (error) {
    console.error('Error fetching address:', error);
    res.status(500).json({ 
      message: 'Server error while fetching address',
      error: error.message 
    });
  }
};

// DELETE /address-book/:id (delete address)
exports.deleteAddress = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user.id;
    const addressId = req.params.id;
    
    const address = await addressBookModel.deleteAddress(addressId, userId);
    
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ 
      message: 'Server error while deleting address',
      error: error.message 
    });
  }
};

// PUT /address-book/:id (update address)
exports.updateAddress = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user.id;
    const addressId = req.params.id;
    
    if (!req.body) {
      return res.status(400).json({ message: 'No data provided' });
    }
    
    const data = { ...req.body };
    
    // Handle is_default properly
    data.is_default = data.is_default === 'on' || data.is_default === true || data.is_default === 'true';

    // Validate
    const errors = validateAddress(data);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Check if address exists and belongs to user
    const existingAddress = await addressBookModel.getAddressById(addressId, userId);
    if (!existingAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // If setting as default, unset previous default
    if (data.is_default) {
      await addressBookModel.unsetDefaultAddress(userId);
    }

    // Update address
    const address = await addressBookModel.updateAddress(addressId, userId, data);
    res.json({ 
      message: 'Address updated successfully', 
      address 
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ 
      message: 'Server error while updating address',
      error: error.message 
    });
  }
};

// GET /address-book (render address book page)
exports.getAddresses = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).render('error', { 
        message: 'User not authenticated',
        user: null
      });
    }
    
    const addresses = await addressBookModel.getUserAddresses(req.user.id);
    res.render('addressBook', { 
      user: req.user, 
      addresses: addresses 
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).render('error', { 
      message: 'Server error while fetching addresses',
      user: req.user || null
    });
  }
};

// PUT /address-book/:id/default (set address as default)
exports.setDefaultAddress = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user.id;
    const addressId = req.params.id;
    
    const address = await addressBookModel.setDefaultAddress(addressId, userId);
    
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    res.json({ 
      message: 'Default address updated successfully', 
      address 
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({ 
      message: 'Server error while setting default address',
      error: error.message 
    });
  }
};