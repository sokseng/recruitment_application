FROM node:20

# Set working directory
WORKDIR /app

# Copy package files first to leverage caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose Vite port (match vite.config.js)
EXPOSE 3000

# Start the dev server
CMD ["npm", "run", "dev"]