FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

RUN ls -la dist/

EXPOSE 3000

CMD ["node", "dist/src/main"]