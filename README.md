# Booklog

Booklog is a browser-based reading journal app for writing posts about books.

## Features

- Create, edit, delete, search, filter, and sort book posts
- Store posts in browser `localStorage`
- Record book excerpts, summaries, and personal comments
- Scan book text from photos with Tesseract.js
- Fill book cover and metadata from Naver Book Search API

## Run Locally

Naver Book Search requires API credentials, so run the local Node server instead of opening `index.html` directly.

```powershell
$env:NAVER_CLIENT_ID="your_naver_client_id"
$env:NAVER_CLIENT_SECRET="your_naver_client_secret"
node server.js
```

Then open `http://localhost:4173`.

## GitHub Pages

This repository includes a GitHub Pages workflow at `.github/workflows/deploy-pages.yml`.

GitHub Pages can host the static app, but it cannot run `server.js` or keep Naver API secrets. The Naver book search button needs a Node host or another backend that exposes `/api/naver-books`.
