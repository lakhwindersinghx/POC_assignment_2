// userUpdatePublisher.js (User Service)
const amqp = require('amqplib');
module.exports = { publishUserUpdateEvent };


async function publishUserUpdateEvent(userId, newEmail, newAddress) {
  try {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    const queue = 'user_updates';

    await channel.assertQueue(queue, { durable: true });

    const updateData = {
      userId,
      newEmail,
      newAddress,
    };

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(updateData)));
    console.log('User update event sent to RabbitMQ');

    await channel.close();
    await connection.close();
  } catch (error) {
    console.error('Error publishing user update event:', error.message);
  }
}

// Example usage when user details are updated
publishUserUpdateEvent('user123', 'newemail@example.com', 'New Address');

