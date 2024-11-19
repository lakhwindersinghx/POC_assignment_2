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
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    deliveryAddress: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Connect to RabbitMQ
async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect('amqp://localhost');
        channel = await connection.createChannel();
        await channel.assertQueue('user_updates', { durable: true });
        console.log('Connected to RabbitMQ');
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error.message);
        process.exit(1); // Exit if RabbitMQ connection fails
    }
}

// Connect to MongoDB
async function connectMongoDB() {
    try {
        const uri = 'mongodb+srv://singh:1721@cluster0.uuzh3.mongodb.net/UserDatabase?retryWrites=true&w=majority';
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB Atlas');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error.message);
        process.exit(1); // Exit if MongoDB connection fails
    }
}

// Route to create a new user
app.post('/api/users', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        console.log('User created successfully:', newUser);
        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error creating user:', error.message);
        res.status(500).json({ message: 'Failed to create user', error: error.message });
    }
});

// Route to update user email or delivery address
app.put('/api/users/:userId', async (req, res) => {
    const userId = req.params.userId;
    console.log(`Received PUT request for userId: ${userId} with data:`, req.body);

    try {
        const updatedUser = await User.findOneAndUpdate(
            { userId },
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            console.error('User not found in database');
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('User updated successfully:', updatedUser);

        // Ensure RabbitMQ channel is initialized
        if (!channel) {
            console.error('RabbitMQ channel is not initialized.');
            return res.status(500).json({ message: 'RabbitMQ channel is not available' });
        }

        // Publish event to RabbitMQ
        const event = {
            userId,
            updatedFields: req.body,
        };
        console.log('Publishing event to RabbitMQ:', JSON.stringify(event));
        channel.sendToQueue('user_updates', Buffer.from(JSON.stringify(event)));
        console.log('Event successfully sent to RabbitMQ');

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error updating user or publishing event:', error.message);
        res.status(500).json({ message: 'Failed to update user', error: error.message });
    }
});

// Route to get all users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        console.log('Fetched users:', users);
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error.message);
        res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
});

// Sequentially connect to services and start the server
async function startServices() {
    try {
        await connectMongoDB();
        await connectRabbitMQ();
        app.listen(PORT, () => {
            console.log(`User Service is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start services:', error.message);
        process.exit(1);
    }
}

// Start the application
startServices();
