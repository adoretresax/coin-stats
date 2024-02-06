FROM --platform=linux/amd64 node:latest

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --verbose

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]
