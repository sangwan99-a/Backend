# Dockerfile for File Management Service
FROM node:25.2.1

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 3003
CMD ["npm", "start"]