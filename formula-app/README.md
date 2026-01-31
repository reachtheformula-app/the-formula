# The Formula

**Prepared Nannies. Informed Parents. Better Care.**

A curriculum-based childcare management app for nannies, featuring 50 weekly themes, AI-powered lesson planning, activity logging, and parent communication tools.

## Features

- 📚 **50 Curated Weekly Themes** - Ready-to-use curriculum covering science, nature, holidays, social-emotional learning, and life skills
- 🤖 **AI-Powered Lesson Planning** - Generate custom weekly curricula based on any topic
- 👶 **Age-Appropriate Content** - Tailored activities for ages 0-5
- 📝 **Activity Logging** - Track daily activities with photo support
- ✉️ **Parent Letters** - AI-generated daily summaries for parents
- 👨‍👩‍👧 **Children Management** - Store profiles, allergies, and parent contacts
- 🏆 **Milestone Tracking** - Record developmental achievements
- 🌍 **Optional Language Learning** - French, Spanish, or custom vocabulary
- 🔐 **User Authentication** - Secure login with individual data storage

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Lucide Icons
- Claude AI API (for letter and curriculum generation)

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Deploying to Netlify

### Option 1: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

### Option 2: Deploy via GitHub

1. Push this code to a GitHub repository
2. Log in to [Netlify](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect to your GitHub repository
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Click "Deploy site"

### Option 3: Drag & Drop

1. Run `npm run build` locally
2. Go to [Netlify Drop](https://app.netlify.com/drop)
3. Drag the `dist` folder to deploy

## Environment Variables

For AI features to work, you'll need to configure the Anthropic API. The app currently makes direct API calls which will work in development but may need adjustment for production (consider using Netlify Functions for the API proxy).

## Project Structure

```
formula-app/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx        # Main application component
│   ├── main.jsx       # Entry point
│   └── index.css      # Tailwind imports
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── netlify.toml       # Netlify configuration
└── README.md
```

## Data Storage

User data is stored in the browser's localStorage, scoped per user:
- User accounts are stored globally
- Each user's data (children, logs, milestones, custom weeks) is stored with their user ID prefix

## License

© 2024 The Formula. All rights reserved.
