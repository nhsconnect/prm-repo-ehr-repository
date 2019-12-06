FROM node:11.15.0-alpine
WORKDIR /app
COPY package*.json ./
COPY node_modules/ ./node_modules
COPY build/ /app/

RUN apk update && apk add openssl ca-certificates && rm -rf /var/cache/apk/*
COPY ./certs/deductions.crt /usr/local/share/ca-certificates/deductions.crt
RUN update-ca-certificates

ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/deductions.crt

EXPOSE 3000
RUN apk add --no-cache tini
# Tini is now available at /sbin/tini
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
