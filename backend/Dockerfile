FROM node:20-alpine

WORKDIR /app

# Install OpenSSL and dependencies required by Prisma engine on Alpine
RUN apk add --no-cache openssl libc6-compat curl

# Copy package descriptors
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (bcrypt needs build tools if prebuilt binary not available, so install python3 make g++)
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && npm install \
    && apk del .build-deps

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
