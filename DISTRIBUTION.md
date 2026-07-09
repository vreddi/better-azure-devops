# Distribution Guide

## Quick comparison

| Method | Time | Cost | Audience | Review |
|--------|------|------|----------|--------|
| **GitHub Release + Sideload** | ⚡ 5 min | $0 | Team / coworkers | None |
| **Chrome Web Store** | 🐢 1–3 weeks | $5 | Public / millions | Google review |

---

## Option 1: GitHub Releases (Fast & easy for teams)

Share with coworkers **instantly** by uploading a release to your repo. They download
and sideload in Chrome locally.

### Step 1: Prepare the release

```bash
pnpm build                      # production build
VERSION=0.2.0 pnpm release      # creates release notes + instructions
```

This generates:
- `.output/release/better-azure-devops-0.2.0/` — extension folder
- `.output/release/RELEASE_NOTES.md` — installation guide for coworkers

### Step 2: Create a GitHub Release with the .zip

```bash
# Create the zip archive
cd .output/release
zip -r better-azure-devops-0.2.0-sideload.zip better-azure-devops-0.2.0/

# Push a git tag
git tag v0.2.0
git push origin v0.2.0

# Create the GitHub Release (uploads the .zip automatically)
gh release create v0.2.0 \
  --title "v0.2.0: Conventional commit labels" \
  --notes-file RELEASE_NOTES.md \
  better-azure-devops-0.2.0-sideload.zip
```

Or manually via [GitHub.com](https://github.com/vreddi/better-azure-devops/releases/new):
1. Click **Releases** → **Draft a new release**
2. Create tag: `v0.2.0`
3. Title: `v0.2.0: Conventional commit labels`
4. Description: paste contents of `.output/release/RELEASE_NOTES.md`
5. **Attach binaries** → drag-drop `.zip`
6. **Publish release** ✓

### Step 3: Share with coworkers

Send them the release link:
```
https://github.com/vreddi/better-azure-devops/releases/tag/v0.2.0
```

### Coworker installation

1. Download `better-azure-devops-0.2.0-sideload.zip` from the release
2. Unzip the folder (e.g., to Downloads)
3. Open Chrome → `chrome://extensions`
4. Toggle **Developer mode** (top-right corner) → **ON**
5. Click **Load unpacked**
6. Select the unzipped folder
7. ✅ Extension is live!

#### Updating later
When you release v0.2.1:
1. Repeat steps 1–3 above
2. Coworkers download the new `.zip` and replace their old folder
3. Refresh the extension in `chrome://extensions` (refresh icon)

---

## Option 2: Chrome Web Store (Official, with review)

Publish publicly so anyone can install via the official store. Google reviews extensions for security, privacy, and policy compliance.

### Prerequisites

- **Google account** with 2-Step Verification enabled
- **$5 one-time registration fee**
- Publisher name (how you want to be credited)
- Privacy policy URL (if you collect any user data — this one doesn't)

### Step 1: Register as a Chrome Web Store developer

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Sign in with your Google account (enable 2-Step Verification if needed)
3. Pay the $5 registration fee
4. Accept the Developer Agreement
5. Fill out your publisher profile (name, contact email, address)

### Step 2: Prepare your submission

Gather these assets (beyond what you have):

**Required:**
- 128×128 extension icon ✓ (you have `public/icon/128.png`)
- 1–5 screenshots (1280×800 or 640×400 minimum)
  - Show the PR list with pills rendered
  - Show the settings/theme picker page
- Short description (132 chars max)
- Full description (4,000 chars max, include feature list)

**Optional:**
- 440×280 small promo tile (png/jpg)
- 1400×560 marquee tile (png/jpg)

**Privacy & Permissions:**
- Explain why you need `storage` permission (it's obviously safe; just document it)
- State: "This extension does not collect, transmit, or sell any user data."

### Step 3: Create the store listing

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click **Create new item** → upload `.output/chrome-mv3/` folder as a `.zip`
3. Fill in store listing details:
   - Title: "Better Azure DevOps"
   - Summary: "Conventional commit labels for pull requests"
   - Description: (feature list, usage instructions)
   - Category: "Productivity"
   - Language: English
   - Permissions explanation: "storage — saves your tag customizations and theme choice"
4. Upload screenshots + icon
5. Set visibility to **Private** (to test before public)
6. **Submit for review**

### Step 4: Google's review (1–3 weeks)

Google checks:
- ✓ Manifest V3 compliance
- ✓ No malware/obfuscation
- ✓ Permissions match claimed functionality
- ✓ Privacy policies are accurate
- ✓ No policy violations (hate speech, malware, etc.)

If approved: ✅ Listed publicly, auto-updates for all users
If rejected: 📧 You'll get detailed feedback; fix and resubmit

### Step 5: Auto-updates

Once live, users who install get automatic updates whenever you submit a new version:
1. Bump version in `package.json`
2. `pnpm build`
3. Upload the new `.output/chrome-mv3/` folder
4. Submit for review again (usually 1–2 weeks)
5. Once approved, all users auto-update

---

## Current status

- ✅ **Ready for release** (v0.1 or v0.2.0)
- ✅ **Sideload path** — share with team immediately
- ⏳ **Web Store path** — set up when you're ready for public launch

### Recommended next steps

**For the team (now):**
```bash
pnpm build && VERSION=0.2.0 pnpm release
# Then create GitHub Release (see Option 1 above)
# Share release URL with coworkers
```

**For public launch (later):**
1. Create screenshots + write descriptions
2. Register Chrome Web Store developer account ($5)
3. Submit for review
4. Once approved, announce the Web Store link

---

## References

- [Chrome Web Store Publishing Guide](https://developer.chrome.com/docs/webstore/publish)
- [Register as a Chrome Developer](https://developer.chrome.com/docs/webstore/register)
- [Chrome Web Store Policies](https://developer.chrome.com/docs/webstore/program-policies/policies)
- [Extension Sideloading Guide](https://developer.chrome.com/docs/extensions/how-to/distribute)
