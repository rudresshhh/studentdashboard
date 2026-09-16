# Sister Student Dashboard

A dark, responsive Class 9 student dashboard built with React + Vite.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Production build

```bash
npm run build
```

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Import the repository into Vercel.
3. In Vercel Project Settings → Environment Variables, add:
   - Name: `GEMINI_API_KEY`
   - Value: your Google Gemini API key
4. Redeploy.

The Gemini key is used only by the Vercel serverless function at `/api/chat`; it is not placed in frontend JavaScript.

## Storage note

Student data currently uses browser `localStorage`, so data persists on the same browser/device but is not synchronized between devices.

The timetable photo is stored in browser storage as a data URL. For very large images, resize/compress the image before uploading.

## Important

Do not commit `.env` or expose your Gemini API key in GitHub.
