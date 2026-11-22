EDUCATION - installable web app (PWA)

WHAT'S IN THIS ZIP
  index.html      the site
  manifest.json   app name, colours, cake icons, shortcuts
  sw.js           service worker (offline support + update bar)
  favicon.svg / favicon.ico
  images/         cake icons (192, 512, maskable, apple-touch, favicons)

BEFORE YOU UPLOAD
  1. Copy your own pictures into the images/ folder:
       students.png, about-page.jpg, about-section-bg.png
     (and any course/feature/review images the site uses). They were not
     included here. The app still installs without them.
  2. Upload the whole folder to HTTPS hosting (Netlify, Vercel, GitHub Pages,
     Firebase...). Service workers do not run on plain http, except localhost.
     Keep index.html, manifest.json and sw.js together in the same folder.

INSTALLING
  Android / Chrome / Edge: use the Install button on the site's settings
  page, or the browser's "Install app" option.
  iPhone / iPad: Safari > Share > Add to Home Screen.

WHEN YOU CHANGE THE SITE
  Open sw.js and change VERSION = 'v1' to 'v2' (then v3...). Installed apps
  will show the "A new version is ready" bar and update when tapped.

BIRTHDAY SURPRISE
  In index.html, search for "bday-loader" and set ENABLED: false after the
  birthday, or ONLY_WITH_LINK: true to show it only at yoursite/?for=chizoba.
  Bump VERSION in sw.js after changing it.
