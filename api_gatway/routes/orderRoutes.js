const express = require('express');
const axios = require('axios');
const router = express.Router();

// Assuming your order service runs on port 3003, as per your order service code
const ORDER_SERVICE_URL = 'http://localhost:3003/api/orders';

// Route to create a new order
router.post('/', async (req, res) => {
    try {
        const response = await axios.post(ORDER_SERVICE_URL, req.body);
        res.status(201).json(response.data); // Return the created order response
    } catch (error) {
        // Enhanced error handling
        if (error.response) {
            // If error.response is available, use its status and data
            res.status(error.response.status).json(error.response.data);
        } else {
            // Otherwise, handle a generic error
            console.error(error); // Log the error for debugging
            res.status(500).json({ message: 'An unexpected error occurred while creating the order.' });
        }
    }
});

// Route to update order status or other fields (email, deliveryAddress)
router.put('/:orderId', async (req, res) => {
    try {
        const response = await axios.put(`${ORDER_SERVICE_URL}/${req.params.orderId}`, req.body);
        res.status(200).json(response.data); // Return the updated order response
    } catch (error) {
        // Enhanced error handling
        if (error.response) {
            // If error.response is available, use its status and data
            res.status(error.response.status).json(error.response.data);
        } else {
            // Otherwise, handle a generic error
            console.error(error); // Log the error for debugging
            res.status(500).json({ message: 'An unexpected error occurred while updating the order.' });
        }
    }
});

// Route to fetch all orders
router.get('/', async (req, res) => {
    try {
        const response = await axios.get(ORDER_SERVICE_URL);
        res.status(200).json(response.data); // Return all orders
    } catch (error) {
        // Enhanced error handling
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            console.error(error);
            res.status(500).json({ message: 'An unexpected error occurred while fetching orders.' });
        }
    }
});

module.exports = router;
