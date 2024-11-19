const express = require('express');
const bodyParser = require('body-parser');
const amqp = require('amqplib');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3002;
let channel;

// Middleware to parse JSON
app.use(bodyParser.json());

//define a subdocument
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
app.post('/api/users', async (req, res) => {
    try {
        const newUser = new User(req.body); // Create a new User instance
        await newUser.save(); // Save the new user to the database
        res.status(201).json(newUser); // Respond with the created user
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// Route to update user email or delivery address
app.put('/api/users/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    try {
        // Find the user by userId and update the fields
        const updatedUser = await User.findOneAndUpdate(
            { userId: userId },  // Find the user by userId
            { $set: req.body },  // Update the user fields
            { new: true }         // Return the updated user document
        );

        // If the user is not found, return 404
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Publish event to RabbitMQ
        const event = {
            userId,
            updatedFields: req.body, // Send only the updated fields
        };
        channel.sendToQueue('user_updates', Buffer.from(JSON.stringify(event)));

        res.status(200).json(updatedUser); // Send back the updated user data
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// Route to get all users from MongoDB
app.get('/api/users', async (req, res) => {
    try {
        // Fetch all users from MongoDB
        const users = await User.find();

        // Return the users as the response
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// Route to delete a particular user
app.delete('/api/users/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    try {
        // Find and delete the user in MongoDB
        const deletedUser = await User.findOneAndDelete({ userId: userId });

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Publish event to RabbitMQ
        const event = {
            userId: deletedUser.userId,
            updatedFields: deletedUser,
        };
        channel.sendToQueue('user_updates', Buffer.from(JSON.stringify(event)));

        res.status(200).json(deletedUser); // Send back the deleted user data
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// Route to delete all users
app.delete('/api/users', async (req, res) => {
    try {
        // Delete all users in MongoDB
        const result = await User.deleteMany({});

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'No users found' });
        }

        // Publish the deletion event for all users to RabbitMQ
        const event = {
            message: 'All users deleted'
        };
        channel.sendToQueue('user_updates', Buffer.from(JSON.stringify(event)));

        res.status(200).json({ message: 'All users have been deleted' });
    } catch (error) {
        console.error('Error deleting all users:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// Start the services
Promise.all([connectRabbitMQ(), connectMongoDB()]).then(() => {
    app.listen(PORT, () => {
        console.log(`User Service is running on http://localhost:${PORT}`);
    });
});
