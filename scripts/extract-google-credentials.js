#!/usr/bin/env node

/**
 * This script extracts the necessary values from a Google Cloud credentials JSON file
 * for use in Replit or other environments that don't support JSON secrets.
 * It will output the values that need to be set as environment variables.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Google Cloud Credentials Extractor for Replit');
console.log('=============================================');
console.log('This script will extract the necessary values from your Google Cloud credentials');
console.log('JSON file for use in Replit or other environments that don\'t support JSON secrets.');
console.log('');

rl.question('Enter the path to your Google Cloud service account key JSON file: ', (keyPath) => {
  try {
    // Read the key file
    const keyContent = fs.readFileSync(path.resolve(keyPath), 'utf8');
    
    // Parse the JSON
    const credentials = JSON.parse(keyContent);
    
    // Extract the necessary values
    const projectId = credentials.project_id;
    const clientEmail = credentials.client_email;
    const privateKey = credentials.private_key;
    
    console.log('\n=== Values to add to your Replit Secrets ===\n');
    console.log(`GOOGLE_PROJECT_ID: ${projectId}`);
    console.log(`GOOGLE_CLIENT_EMAIL: ${clientEmail}`);
    console.log(`GOOGLE_PRIVATE_KEY: ${privateKey}`);
    
    console.log('\n=== Instructions ===\n');
    console.log('1. Go to your Replit project');
    console.log('2. Click on "Secrets" in the Tools panel');
    console.log('3. Add each of the above values as separate secrets');
    console.log('4. Make sure to copy the private key exactly as shown, including newlines');
    console.log('\nNote: The GOOGLE_PRIVATE_KEY contains newline characters (\\n).');
    console.log('Replit will handle these correctly when you paste the entire key.');
    
  } catch (error) {
    console.error('Error extracting credentials:', error.message);
  } finally {
    rl.close();
  }
}); 