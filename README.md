# Paint by Numbers

A React + TypeScript + Vite app for turning uploaded photos into paint-by-numbers templates.

## Rendering strategy

The app is still a client-rendered SPA, but the homepage now uses a lightweight prerender step during `npm run build`.

- Vite builds the normal client bundle.
- `scripts/prerender-home.mjs` injects static homepage HTML into `dist/index.html` using copy aligned with the in-app welcome content.
- `scripts/check-prerender-home.mjs` validates that the built HTML still contains key homepage text.
- React then hydrates/replaces that content on load so the interactive app still works normally.

This improves SEO and social/shared-page readability for `/` without introducing a full SSR framework migration.

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

After the build completes, `dist/index.html` contains meaningful homepage HTML before JavaScript runs.

## Google Analytics (GA4)

This app supports optional GA4 tracking for a static deployment.

1. Create a GA4 web data stream and copy your measurement ID (for example `G-XXXXXXXXXX`).
2. Set `VITE_GA_MEASUREMENT_ID` in your hosting environment (Render dashboard or `render.yaml` with secret sync).
3. Build and deploy as usual.

When `VITE_GA_MEASUREMENT_ID` is present, the app tracks:

- `page_view`
- `image_upload`
- `pipeline_start`
- `pipeline_complete`
- `pipeline_error`
- `export`

When `VITE_GA_MEASUREMENT_ID` is not set, no analytics scripts are loaded.

## Google AdSense (home page only)

The home page supports one manual responsive display ad below the feature cards.
It is removed when someone opens the file picker, drops/pastes an image, imports
a project, or resumes a saved project. It stays off for the rest of that visit.
The editor and static guide pages do not mount ad units. The AdSense script loads
only when the configured home-page unit mounts; removing the unit does not unload
JavaScript that Google has already executed.

### Verify this site first

The publisher `ca-pub-8829035634388232` is configured in `.env.production`.
`index.html` includes its verification meta tag and `public/ads.txt` authorizes
the same publisher. Neither verification method loads ads.

1. Deploy these changes.
2. In AdSense, add the site under **Sites**, select **Meta tag**, then **Verify**
   and **Request review**. The tag is included in the built HTML before JavaScript
   runs. You can also verify using the published `/ads.txt` file.
3. Wait for the site's status to become **Ready**.

### Enable the home-page placement

1. Keep **Auto ads off** for this site in AdSense. This is required to keep the
   creator free of automatically inserted ads and overlays: it shares `/` with
   the landing page, so URL exclusions cannot distinguish the two screens.
2. Create a unit under **Ads → By ad unit → Display ads**, choose **Responsive**,
   and copy the numeric `data-ad-slot` from **Save and get code**.
3. Set `VITE_ADSENSE_HOME_SLOT` in the hosting environment or `.env.production`.
   Set up the applicable consent message in AdSense **Privacy & messaging** before
   enabling live ads. Use the published `/privacy` URL in the message. Google's
   certified CMP is available through **Privacy & messaging → European regulations**;
   configure the applicable regional messages and verify the consent choices before
   launch. The privacy page and footer disclosures are not a consent management platform.
4. Rebuild and deploy. Both a valid `VITE_ADSENSE_CLIENT_ID` and slot are required;
   a blank slot leaves the page unchanged and loads no AdSense script.

For local testing, set both IDs and `VITE_ADSENSE_TEST_MODE=true` in `.env.local`.
This requests test ads (`data-adtest="on"`). Development otherwise loads no ads.
Do not click live ads to test them. To disable the integration, clear the slot
and rebuild. If changing publishers, also update the verification tag and ads.txt.

Google's documentation: [site verification](https://support.google.com/adsense/answer/7584263?hl=en),
[display ad units](https://support.google.com/adsense/answer/9274025?hl=en), and
[Auto ads settings](https://support.google.com/adsense/answer/9261307?hl=en).

## Bundle splitting

To reduce the size of the main entry bundle:

- export controls are lazy-loaded instead of being bundled into the initial app shell
- heavy dependencies such as `jspdf`, `html2canvas`, and state/i18n libraries are emitted into separate Rollup chunks
- core upload, editing, and preview flows stay in the primary bundle

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
