# Level Lab · Game Forge asset library

A complete, folder-driven React + Vite library for the approved Level Lab design, ready for a public GitHub repository and GitHub Pages. No account, database or paid service is required. Students browse, search, filter, preview, download individual files and build ZIP packages.

## What is included

**1,050 asset concepts** and **1,137 game files**: all 1,042 original concepts / 1,129 original files from the 21 production batches, plus eight new 64 × 64 ground blocks in batch 22. The original 1,129 files are preserved byte for byte. There are now 66 ground concepts, with 68 ground PNG files.

The new materials are red brick, cobblestone, sandstone masonry, Welsh dry-stone, coal-bearing rock, cooled basalt, terracotta and mossy temple stone. Each new block has a full opaque 64 × 64 canvas, top-left origin (0, 0) and rectangular mask (0, 0)–(63, 63). Place instances on multiples of 64 at scale 1. These are solid blocks, not liquid hazards.

There is one catalogue card per concept. Characters default to their movement strips. Existing static and legacy idle exports remain available under **Other existing exports**, so none of the previously produced files is discarded. Three concepts have two primary exports; both enter a package when that concept is selected. The basket reports concepts and download file counts separately.

The original production archives, source artwork, diagnostic pictures and nine WAV music masters remain in the original batch archives. They are not student game assets and are not duplicated here.

## Student features

- Category browsing, multiword search, theme/environment/movement filters and real sorting.
- Category or filtered-result bulk addition with an explicit count; duplicate prevention.
- Movement playback, mirroring, frame views, horizontal background repeat and audio controls.
- Original filenames and bytes, including `_strip4.png`; individual and ZIP downloads.
- Collapsible grouped basket, removal, package naming, import notes and download progress/cancellation.
- Basket saved in the current browser; portable save/load selection files for another computer.
- Preview size buttons for 4, 6 or 8 cards per row; remembers the preference in this browser and fits fewer columns when space is limited.
- Responsive layout, fullscreen, keyboard controls, accessible modal dialogs and reduced-motion support.
- Original sizes and SHA-256 verification on download where the browser supports Web Crypto.
- Four concurrent file requests, bounded retries and a 30-second request timeout. A failed file stops the ZIP; it never silently downloads a partial package.

## Publish on GitHub Pages

Recommended: use a dedicated public repository for this library so workbook deployments remain independent.

1. Extract the complete ZIP. In **GitHub Desktop → File → New repository**, create a repository called `level-lab-assets` in a folder of your choice. Use `main` as its default branch.
2. Copy the **contents** of the extracted `Game_Forge_Asset_Library` folder into the new repository folder. `package.json`, `assets/`, `src/`, `public/` and the hidden `.github/` folder must be directly at its root. Do not copy the outer folder or ZIP itself. The supplied `.gitignore` excludes `preview/`, `node_modules/` and generated build files.
3. In GitHub Desktop, enter `Add Game Forge asset library` as the summary and **Commit to main**. Choose **Publish repository**, clear **Keep this code private**, and publish. If you already created a public repository, clone it with Desktop, copy the project contents into that folder, commit and **Push origin** instead.
4. On the repository website, open **Settings → Pages → Build and deployment → Source**, then select **GitHub Actions**. The project already includes its workflow; you do not need to create a new one.
5. Open **Actions → Build asset catalogue and publish library → Run workflow → main → Run workflow**. This also fixes an initial deployment that started before Pages was enabled. Wait for both `build` and `deploy` to turn green.
6. Open the live link in **Settings → Pages**. Test an individual sprite, movement strip, audio file and mixed ZIP on the school network before sharing with students.

For a repository named `level-lab-assets`, the usual URL is `https://YOUR-USERNAME.github.io/level-lab-assets/`. The actual URL displayed by GitHub is authoritative. No npm, Python or build commands are needed on your computer to publish this way; GitHub runs the build.

The workflow deliberately serves original files from `raw.githubusercontent.com`, while Pages serves only the interface, small previews and catalogue. It pins download URLs to the same commit as the deployed catalogue. This avoids old catalogue/new file mismatches during updates. The originals are excluded from the Pages deployment artifact. Public repository storage still has its own limits; this is not unlimited hosting.

No GitHub credentials are sent to students, and their browsers do not repeatedly query GitHub's API to discover files. On school devices, both the Pages domain and `raw.githubusercontent.com` must be accessible. If the latter is blocked, use the local-asset build below; the current complete library fits within 1 GB comfortably.

**Important:** merely placing images in folders does not exclude them from a Pages deployment. The separation here comes from the included build workflow. Do not replace it with a whole-repository Pages publish.

## Add new assets without changing site code

