FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=optional
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev --omit=optional
COPY --from=build /app/dist ./dist
COPY views ./views
COPY public ./public
EXPOSE 3000
CMD ["node", "dist/main.js"]
