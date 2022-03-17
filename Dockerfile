FROM node:14.19.0-alpine

# Add root CA from deductions team to trusted certificates
RUN apk update && \
    apk add --no-cache openssl ca-certificates bash tini postgresql-client && \
    rm -rf /var/cache/apk/*

RUN apk add --no-cache \
        python3 \
        py3-pip \
    && pip3 install --upgrade pip \
    && pip3 install \
        awscli \
    && rm -rf /var/cache/apk/*

# Install sequelize postgress native dependencies
RUN apk add --no-cache postgresql-dev g++ make

COPY ./certs/deductions.crt /usr/local/share/ca-certificates/deductions.crt
RUN update-ca-certificates
ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/deductions.crt

ENV AUTHORIZATION_KEYS="auth-key-1" \
  SKIP_DB_MIGRATION="" \
  NODE_ENV="prod" \
  NHS_ENVIRONMENT="" \
  S3_BUCKET_NAME="" \
  DATABASE_USER="" \
  DATABASE_PASSWORD="" \
  DATABASE_NAME="" \
  DATABASE_HOST="" \
  LOCALSTACK_URL=""

WORKDIR /app

COPY package*.json  /app/
COPY build/         /app/build
COPY database/      /app/database
COPY build/config/database.js /app/src/config/
COPY .sequelizerc   /app/

COPY scripts/load-api-keys.sh /app/scripts/load-api-keys.sh
COPY scripts/migrate-db.sh /app/scripts/migrate-db.sh
COPY scripts/run-server-with-db.sh /usr/bin/run-ehr-server

RUN npm install

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/usr/bin/run-ehr-server"]

USER node
