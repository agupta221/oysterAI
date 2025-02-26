#!/usr/bin/env node

/**
 * This script helps set up Google Cloud credentials for the text-to-speech API.
 * It creates a credentials file from the provided JSON key and sets the
 * GOOGLE_APPLICATION_CREDENTIALS environment variable.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Google Cloud Text-to-Speech Setup');
console.log('=================================');
console.log('This script will help you set up Google Cloud credentials for the text-to-speech API.');
console.log('You need to have a Google Cloud service account key in JSON format.');
console.log('');

rl.question('Enter the path to your Google Cloud service account key JSON file: ', (keyPath) => {
  try {
    // Read the key file
    const keyContent = fs.readFileSync(path.resolve(keyPath), 'utf8');
    
    // Parse to make sure it's valid JSON
    JSON.parse(keyContent);
    
    // Create the credentials directory if it doesn't exist
    const credentialsDir = path.join(process.cwd(), 'credentials');
    if (!fs.existsSync(credentialsDir)) {
      fs.mkdirSync(credentialsDir);
    }
    
    // Write the key to a file in the credentials directory
    const credentialsPath = path.join(credentialsDir, 'google-cloud-credentials.json');
    fs.writeFileSync(credentialsPath, keyContent);
    
    console.log('\nCredentials saved to:', credentialsPath);
    console.log('\nAdd the following to your .env.local file:');
    console.log(`GOOGLE_APPLICATION_CREDENTIALS=${credentialsPath}`);
    
    // Check if .env.local exists and update it
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Check if GOOGLE_APPLICATION_CREDENTIALS is already set
      if (envContent.includes('GOOGLE_APPLICATION_CREDENTIALS=')) {
        // Replace the existing value
        envContent = envContent.replace(
          /GOOGLE_APPLICATION_CREDENTIALS=.*/,
          `GOOGLE_APPLICATION_CREDENTIALS=${credentialsPath}`
        );
      } else {
        // Add the new variable
        envContent += `\nGOOGLE_APPLICATION_CREDENTIALS=${credentialsPath}\n`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log('\nUpdated .env.local file automatically.');
    }
    
    console.log('\nSetup complete! You can now use Google Cloud Text-to-Speech API.');
  } catch (error) {
    console.error('Error setting up credentials:', error.message);
  } finally {
    rl.close();
  }
}); 