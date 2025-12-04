# Use Node.js LTS as the base image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the .env file
COPY .env .

# Install dotenv package to load environment variables
RUN npm install dotenv

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3002

# Start the application
CMD ["node", "billing_service.js"]