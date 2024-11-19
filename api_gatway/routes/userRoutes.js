const express = require('express');
const axios = require('axios');
const router = express.Router();

// Assuming user service v1 runs on port 3001 and v2 runs on port 3002
const USER_SERVICE_V1_URL = 'http://localhost:3001/api/users';
const USER_SERVICE_V2_URL = 'http://localhost:3002/api/users';

// Route to create a new user (v1 or v2 based on request)
router.post('/', async (req, res) => {
    try {
        const response = await axios.post(USER_SERVICE_V1_URL, req.body); // Default to v1 for now
        res.status(201).json(response.data);
    } catch (error) {
        const statusCode = error.response ? error.response.status : 500;
        const message = error.response ? error.response.data : 'An error occurred while creating user.';
        console.error(error);
        res.status(statusCode).json({ message });
    }
});

// Route to update user email or delivery address (v1 or v2)
router.put('/:userId', async (req, res) => {
    try {
        const response = await axios.put(`${USER_SERVICE_V1_URL}/${req.params.userId}`, req.body); // Default to v1 for now
        res.status(200).json(response.data);
    } catch (error) {
        const statusCode = error.response ? error.response.status : 500;
        const message = error.response ? error.response.data : 'An error occurred while updating user.';
        console.error(error);
        res.status(statusCode).json({ message });
    }
});

// Route to get all users (use v2 for this operation)
router.get('/', async (req, res) => {
    try {
        const response = await axios.get(USER_SERVICE_V2_URL); // v2 service on port 3002
        res.status(200).json(response.data);
    } catch (error) {
        const statusCode = error.response ? error.response.status : 500;
        const message = error.response ? error.response.data : 'An error occurred while fetching users.';
        console.error(error);
        res.status(statusCode).json({ message });
    }
});



// Route to delete a user by ID (use v2 for this operation)
router.delete('/:userId', async (req, res) => {
    try {
        const response = await axios.delete(`${USER_SERVICE_V2_URL}/${req.params.userId}`); // Default to v2 for now
        res.status(200).json(response.data);
    } catch (error) {
        const statusCode = error.response ? error.response.status : 500;
        const message = error.response ? error.response.data : 'An error occurred while deleting user.';
        console.error(error);
        res.status(statusCode).json({ message });
    }
});

// Route to delete all users (use v2 for this operation)
router.delete('/', async (req, res) => {
    try {
        const response = await axios.delete(USER_SERVICE_V2_URL); // Default to v2 for now
        res.status(200).json(response.data);
    } catch (error) {
        const statusCode = error.response ? error.response.status : 500;
        const message = error.response ? error.response.data : 'An error occurred while deleting all users.';
        console.error(error);
        res.status(statusCode).json({ message });
    }
});

module.exports = router;
