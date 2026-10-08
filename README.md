# JMK 18 Empire Pro

A static PWA business suite for JMK 18 Empire with:
- business cards and service tools
- AI utility generators
- fleet tracking dashboard
- local storage for saved data
- installable offline app support

## Run locally

Open `index.html` in a browser or run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages

Push this repo to GitHub and enable GitHub Pages in the repository settings:
1. Go to Settings > Pages
2. Select the `main` branch
3. Use the root folder
4. Save

Your site will be published at:
`https://<username>.github.io/jmk-18-empire-pro/`

## Notes

- AI tools run with optional OpenAI API key, or fallback local generation.
- Fleet GPS is browser-based and uses local storage.
- The app is designed for quick deployment and future React upgrade.
