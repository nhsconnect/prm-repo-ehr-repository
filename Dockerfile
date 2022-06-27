FROM node:14.19.0-alpine AS builder

# install python and postgres native requirements
RUN apk update && \
    apk add --no-cache bash tini postgresql-client && \
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

COPY package*.json /app/

WORKDIR /app

RUN npm ci --only=production

# production app image
FROM alpine:3.15

# take just node without npm (including npx) or yarn
COPY --from=builder /usr/local/bin/node /usr/local/bin

# take native-install node modules
COPY --from=builder /app /app

# install python and postgres native requirements (again, as per builder)
# add root CA from deductions team to trusted certificates
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

COPY build/                   /app/build
COPY database/                /app/database
COPY build/config/database.js /app/src/config/
COPY .sequelizerc             /app/

COPY scripts/load-api-keys.sh      /app/scripts/load-api-keys.sh
COPY scripts/run-server-with-db.sh /usr/bin/run-ehr-server

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

ARG UTILS_VERSION
RUN test -n "$UTILS_VERSION"
COPY utils/$UTILS_VERSION/run-with-redaction.sh ./utils/
COPY utils/$UTILS_VERSION/redactor              ./utils/

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/utils/run-with-redaction.sh", "/usr/bin/run-ehr-server"]

RUN addgroup -g 1000 node \
    && adduser -u 1000 -G node -s /bin/sh -D node

USER node
