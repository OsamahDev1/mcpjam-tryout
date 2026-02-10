FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build React widget
RUN npm run build

# Environment configuration
ENV TRANSPORT=http
ENV PORT=3000

EXPOSE 3000

# Start server
CMD ["npm", "start"]
