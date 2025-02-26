# Setting Up Google Cloud Text-to-Speech

This guide will help you set up Google Cloud Text-to-Speech for the OysterAI application.

## Prerequisites

1. A Google Cloud account
2. A Google Cloud project with the Text-to-Speech API enabled
3. A service account with access to the Text-to-Speech API
4. A service account key (JSON format)

## Step 1: Create a Google Cloud Project

If you don't already have a Google Cloud project:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on "Select a project" at the top of the page
3. Click on "New Project"
4. Enter a name for your project and click "Create"

## Step 2: Enable the Text-to-Speech API

1. Go to the [API Library](https://console.cloud.google.com/apis/library)
2. Search for "Text-to-Speech"
3. Click on "Cloud Text-to-Speech API"
4. Click "Enable"

## Step 3: Create a Service Account

1. Go to [IAM & Admin > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Click "Create Service Account"
3. Enter a name for your service account (e.g., "oysterai-tts")
4. Click "Create and Continue"
5. For the role, select "Cloud Text-to-Speech User"
6. Click "Continue" and then "Done"

## Step 4: Create a Service Account Key

1. Find your service account in the list and click on the three dots menu
2. Select "Manage keys"
3. Click "Add Key" > "Create new key"
4. Select "JSON" and click "Create"
5. The key file will be downloaded to your computer

## Step 5: Set Up the Key in OysterAI

### Option A: Local Development Setup

Run the setup script:

```bash
npm run setup-google-tts
```

When prompted, enter the path to your downloaded JSON key file.

### Option B: Manual Local Setup

1. Create a `credentials` directory in the root of the project (if it doesn't exist)
2. Copy your JSON key file to this directory
3. Add the following to your `.env.local` file:

```
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/credentials/file.json
```

### Option C: Replit Deployment

Since Replit doesn't support JSON files for secrets, you need to extract the necessary values from your credentials file and add them as environment variables:

1. Run the extraction script:

```bash
npm run extract-google-credentials
```

2. When prompted, enter the path to your downloaded JSON key file
3. The script will output the values you need to add to Replit's Secrets
4. In your Replit project:
   - Click on "Secrets" in the Tools panel
   - Add each of the following as separate secrets:
     - `GOOGLE_PROJECT_ID`
     - `GOOGLE_CLIENT_EMAIL`
     - `GOOGLE_PRIVATE_KEY`
   - Make sure to copy the private key exactly as shown, including newlines

## Testing the Setup

After setting up the credentials, restart your development server:

```bash
npm run dev
```

The application should now use Google Cloud Text-to-Speech instead of ElevenLabs for generating audio content.

## Troubleshooting

If you encounter issues:

1. Make sure the Text-to-Speech API is enabled in your Google Cloud project
2. Verify that your service account has the correct permissions
3. Check that the credentials are set correctly:
   - For local development: `GOOGLE_APPLICATION_CREDENTIALS` environment variable is set correctly
   - For Replit: `GOOGLE_PROJECT_ID`, `GOOGLE_CLIENT_EMAIL`, and `GOOGLE_PRIVATE_KEY` are set correctly
4. Look for errors in the server logs

For more information, see the [Google Cloud Text-to-Speech documentation](https://cloud.google.com/text-to-speech/docs). 