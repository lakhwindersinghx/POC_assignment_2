// api-gateway/routes/orderRoutes.js

const express = require('express');
const axios = require('axios');
const router = express.Router();

// Assuming your order service runs on port 3002
const ORDER_SERVICE_URL = 'http://localhost:3002/api/orders';

// Route to create a new order
router.post('/', async (req, res) => {
    try {
        const response = await axios.post(ORDER_SERVICE_URL, req.body);
        res.status(201).json(response.data);
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

// Route to update order status
router.put('/:orderId', async (req, res) => {
    try {
        const response = await axios.put(`${ORDER_SERVICE_URL}/${req.params.orderId}`, req.body);
        res.status(200).json(response.data);
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

// Additional routes can be defined similarly...

module.exports = router;
