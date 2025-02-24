#!/bin/bash

PROJECT_NAME="livingroom-monome"
BUILD_DIR="dist"
REMOTE_USER="osmc"
REMOTE_HOST="raspberry-pi"
REMOTE_DIR="/home/${REMOTE_USER}/${PROJECT_NAME}"
SERVICE_NAME="livingroom-monome" 

# Ensure script exits on error
set -e

echo "Compiling TypeScript..."
yarn tsc

echo "Transferring package.json and yarn.lock..."
scp package.json yarn.lock .env ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/

echo "Transferring compiled files..."
for file in ${BUILD_DIR}/*; do
  echo "Uploading $file..."
  scp "$file" ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/${BUILD_DIR}
done

ssh ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
  export NVM_DIR=$HOME/.nvm
  source $NVM_DIR/nvm.sh
  nvm use default
  cd ${REMOTE_DIR}
  yarn install --production
EOF

echo "Restarting service..."
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
  sudo systemctl restart livingroom-monome
  echo "Deployment complete."
EOF

echo "Done!"
