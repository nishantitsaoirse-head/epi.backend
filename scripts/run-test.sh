#!/bin/bash

# Set the MongoDB URI environment variable - use the actual production URI
export MONGODB_URI="mongodb+srv://dannush786:mZemUVFRVBoGLxyz@cluster0.qapilzl.mongodb.net/"

# Run the test script
echo "Running missed payment test..."
node scripts/test-missed-payment.js

# Exit with the same code as the test script
exit $? 