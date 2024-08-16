# Use an official Node.js image as the base image
FROM node:latest

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all the project files to the working directory
COPY . .

# Copy the song-search.png file from your local machine to the /app directory in the container
COPY song-search.png /app

# Expose the port on which the React app runs (default is 3000)
EXPOSE 3000

# Command to start the React app
CMD ["npm", "start"]
