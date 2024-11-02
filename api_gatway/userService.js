const express = require('express');
const bodyParser = require('body-parser');
const amqp = require('amqplib');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3001;
let channel;

// Middleware to parse JSON
app.use(bodyParser.json());

// Define a user schema and model
const userSchema = new mongoose.Schema({
    userId: String,
    email: String,
    deliveryAddress: String
});
const User = mongoose.model('User', userSchema);

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

// Connect to MongoDB and populate users
async function connectMongoDB() {
    try {
        const uri = 'mongodb+srv://singh:1721@cluster0.uuzh3.mongodb.net/myDatabase?retryWrites=true&w=majority';
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        users = await User.find();  // Fetch all users from the database
        console.log('Connected to MongoDB Atlas and users populated');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
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
    const userIndex = users.findIndex(user => user.userId === userId);
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

// Route to get all users
app.get('/api/users', (req, res) => {
    res.status(200).json(users);
});

// Start the services
Promise.all([connectRabbitMQ(), connectMongoDB()]).then(() => {
    app.listen(PORT, () => {
        console.log(`User Service is running on http://localhost:${PORT}`);
    });
});
