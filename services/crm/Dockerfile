# Dockerfile for CRM Plugin
FROM node:18

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 3012
CMD ["npm", "start"]