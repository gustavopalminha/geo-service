# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

# Install SpatiaLite dependencies
RUN apk add --no-cache libspatialite

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data

ENV NODE_ENV=production

EXPOSE 8090

CMD ["npm", "start"]
