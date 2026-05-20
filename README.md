# Ana — AI Style Transfer Machine

An agentic style assistant that lets you apply any visual style to photos using AI. Describe a look, upload a reference image, and watch AI transfer the mood, lighting, outfit, and art direction into your subject photo.

---

## 🔐 Login & Account Access

This app uses **Google Sign-In** for authentication. Every user account is tied to a Google email address.

**To log in:**
- Click the Google login button on the welcome screen
- Select your Google account
- You'll be redirected back to the app once authorized

**Important:**
- If you're blocked from logging in, your admin may need to add your Google email to the Firebase project console (instructions below)
- Do not share your login credentials — each team member should use their own Google account

---

## 🌐 External Services Used

This app connects to third-party services that require active accounts and API keys. Here's what powers the app:

| Service | Purpose | Account Needed |
|---|---|---|
| **Firebase** | User authentication, app hosting | Google account |
| **Google AI (Gemini)** | Image generation & AI chat | Google account + API key |
| **Pinecone** | Style library search & storage | Pinecone account + API key |

All three services use **Google Sign-In**, so a single Google account can access all of them.

---

## 🔑 API Keys & Firebase Console

Some features require manual setup in the Firebase console. Here's what to check if something breaks:

### Finding the Firebase Console
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Select your project
3. Use the sidebar to navigate to different features

### Common Issues

**"Login failed" or users can't authenticate:**
- Open Firebase Console → **Authentication** → **Sign-in method**
- Make sure "Google" is enabled
- Check the **Authorized domains** list — your app's domain must be listed there
- For new team members, add their Google email under **Authentication → Users**

**Image generation not working:**
- Check that the **Gemini API key** in your environment (.env) is still valid
- Go to [aistudio.google.com](https://aistudio.google.com) and verify your quota hasn't been exceeded

**Style library search returning no results:**
- Check the **Pinecone console** at [app.pinecone.io](https://app.pinecone.io)
- Make sure your index is still active and has data in it

---

## 🚀 Publishing & Deployment

**The `main` branch is your live branch.**

When you push to `main`, Vercel automatically builds and deploys the changes to your production URL. There is no separate "staging" branch — `main` is always live.

**To publish anything new:**
1. Make your changes in your local branch
2. Commit and push to `main`
3. Vercel detects the push and deploys within ~2 minutes
4. Check your live URL to confirm the update

**Do not push directly to `main` for experimental changes.** Create a separate branch for testing, then merge when ready.

---

## 📁 Project Structure

```
/
├── src/
│   ├── app/           # Pages and API routes
│   │   ├── page.tsx   # Main app (Setup, Gallery, Chat)
│   │   └── api/       # Backend endpoints
│   ├── components/    # UI components
│   └── context/       # App-wide state (StyleContext)
├── public/            # Static assets (icons, images)
├── scripts/           # One-time utility scripts
└── .env.local         # API keys (not committed to git)
```

---

## 🧪 Testing Locally

If you want to run the app on your machine:

```bash
# 1. Install dependencies
npm install

# 2. Copy the environment file and add your API keys
cp .env.example .env.local
# Then edit .env.local with your keys

# 3. Start the dev server
npm run dev

# 4. Open http://localhost:3000
```

---

## ❓ Getting Help

If something isn't working:

1. **Check your API keys** — expired or missing keys are the most common cause of failures
2. **Check Vercel deploy logs** — click on the failing deployment to see the error
3. **Check the Firebase console** for authentication errors
4. **Try clearing your browser cache** — stale sessions can cause unexpected behavior

---

*Last updated: May 2026*
