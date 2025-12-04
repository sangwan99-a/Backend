# Dockerfile for Jira Plugin
FROM node:18

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 3011
CMD ["npm", "start"]