const express = require('express');
const axios = require('axios');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Read config file for percentage routing
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const P = config.p; // Percentage to route to v1
app.use((req, res, next) => {
    console.log(`Received request: ${req.method} ${req.originalUrl}`);
    next();
});

// Middleware for routing logic
app.use((req, res, next) => {
    const rand = Math.random() * 100; // Random percentage between 0 and 100

    if (rand < P) {
        // Route to v1
        console.log(`Routing to v1: ${rand}% <= ${P}%`);
        axios({
            method: req.method,
            url: `http://localhost:3001${req.originalUrl}`, // v1 service
            data: req.body,
            headers: req.headers
        })
            .then(response => res.json(response.data))
            .catch(err => res.status(500).json({ message: 'Error in v1', error: err.message }));
    } else {
        // Route to v2
        console.log(`Routing to v2: ${rand}% > ${P}%`);
        axios({
            method: req.method,
            url: `http://localhost:3002${req.originalUrl}`, // v2 service
            data: req.body,
            headers: req.headers
        })
            .then(response => res.json(response.data))
            .catch(err => res.status(500).json({ message: 'Error in v2', error: err.message }));
    }
});

// Start the API Gateway
app.listen(PORT, () => {
    console.log(`API Gateway is running on http://localhost:${PORT}`);
});
