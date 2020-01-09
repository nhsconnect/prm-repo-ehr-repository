FROM node:12.14.1-alpine

# Add root CA from deductions team to trusted certificates
RUN apk update && \
    apk add --no-cache openssl ca-certificates bash tini postgresql-client && \
    rm -rf /var/cache/apk/*

COPY ./certs/deductions.crt /usr/local/share/ca-certificates/deductions.crt
RUN update-ca-certificates
ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/deductions.crt

ENV EHR_REPO_SKIP_MIGRATION=false \
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

# Migration script
COPY scripts/migrate-db.sh /usr/bin/run-ehr-server

# This should be done to avoid any platform dependent packages
RUN npm install && npm audit --fix
RUN npm install -g sequelize-cli


EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/usr/bin/run-ehr-server"]
