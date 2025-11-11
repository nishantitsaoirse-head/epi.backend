# Firebase Setup Instructions

This document explains how to set up Firebase for authentication and how to obtain the Firebase UID needed for creating an admin user.

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the steps to create a new project
3. Give your project a name (e.g., "epi-project-demo")
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Set Up Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Enable the "Google" sign-in method (click on it and toggle the switch to "Enabled")
4. Add your authorized email domain (e.g., `example.com`) or use the default test mode
5. Click "Save"

## Step 3: Get Your Firebase Web Configuration

1. Go to "Project settings" (the gear icon near the top of the left sidebar)
2. Under the "General" tab, scroll down to "Your apps"
3. Click the web icon (</>) to add a new web app
4. Register your app with a nickname (e.g., "epi-admin")
5. Click "Register app"
6. Copy the Firebase configuration object (`firebaseConfig`) shown on the page
7. Update the `.env.local` file in the `admin-panel` directory with these values

## Step 4: Create a Firebase Admin User

1. Go to "Authentication" in the left sidebar
2. Click "Add user" button at the top
3. Enter the email and password for your admin user
4. Click "Add user"
5. Once created, click on the user in the users list to view their details
6. Copy the "User UID" value
7. Open the file `backend/scripts/create-admin.js`
8. Replace `REPLACE_WITH_FIREBASE_USER_UID` with the UID you copied

## Step 5: Generate a Firebase Service Account Key

1. Go to "Project settings" in the Firebase console
2. Go to the "Service accounts" tab
3. Click "Generate new private key"
4. Save the JSON file
5. Open the file and find the following values:
   - `project_id`
   - `client_email`
   - `private_key`
6. Update these values in the `backend/.env` file

## Step 6: Sign In to the Admin Panel

1. Start the backend and admin panel
2. Navigate to the admin panel URL (http://localhost:3000)
3. Click "Sign in with Google"
4. Sign in with the admin email you created in Step 4
5. You will be granted admin access to the dashboard 