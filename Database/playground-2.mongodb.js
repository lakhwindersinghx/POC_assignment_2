// Make sure to use the MongoDB JavaScript Driver for this code

const { MongoClient } = require("mongodb");

async function run() {
    const client = new MongoClient("mongodb+srv://singh:1721@cluster0.uuzh3.mongodb.net/");
    
    try {
        await client.connect();

        // Create User Database and User Collection
        const userDatabase = client.db("UserDatabase");
        const userCollection = userDatabase.collection("Users");

        // Create Order Database and Order Collection
        const orderDatabase = client.db("OrderDatabase");
        const orderCollection = orderDatabase.collection("Orders");

        // Sample data insertion with checks to avoid duplicates
        const usersToInsert = [
            {
                userId: "user1",
                email: "user1@example.com",
                deliveryAddress: "123 Main St, Anytown"
            },
            {
                userId: "user2",
                email: "user2@example.com",
                deliveryAddress: "456 Elm St, Othertown"
            }
        ];

        for (const user of usersToInsert) {
            const existingUser = await userCollection.findOne({ userId: user.userId });
            if (!existingUser) {
                await userCollection.insertOne(user);
            }
        }

        const ordersToInsert = [
            {
                orderId: "order1",
                userId: "user1",
                items: [
                    { itemId: "item1", quantity: 2 },
                    { itemId: "item2", quantity: 1 }
                ],
                email: "user1@example.com",
                deliveryAddress: "123 Main St, Anytown",
                status: "under process"
            },
            {
                orderId: "order2",
                userId: "user2",
                items: [
                    { itemId: "item3", quantity: 1 },
                    { itemId: "item4", quantity: 2 }
                ],
                email: "user2@example.com",
                deliveryAddress: "456 Elm St, Othertown",
                status: "shipping"
            }
        ];

        for (const order of ordersToInsert) {
            const existingOrder = await orderCollection.findOne({ orderId: order.orderId });
            if (!existingOrder) {
                await orderCollection.insertOne(order);
            }
        }

        console.log("Databases and collections created with sample data!");

        // Function to update user and synchronize orders
        async function updateUserAndSyncOrders(userId, newEmail, newDeliveryAddress) {
            // Update the user's email and delivery address
            const updateUserResult = await userCollection.updateOne(
                { userId: userId },
                {
                    $set: {
                        email: newEmail,
                        deliveryAddress: newDeliveryAddress
                    }
                }
            );

            if (updateUserResult.modifiedCount === 1) {
                console.log(`User ${userId} updated successfully.`);
                
                // Synchronize orders
                await orderCollection.updateMany(
                    { userId: userId },
                    {
                        $set: {
                            email: newEmail,
                            deliveryAddress: newDeliveryAddress
                        }
                    }
                );
                console.log(`Orders synchronized for user ${userId}.`);
            } else {
                console.log(`User ${userId} not found.`);
            }
        }

        // Example usage of update and synchronize
        await updateUserAndSyncOrders("user1", "new_user1@example.com", "789 Oak St, Newtown");

        // Optional: Verify updated data
        const users = await userCollection.find({}).toArray();
        console.log("Updated Users:", users);

        const orders = await orderCollection.find({}).toArray();
        console.log("Updated Orders:", orders);
    } catch (err) {
        console.error("Error occurred while connecting to MongoDB:", err);
    } finally {
        // Close the connection
        await client.close();
    }
}

run().catch(console.dir);
    