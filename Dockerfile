# Use the official Node.js image as the base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the port that ModelScope requires
EXPOSE 7860

# Set the environment variable for the port
ENV PORT=7860

# Start the application
CMD ["npm", "start"]