// api-gateway/routes/userRoutes.js

const express = require('express');
const axios = require('axios');
const router = express.Router();

// Assuming your user service runs on port 3001
const USER_SERVICE_URL = 'http://localhost:3001/api/users';

// Route to create a new user
router.post('/', async (req, res) => {
    try {
        const response = await axios.post(USER_SERVICE_URL, req.body);
        res.status(201).json(response.data);
    } catch (error) {
        // Enhanced error handling
        const statusCode = error.response ? error.response.status : 500; // Default to 500 if no response
        const message = error.response ? error.response.data : 'An error occurred while creating user.';
        
        console.error(error); // Log the entire error object for debugging
        res.status(statusCode).json({ message });
    }
});

// Route to update user email or delivery address
router.put('/:userId', async (req, res) => {
    try {
        const response = await axios.put(`${USER_SERVICE_URL}/${req.params.userId}`, req.body);
        res.status(200).json(response.data);
    } catch (error) {
        // Enhanced error handling
        const statusCode = error.response ? error.response.status : 500; // Default to 500 if no response
        const message = error.response ? error.response.data : 'An error occurred while updating user.';
        
        console.error(error); // Log the entire error object for debugging
        res.status(statusCode).json({ message });
    }
});

module.exports = router;
