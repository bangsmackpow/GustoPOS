# syntax=docker/dockerfile:1
FROM node:18-alpine
WORKDIR /app

RUN npm install -g pnpm

# Copy repo so drizzle/db tooling is available
COPY . .

RUN pnpm install

CMD ["pnpm", "--filter", "@workspace/db", "run", "push"]
