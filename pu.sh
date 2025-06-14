#!/bin/bash

# Check if a commit message is provided
if [ -z "$1" ]; then
  echo "Usage: ./pusher.sh \"Your commit message\""
  exit 1
fi

# Add all changes
git add .

# Commit with the provided message
git commit -m "$1"

# Push changes
git push

echo "\nChanges pushed successfully!"
