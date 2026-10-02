# CasBadge3D — access lock (staff only)

The public site ships the badge/medal engine **only as ciphertext**
(`../app.enc.js`). Nothing renders, previews or exports until a staff
member types the correct pass code into the lock screen (`../gate.js`),
which decrypts the engine in the browser. Wrong code → decryption fails →
nothing runs. There is no copy of the engine on the site to bypass.

This `_src/` folder holds the plaintext source and the build tool. Jekyll
does **not** publish folders starting with `_`, so `_src/` stays in the
repo (version-controlled) but never reaches the live site. **Do not add a
`.nojekyll` file to the repo** — that would turn Jekyll off and expose this
folder.

## Changing the staff pass code (rotation)

1. Open a terminal in this `_src/` folder.
2. Run (Node 16+ required, no installs needed):

   ```
   node lock-build.mjs "YourNewStaffCode"
   ```

   (Or run `node lock-build.mjs` and it will prompt you.)

3. It rewrites `../app.enc.js`. Commit and push:

   ```
   git add casBadge3d/app.enc.js
   git commit -m "Rotate CasBadge staff code"
   git push
   ```

The new code is live once GitHub Pages rebuilds (~1 min). The old code
stops working immediately — the blob is re-encrypted from scratch.

## Editing the tool itself

Edit `_src/app.js` as normal, then re-run the build (step 2) so the change
is re-encrypted into `app.enc.js`. The plaintext `app.js` is never served.

## What this does / doesn't protect

- Stops anyone **without** the code from previewing, screenshotting a live
  render, or exporting SVG/PNG/JPG/STL — the engine isn't decryptable.
- It's a single shared secret. If it leaks, rotate it (above).
- It can't stop a staff member who HAS unlocked the tool from sharing an
  exported badge. That's an insider-trust matter, not a technical one.
