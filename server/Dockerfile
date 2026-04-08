FROM node:20
WORKDIR /usr/src/app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
RUN npm run build:prisma
COPY . .
EXPOSE 5000
CMD ["npm", "start"]