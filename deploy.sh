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
scp package.json yarn.lock ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/

echo "Transferring compiled files..."
for file in ${BUILD_DIR}/*; do
  echo "Uploading $file..."
  scp "$file" ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/${BUILD_DIR}
done

# Get local yarn.lock modification time
LOCAL_YARN_LOCK_TIME=$(stat -f %m yarn.lock)

# Get remote yarn.lock modification time
REMOTE_YARN_LOCK_TIME=$(ssh ${REMOTE_USER}@${REMOTE_HOST} "stat -c %Y ${REMOTE_DIR}/yarn.lock 2>/dev/null || echo 0")

echo "Checking if dependencies need updating..."
if [ "$LOCAL_YARN_LOCK_TIME" -gt "$REMOTE_YARN_LOCK_TIME" ]; then
  echo "yarn.lock changed, installing dependencies..."
  ssh ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
    export NVM_DIR=$HOME/.nvm
    source $NVM_DIR/nvm.sh
    nvm use default
    cd ${REMOTE_DIR}
    yarn install --production
EOF
else
  echo "Dependencies are up to date, skipping install"
fi

echo "Restarting service..."
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
  sudo systemctl restart livingroom-monome
  echo "Deployment complete."
EOF

echo "Done!"