Upload a PNG, OGG or WAV into the appropriate `assets` category folder, optionally inside a theme subfolder. Commit the change. GitHub Actions scans the folders and publishes the updated library automatically after the build succeeds.

Example:

```
assets/players/woodland/sNewExplorerMove_strip4.png
assets/collectables/welsh/sDaffodilToken.png
assets/backgrounds/desert/sDesertSunset.png
assets/audio/sndNewJump.wav
```

The first directory supplies the category. Subfolders become tags. The filename supplies a readable title; image dimensions and frame count are measured. The final `_strip4` means four equal horizontal frames. The catalogue total, category totals and thumbnails update automatically. Uploading only to a local folder does not update the live site until you commit and push it.

Supported folders: `players`, `enemies`, `ground`, `hazards`, `collectables`, `endpoints`, `powerups`, `projectiles`, `decorations`, `backgrounds`, `interface`, `audio`.

Use GameMaker-safe filenames beginning with `s` for PNG sprites, or `snd` for audio. No spaces. A strip must end `_stripN.png`, where N is its frame count and its width divides evenly by N. The generator fails clearly for a malformed strip, invalid JSON or duplicate download filename.

### Optional metadata for better discovery and import notes

Add a sibling file with `.json` appended to the **whole filename**. For example `sNewExplorerMove_strip4.png.json`:

```json
{
  "id": "PL_NEW_EXPLORER",
  "title": "New woodland explorer",
  "tags": ["woodland", "adventure", "Welsh"],
  "variant": "movement",
  "origin": [32, 96],
  "fps": 8,
  "mask": {"left": 20, "top": 30, "right": 43, "bottom": 95},
  "form": "quadruped",
  "placement": "Bottom-centre origin. Use a fixed mask across the movement frames."
}
```

Names, tags, import settings and new files are data edits, not website recoding. Use the same explicit `id` on multiple variants of one concept. Each filename must be unique within its category, including theme subfolders. Without an ID, the generator creates a stable ID from category + filename; moving a theme subfolder does not change it, but renaming the file does. Add an explicit ID before renaming if you need to preserve saved baskets.

Recognised variants: `movement`, `primary`, `static`, `idle`. Movement and primary files enter packages; static/idle alternatives stay in the detail view. New character strips infer the movement role from `_stripN`. A sprite has only one movement animation by default. Players and enemies without an origin sidecar default to bottom-centre; other assets default to top-left. For accurate masks, repeat settings and animation speed, supply the sidecar.

Theme and environment discovery use transparent keyword rules plus tags; the website does not pretend to understand the artwork. Add useful tags when names are vague. Optional `themes` and `environments` arrays can add filter values. For a repeating background set `"repeatHorizontal": true`. OGG defaults to a music loop; use `"loop": false` for a non-looping OGG. WAV length is measured automatically; add `duration` for OGG details.

Existing production sidecars include a `sourceSha256`. If intentionally replacing an existing asset, update that hash after reviewing the new file, or remove that specific source-hash field. The build refuses silent changes to the archived original bytes. Do not change the hash simply to conceal an unintended modification.

## Open the included preview

Extract the ZIP, then double-click `Open_Preview_Windows.bat` (Python 3 required), or run `python3 preview_server.py` on Mac/Linux. This opens the included working build, using the same original files in `assets/`; it needs no Node installation. The preview folder is a snapshot. Use the normal build or GitHub workflow to update it after adding assets.

## Local development and portable deployment

Node.js 24 and Python 3.12+:

```
python -m pip install -r requirements.txt
npm ci
npm run catalogue
npm run dev
```

Complete build with originals alongside the website:

```
npm run build
npm run preview
```

`dist/` then contains the complete static site. It works under a project subpath. Serve it over HTTP(S), not by double-clicking `index.html`, because catalogue and ZIP downloads use browser fetch.

External-file build (PowerShell example):

```
$env:ASSET_BASE_URL = 'https://raw.githubusercontent.com/OWNER/REPOSITORY/COMMIT/assets/'
npm run build:external
```

Use a full commit hash for COMMIT. The supplied GitHub workflow calculates the correct repository and commit automatically, so no owner or URL needs hardcoding for normal deployment. The external build must not be copied alongside an old catalogue. Always build and deploy together.

## Checks and limits

`npm test` runs catalogue and selection/download-planning tests. `npm run build` scans every export. Browser acceptance testing covers filtering, previews, selection persistence, ZIP and strip download, and responsive layouts.

GameMaker IDE/runtime integration remains a separate check. File validation cannot prove how sprites behave with the classroom project's code, camera, collision masks or sound settings. The library supplies explicit import settings instead of claiming those settings are embedded in a PNG.

The artwork is provided here for the school project. This project does not assign a new blanket copyright licence to the existing assets.
