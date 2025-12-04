# Dockerfile for Email Service
FROM node:18

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 3002
CMD ["npm", "start"]