#!/bin/bash

psql -d postgres -v user_password="$1" << EOF
DROP DATABASE IF EXISTS deductions_db;
CREATE DATABASE deductions_db;

DROP DATABASE IF EXISTS deductions_test;
CREATE DATABASE deductions_test;

DROP ROLE IF EXISTS deductions_user;
CREATE ROLE deductions_user WITH LOGIN PASSWORD :'user_password';

GRANT ALL PRIVILEGES ON DATABASE deductions_db TO deductions_user;
GRANT ALL PRIVILEGES ON DATABASE deductions_test TO deductions_user;
EOF