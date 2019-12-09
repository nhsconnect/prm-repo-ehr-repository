FROM node:11.15.0-alpine

# Add root CA from deductions team to trusted certificates
RUN apk update && apk add openssl ca-certificates && rm -rf /var/cache/apk/*
COPY ./certs/deductions.crt /usr/local/share/ca-certificates/deductions.crt
RUN update-ca-certificates
ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/deductions.crt

WORKDIR /app
COPY package*.json /app/
COPY node_modules/ /app/node_modules
COPY build/        /app/
COPY database.json /app/database.json
COPY migrations/   /app/migrations

COPY run-server.sh /usr/bin/run-ehr-server

RUN chmod -c 0755 /app/node_modules/.bin/db-migrate

ENV EHR_REPO_SKIP_MIGRATION=false \
  NHS_ENVIRONMENT="" \
  DATABASE_USER="" \
  DATABASE_PASSWORD="" \
  DATABASE_NAME="" \
  DATABASE_HOST=""

EXPOSE 3000
RUN apk add --no-cache bash tini
# Tini is now available at /sbin/tini
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/usr/bin/run-ehr-server"]
