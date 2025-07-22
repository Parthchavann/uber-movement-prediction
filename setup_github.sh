#!/bin/bash

# Commands to run after creating the GitHub repository

echo "Adding remote origin..."
git remote add origin https://github.com/Parthchavann/uber-movement-prediction.git

echo "Pushing to GitHub..."
git push -u origin main

echo "Repository setup complete!"
echo "View your repository at: https://github.com/Parthchavann/uber-movement-prediction"