FROM node:12-alpine

WORKDIR /workspace

COPY . /workspace
RUN yarn install
RUN yarn compile

EXPOSE 3000
CMD [ "yarn", "start" ]
