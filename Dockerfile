FROM mhart/alpine-node:11 AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

FROM mhart/alpine-node
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY --from=builder /app/build /app/build
EXPOSE 3000
CMD ["npm", "run", "start"]