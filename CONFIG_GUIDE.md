# Configuration Guide: SMTP Email & Google Sign-In Setup

This guide provides instructions to connect a real email service (such as Gmail) for OTP code delivery and to set up Google Sign-In for authentication.

---

## 1. Setting up SMTP for Real Gmail OTP Emails

To receive OTP verification codes directly in your email inbox, configure SMTP in the backend:

1. **Enable App Passwords on Gmail:**
   - Go to your Google Account settings: [https://myaccount.google.com/](https://myaccount.google.com/).
   - Enable **2-Step Verification** (required to generate App Passwords).
   - Search for **App Passwords** in the search bar or navigate to Security -> 2-Step Verification -> App passwords (at the bottom).
   - Generate a new App Password (select "Other" or "Mail", and name it e.g., `PlacementAI`).
   - Copy the 16-character password displayed (e.g., `xxxx xxxx xxxx xxxx`).

2. **Configure your Backend `.env` File:**
   - Open [phase3-backend/.env](file:///c:/Users/DELL/OneDrive/Desktop/prepare/phase3-backend/.env).
   - Add the following environment variables:
     ```env
     # SMTP Configuration
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=465
     SMTP_USER=your-gmail-address@gmail.com
     SMTP_PASS=your-16-character-app-password
     EMAIL_FROM="PlacementAI" <your-gmail-address@gmail.com>
     ```
   - Make sure `nodemailer` is installed in the backend folder. (It is loaded dynamically; if missing, run `npm install nodemailer` in `phase3-backend`).

3. **Restart the Backend Server:**
   - Once restarted, OTP requests will bypass console/dev logging and send real emails to your target inbox.

---

## 2. Setting up Google Sign-In (OAuth 2.0)

To configure the official "Sign In with Google" button, obtain a Client ID from the Google Developer Console:

1. **Create a Google Cloud Project:**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Click "Select a project" -> "New Project". Give it a name (e.g., `PlacementAI`) and click **Create**.

2. **Configure the OAuth Consent Screen:**
   - Search for **OAuth Consent Screen** in the top search bar.
   - Select **External** and click **Create**.
   - Fill in the App Name (e.g. `PlacementAI`), User support email, and Developer contact information.
   - Click **Save and Continue** through the scopes and test users sections.

3. **Create OAuth Credentials:**
   - Go to the **Credentials** tab on the left menu.
   - Click **+ Create Credentials** at the top -> **OAuth client ID**.
   - Set **Application type** to **Web application**.
   - Under **Authorized JavaScript origins**, add:
     - `http://localhost:5173` (default Vite dev server port)
     - `http://localhost:3000` (if using standard React port)
   - Under **Authorized redirect URIs**, add the same URLs.
   - Click **Create**. Copy the **Client ID** generated.

4. **Add Client ID to Environment Files:**
   - **Frontend:**
     - Create/modify a `.env` file inside the `phase2-react/` folder.
     - Add:
       ```env
       VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
       ```
   - **Backend:**
     - Edit [phase3-backend/.env](file:///c:/Users/DELL/OneDrive/Desktop/prepare/phase3-backend/.env).
     - Add:
       ```env
       GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
       ```

5. **Restart both Frontend and Backend Servers:**
   - The native official Google Sign-In SDK button will now load automatically on the login screen.
