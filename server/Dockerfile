# Use an official Node.js image as the base image
FROM node:latest

# Set the working directory in the container
WORKDIR /app/server

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install server dependencies
RUN npm install

# Copy all the server files to the working directory
COPY . .

# Expose the port on which your server runs (adjust as per your server configuration)
EXPOSE 5000

# Command to start the server
CMD ["npm", "start"]
