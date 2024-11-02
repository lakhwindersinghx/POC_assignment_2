from pymongo import MongoClient

# MongoDB connection string
connection_string = "mongodb://localhost:27017/"
client = MongoClient(connection_string)

# Database and collection names
USER_DB = "user_database"
ORDER_DB = "order_database"
USER_COLLECTION = "users"
ORDER_COLLECTION = "orders"

# Access the databases
user_db = client[USER_DB]
order_db = client[ORDER_DB]

# Access the collections
user_collection = user_db[USER_COLLECTION]
order_collection = order_db[ORDER_COLLECTION]

# Sample data for User Database
users = [
    {"userId": "U123", "email": "user1@example.com", "deliveryAddress": "123 Main St, City, Country"},
    {"userId": "U124", "email": "user2@example.com", "deliveryAddress": "456 Maple Ave, City, Country"},
    {"userId": "U125", "email": "user3@example.com", "deliveryAddress": "789 Oak St, City, Country"}
]

# Sample data for Order Database
orders = [
    {"orderId": "O456", "items": ["item1", "item2"], "email": "user1@example.com", 
     "deliveryAddress": "123 Main St, City, Country", "status": "under process"},
    {"orderId": "O457", "items": ["item3", "item4"], "email": "user2@example.com", 
     "deliveryAddress": "456 Maple Ave, City, Country", "status": "shipping"},
    {"orderId": "O458", "items": ["item5"], "email": "user3@example.com", 
     "deliveryAddress": "789 Oak St, City, Country", "status": "delivered"}
]

# Insert sample data into the User Collection
user_collection.insert_many(users)
print("Inserted users into user_database.users collection")

# Insert sample data into the Order Collection
order_collection.insert_many(orders)
print("Inserted orders into order_database.orders collection")

# Display inserted data
print("Users:")
for user in user_collection.find():
    print(user)

print("\nOrders:")
for order in order_collection.find():
    print(order)

# Close the MongoDB connection
client.close()
