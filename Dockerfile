FROM node:alpine

RUN apk add --no-cache python3
RUN apk add --no-cache unixodbc-dev
WORKDIR /app
COPY ./package.json .

RUN npm install
COPY . .

CMD ["npm","run","dev"]