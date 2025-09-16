#!/bin/bash
echo "Running command '$*' with redaction..."
EXIT_CODE_FILE="$HOME/_redacted_exit_code"
rm -f $EXIT_CODE_FILE
./utils/redactor < <($* 2>&1 ; echo $? > $EXIT_CODE_FILE)
redacted_exit_code=$(cat $EXIT_CODE_FILE)
rm $EXIT_CODE_FILE
exit $redacted_exit_code
