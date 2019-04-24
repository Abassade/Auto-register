FROM alpine:3.8

ENV NODE_VERSION 8.15.1

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app
RUN npm install

EXPOSE 4002

COPY . /usr/src/app

CMD ["npm", "start"]