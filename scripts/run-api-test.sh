#!/bin/bash

# Make sure we have a referral ID and user ID to test with
if [ "$1" = "" ] || [ "$2" = "" ]; then
  echo "Usage: $0 <referral_id> <user_id>"
  echo "Example: $0 123456789abcdef 987654321abcdef"
  exit 1
fi

# Set the environment variables for the test
export API_URL="http://localhost:3000/api"
export TEST_REFERRAL_ID="$1"
export TEST_USER_ID="$2"

# Run the API test
echo "Running API test for referral ID: $TEST_REFERRAL_ID and user ID: $TEST_USER_ID"
node scripts/api-test.js

# Exit with the same status code as the test
exit $? 