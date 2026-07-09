# Share with coworkers in 3 minutes

**Goal:** Get the extension installed on your team's Chrome browsers without waiting for store review.

## 1. Build & prepare release

```bash
pnpm build
VERSION=0.2.0 pnpm release
```

## 2. Create the zip

```bash
cd .output/release
zip -r better-azure-devops-0.2.0-sideload.zip better-azure-devops-0.2.0/
```

## 3. Create GitHub Release (optional but recommended)

```bash
git tag v0.2.0 && git push origin v0.2.0
gh release create v0.2.0 \
  --notes-file .output/release/RELEASE_NOTES.md \
  .output/release/better-azure-devops-0.2.0-sideload.zip
```

Then send coworkers the link:
```
https://github.com/vreddi/better-azure-devops/releases/tag/v0.2.0
```

**Or** directly email/Slack the `.zip` file.

## 4. Coworker installation (one-time)

**Each coworker should:**

1. Download `better-azure-devops-0.2.0-sideload.zip`
2. Unzip it
3. Open Chrome → type `chrome://extensions`
4. Toggle **Developer mode** (top-right) → **ON**
5. Click **Load unpacked**
6. Select the unzipped folder
7. ✅ Done! Go to any Azure DevOps PR list

## 5. Updating later

When you release v0.2.1:
- Coworkers download the new `.zip`
- Replace the old folder
- Refresh the extension in `chrome://extensions` (the circular refresh icon)

---

**Took ~3 minutes. Your team is using it now.**

For public launch later, see [DISTRIBUTION.md](DISTRIBUTION.md) for Chrome Web Store instructions ($5, 1–3 weeks review).
