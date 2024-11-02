// api-gateway/index.js

const express = require('express');
const userRoutes = require('./routes/userRoutes.js');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Use the routes
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`API Gateway is running on http://localhost:${PORT}`);
});
