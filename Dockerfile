FROM node:20

WORKDIR /usr/src/app

# Copy root package files
COPY package*.json .
COPY tsconfig.json .

# Copy the workspace packages
COPY apps/upload-service/package.json apps/upload-service/
COPY apps/deploy-service/package.json apps/deploy-service/
COPY apps/request-handler/package.json apps/request-handler/

# Install dependencies (from root)
RUN npm install

# Copy source code
COPY apps apps

# Build all TypeScript files
RUN npm run build --workspaces

# Expose ports (Upload=3000, Request=3001)
EXPOSE 3000 3001

# Default command (will be overridden in Compose)
CMD ["node", "apps/upload-service/dist/index.js"]
