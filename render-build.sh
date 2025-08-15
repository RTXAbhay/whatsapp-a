#!/usr/bin/env bash
# Install system dependencies for Chromium
apt-get update
apt-get install -y wget gnupg ca-certificates
apt-get install -y chromium

# Install Node.js dependencies
npm install
