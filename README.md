# Instagram Wise

A web application for managing and viewing Instagram collections.

## Deployment on Repl.it

1. Create a new Repl and select "Import from GitHub"
2. Enter your repository URL
3. Once imported, set up the following secrets in your Repl's environment variables:

```
INSTAGRAM_USERNAME=your_instagram_username
INSTAGRAM_PASSWORD=your_instagram_password
EMAIL_SERVICE=gmail
EMAIL_USER=your_email
EMAIL_PASSWORD=your_email_password
EMAIL_RECIPIENT=recipient_email
NODE_ENV=production
```

4. Click the "Run" button to start the application

## Development Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
npm run install-all
```

3. Create `.env` files:
   - In `/backend/.env`: Copy the environment variables listed above
   - In `/frontend/.env`: Add `REACT_APP_API_URL=http://localhost:3000`

4. Start the development servers:
```bash
npm run dev
```

## Building for Production

```bash
npm run build
```

This will build both the frontend and backend applications.

## Project Structure

- `/frontend` - React frontend application
- `/backend` - Express backend server
- `/data` - JSON data storage

## Features

- View and manage Instagram saved posts
- Organize posts into collections
- Daily digest of posts
- Email notifications
- Image proxy for Instagram images