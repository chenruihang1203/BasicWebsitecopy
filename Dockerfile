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

# Build-time arguments for public environment variables
ARG NEXT_PUBLIC_PUSHER_KEY=3b43f68c976d7b71fa42
ARG NEXT_PUBLIC_PUSHER_CLUSTER=ap3

# Set them as environment variables so Next.js build can access them
ENV NEXT_PUBLIC_PUSHER_KEY=${NEXT_PUBLIC_PUSHER_KEY}
ENV NEXT_PUBLIC_PUSHER_CLUSTER=${NEXT_PUBLIC_PUSHER_CLUSTER}

# Build the Next.js application
RUN npm run build

# Expose the port that ModelScope requires
EXPOSE 7860

# Set the environment variable for the port
ENV PORT=7860

# Start the application
CMD ["npm", "start"]