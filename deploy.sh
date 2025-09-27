#!/bin/bash

echo "🚀 Deploying ShowContract to Flow Testnet..."
echo "=============================================="

# Check if private key is set
if [ -z "$PRIVATE_KEY" ]; then
    echo "⚠️  PRIVATE_KEY environment variable not set"
    echo "💡 Using hardcoded private key from hardhat.config.js"
fi

# Compile contracts first
echo "📦 Compiling contracts..."
npx hardhat compile

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed!"
    exit 1
fi

echo "✅ Compilation successful!"

# Deploy to Flow testnet
echo "🌐 Deploying to Flow Testnet..."
npx hardhat run scripts/deployShowContract.js --network flowTestnet

if [ $? -eq 0 ]; then
    echo "🎉 Deployment completed successfully!"
    echo "💡 Don't forget to update your .env file with the contract address"
else
    echo "❌ Deployment failed!"
    exit 1
fi
