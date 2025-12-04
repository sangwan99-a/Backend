# Dockerfile for Slack Plugin
FROM node:18

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 3010
CMD ["npm", "start"]