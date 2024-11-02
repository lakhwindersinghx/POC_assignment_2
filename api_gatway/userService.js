const express = require('express');
const bodyParser = require('body-parser');
const amqp = require('amqplib');

const app = express();
const PORT = process.env.PORT || 3001;
let channel;

// Middleware to parse JSON
app.use(bodyParser.json());

// Sample user data for demonstration purposes
let users = [];

// Connect to RabbitMQ
async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect('amqp://localhost');
        channel = await connection.createChannel();
        await channel.assertQueue('user_updates');
        console.log('Connected to RabbitMQ');
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
    }
}

// Route to create a new user
app.post('/api/users', (req, res) => {
    const newUser = req.body;
    users.push(newUser);
    res.status(201).json(newUser);
});

// Route to update user email or delivery address
app.put('/api/users/:userId', async (req, res) => {
    const userId = req.params.userId;
    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }
    users[userIndex] = { ...users[userIndex], ...req.body };

    // Publish event to RabbitMQ
    const event = {
        userId,
        updatedFields: req.body,
    };
    channel.sendToQueue('user_updates', Buffer.from(JSON.stringify(event)));

    res.status(200).json(users[userIndex]);
});

// Start the user service and connect to RabbitMQ
connectRabbitMQ().then(() => {
    app.listen(PORT, () => {
        console.log(`User Service is running on http://localhost:${PORT}`);
    });
});
