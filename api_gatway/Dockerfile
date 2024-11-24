# Step 1: Use an official Node.js image as the base image
FROM node:18

# Step 2: Set the working directory inside the container
WORKDIR /usr/src/app

# Step 3: Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Step 4: Install the dependencies defined in package.json
RUN npm install

# Step 5: Copy all the project files into the container
COPY . .

# Step 6: Expose port (for the API Gateway)
EXPOSE 3000

# Step 7: Define the command to run the application
CMD ["node", "index.js"]
