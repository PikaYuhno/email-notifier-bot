FROM node:16
WORKDIR /usr/src/app
COPY package*.json ./
RUN yarn
COPY . .
RUN yarn run build 
WORKDIR ./dist
COPY .env .
COPY config.json .
CMD node index.js