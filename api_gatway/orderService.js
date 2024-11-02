const express = require('express');
const bodyParser = require('body-parser');
const amqp = require('amqplib');

const app = express();
const PORT = process.env.PORT || 3002;
let channel;

// Middleware to parse JSON
app.use(bodyParser.json());

// Sample order data for demonstration purposes
let orders = [];

// Connect to RabbitMQ
async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect('amqp://localhost');
        channel = await connection.createChannel();
        await channel.assertQueue('user_updates');
        channel.consume('user_updates', (msg) => {
            const event = JSON.parse(msg.content.toString());
            console.log('Received user update event:', event);

            // Update corresponding orders in the database (simplified)
            orders = orders.map(order => {
                if (order.userId === event.userId) {
                    return { ...order, ...event.updatedFields };
                }
                return order;
            });
            console.log('Orders updated:', orders);

            // Acknowledge the message
            channel.ack(msg);
        });
        console.log('Connected to RabbitMQ and listening for events');
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
    }
}

// Route to create a new order
app.post('/api/orders', (req, res) => {
    const newOrder = req.body;
    orders.push(newOrder);
    res.status(201).json(newOrder);
});

// Start the order service and connect to RabbitMQ
connectRabbitMQ().then(() => {
    app.listen(PORT, () => {
        console.log(`Order Service is running on http://localhost:${PORT}`);
    });
});
