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
const addressSchema=new mongoose.Schema({
    city:{type:String, required:true},
    province:{type:String, required:true}
});
const userSchema = new mongoose.Schema({
    userId: {type:String, required:true, unique:true},
    email: {type:String, required:true, unique:true},
    deliveryAddress:{type:addressSchema, required:true}
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

// Connect to MongoDB
async function connectMongoDB() {
    try {
        const uri = 'mongodb+srv://singh:1721@cluster0.uuzh3.mongodb.net/myDatabase?retryWrites=true&w=majority';
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB Atlas');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
    }
}

// Route to create a new user
app.post('/api/users', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create user', error: error.message });
    }
});

// Route to update user email or delivery address
app.put('/api/users/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const updatedUser = await User.findOneAndUpdate(
            { userId },
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Publish event to RabbitMQ
        const event = {
            userId,
            updatedFields: req.body,
        };
        channel.sendToQueue('user_updates', Buffer.from(JSON.stringify(event)));

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update user', error: error.message });
    }
});

// Route to get all users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
});

// Start the services
Promise.all([connectRabbitMQ(), connectMongoDB()]).then(() => {
    app.listen(PORT, () => {
        console.log(`User Service is running on http://localhost:${PORT}`);
    });
});
