#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if a commit message is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: Commit message is required${NC}"
  echo -e "Usage: ${BLUE}./pu.sh \"Your commit message\"${NC}"
  exit 1
fi

echo -e "\n${BLUE}🚀 Starting git push process...${NC}\n"

# Add all changes
echo -e "${BLUE}📦 Adding changes to git...${NC}"
git add .
echo -e "${GREEN}✓ Changes added${NC}\n"

# Commit with the provided message
echo -e "${BLUE}💾 Committing changes with message:${NC}"
echo -e "${GREEN}→ $1${NC}"
git commit -m "$1"
echo -e "${GREEN}✓ Changes committed${NC}\n"

# Push changes
echo -e "${BLUE}⬆️  Pushing changes to remote...${NC}"
git push
echo -e "${GREEN}✓ Changes pushed${NC}\n"

echo -e "${GREEN}✨ All done! Changes pushed successfully!${NC}\n"
