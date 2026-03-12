#**FROM node:20

# Set working directory
#**WORKDIR /app

# Copy package files first to leverage caching
#**COPY package.json package-lock.json* ./

# Install dependencies
#**RUN npm install

# Copy the rest of the source code
#**COPY . .

# Expose Vite port (match vite.config.js)
#**EXPOSE 3000

# Start the dev server
#**CMD ["npm", "run", "dev"]

# -------- Build Stage --------
# FROM node:20-alpine AS build

# WORKDIR /app

# COPY package*.json ./
# RUN npm install

# COPY . .

# ##ARG VITE_API_BASE_URL
# ##ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# RUN npm run build

# # -------- Runtime Stage --------
# FROM node:20-alpine

# WORKDIR /app

# # Install static file server
# RUN npm install -g serve

# # Copy built files
# COPY --from=build /app/dist ./dist

# EXPOSE 3000

# CMD ["serve", "-s", "dist", "-l", "3000"]


# -------- Build Stage --------
FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci --no-audit --no-fund

COPY . .

RUN npm run build

# -------- Runtime Stage --------
FROM node:20-slim

WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]