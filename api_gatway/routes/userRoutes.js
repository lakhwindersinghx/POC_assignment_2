const express = require('express');
const axios = require('axios');
const fs = require('fs');
const router = express.Router();

// Assuming user service v1 runs on port 3001 and v2 runs on port 3002
const USER_SERVICE_V1_URL = 'http://user-service:3001/api/users';
const USER_SERVICE_V2_URL = 'http://user-service-v2:3002/api/users';

// Load the configuration file to get the percentage for routing requests to v1 or v2
const configPath = 'config.json';
let config;
if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} else {
    console.error('Config file "config.json" is missing. Please ensure it exists.');
    process.exit(1);
}

// Helper function to decide whether to route to v1 or v2 based on the percentage
function getServiceUrl() {
    const random = Math.random() * 100;
    return random <= config.p ? USER_SERVICE_V1_URL : USER_SERVICE_V2_URL;
}

// Route to create a new user (v1 or v2 based on request)
router.post('/', async (req, res) => {
    try {
        const targetUrl = getServiceUrl(); // Route to either v1 or v2 based on percentage
        const version = targetUrl === USER_SERVICE_V1_URL ? 'v1' : 'v2';
        console.log(`Routing POST request to ${version}`);

        const response = await axios.post(targetUrl, req.body);

        // Set custom header to indicate which version handled the request
        res.set('X-Service-Version', version);

        // Respond with the data from the user service
        res.status(201).json(response.data);
    } catch (error) {
        const statusCode = error.response ? error.response.status : 500;
        const message = error.response ? error.response.data : 'An error occurred while creating user.';
        console.error(error);
        res.status(statusCode).json({ message });
    }
});

// Route to update user email or delivery address (v1 or v2 based on request)
router.put('/:userId', async (req, res) => {
    try {
        const targetUrl = getServiceUrl(); // Route to either v1 or v2 based on percentage
        const version = targetUrl === USER_SERVICE_V1_URL ? 'v1' : 'v2';
        console.log(`Routing PUT request to ${version}`);

        const response = await axios.put(`${targetUrl}/${req.params.userId}`, req.body);

        // Set custom header to indicate which version handled the request
        res.set('X-Service-Version', version);

        // Respond with the data from the user service
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
