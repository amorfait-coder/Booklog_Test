# Booklog

Booklog is a browser-based reading journal app for writing posts about books.

## Features

- Create, edit, delete, search, filter, and sort book posts
- Store posts in browser `localStorage`
- Record book excerpts and personal comments
- Scan book text from photos with Tesseract.js
- Fill book cover and metadata from YES24 search results through a CORS proxy

## Run locally

Open `index.html` in a browser.

## Web deployment

This repository includes a GitHub Pages workflow at `.github/workflows/deploy-pages.yml`.

After GitHub Pages is enabled with the source set to GitHub Actions, pushes to `main` deploy the app as a web app.
