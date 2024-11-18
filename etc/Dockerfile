FROM node:22 AS build

WORKDIR /bson
COPY . .

RUN rm -rf node_modules && npm install && npm test

FROM scratch

COPY --from=build /bson/docs/ /
