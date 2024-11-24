const express = require('express');
const bodyParser = require('body-parser');
const amqp = require('amqplib');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3003;
let channel;

// Middleware to parse JSON
app.use(bodyParser.json());

// Schema for Order DB
const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    productName: { type: String, required: true },
    status: { type: String, default: 'Pending' },
    email: { type: String, required: true },
    deliveryAddress: { type: String, required: true }
});

const Order = mongoose.model('Order', orderSchema);

//MONGODB CONNECTION

async function connectMongoDB() {
    try {
        const uri = 'mongodb+srv://singh:1721@cluster0.uuzh3.mongodb.net/OrderDatabase?retryWrites=true&w=majority';
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000, // Wait up to 30 seconds for a connection
        });
        console.log('Connected to MongoDB Atlas');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1); // Exit the process if the connection fails
    }
}
connectMongoDB();

// Connect to RabbitMQ
async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL || "amqp://rabbitmq:5672");

        channel = await connection.createChannel();
        await channel.assertQueue("user_updates");

        channel.consume("user_updates", async (msg) => {
            try {
                const event = JSON.parse(msg.content.toString());
                console.log("Received user update event:", event);
                
                const { updatedFields } = event;  // Destructure updatedFields
                const { email, deliveryAddress } = updatedFields;
        
                if (!email || !deliveryAddress) {
                    console.error("Invalid event data. Missing email or delivery address.");
                    channel.nack(msg);  // Reject the message if the data is invalid
                    return;
                }
        
                const result = await Order.updateMany(
                    { email },
                    { email, deliveryAddress }
                );
        
                console.log(`Updated ${result.modifiedCount} orders for email: ${email}`);
                channel.ack(msg);  // Acknowledge the message after successful processing
            } catch (error) {
                console.error("Error processing message:", error);
                channel.nack(msg);  // Reject the message if there was an error
            }
        });
        
    } catch (error) {
        console.error("Error connecting to RabbitMQ:", error);
    }
}

app.get('/', (req, res) => {
    res.send('Order Service is running!');
});

// Route to update user email or delivery address
app.put('/api/orders/:orderId', async (req, res) => {
    const orderId = req.params.orderId;

    try {
        const updatedOrder = await Order.findOneAndUpdate(
            { orderId },
            { $set: req.body },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const event = {
            orderId,
            updatedFields: req.body
        };
        channel.sendToQueue('order_updates', Buffer.from(JSON.stringify(event)));

        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Route to get all orders
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find();
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Route to create a new order
app.post('/api/orders', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Start the order service
connectRabbitMQ().then(() => {
    app.listen(PORT, () => {
        console.log(`Order Service is running on http://localhost:${PORT}`);
    });
});
