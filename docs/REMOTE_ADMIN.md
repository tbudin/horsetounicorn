# Remote admin setup

The admin panel writes article content (`metadata.json` + `content.json`)
and uploaded images. In **local dev** those writes go straight to the
filesystem — easy, no setup. In **production** the deployed Next.js
runtime has a read-only filesystem, so writes need somewhere persistent to
land. This doc sets up the production path:

```
                    ┌───────────────────────┐
                    │  admin browser (you,  │
                    │  anywhere)            │
                    └──────────┬────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │  horsetounicorn on Vercel    │
                │  (Next.js)                   │
                └───────┬─────────────┬────────┘
                        │             │
                  image │             │  metadata.json + content.json
                  upload│             │  commit
                        ▼             ▼
                ┌───────────────┐   ┌──────────────┐
                │ Cloudflare R2 │   │   GitHub     │
                │ (object store)│   │ commits → re-│
                │ + custom CDN  │   │ deploy Vercel│
                └───────────────┘   └──────────────┘
```

Read access on the public site still hits the local filesystem — the
deployed bundle contains the JSON, served at request time. A new commit
triggers Vercel to rebuild, which is when the new article appears.

## 1. Cloudflare R2 bucket (images)

1. Sign in at <https://dash.cloudflare.com> → **R2 Object Storage** → **Create bucket**.
2. Bucket name: `horsetounicorn-media` (anything works; whatever you set
   goes into `R2_BUCKET`). Pick the **EUR** location or the one closest to
   your readers.
3. **Settings → Public access → Custom domains → Connect domain.**
   Use something like `cdn.horsetounicorn.com`. R2 will give you a CNAME
   to add to Cloudflare DNS. Once it goes green, the public URL for the
   bucket becomes `https://cdn.horsetounicorn.com/<key>`.
   *Alternative*: skip the custom domain and use the default
   `https://pub-<hash>.r2.dev` URL — works, just less pretty.
4. **R2 → Manage R2 API Tokens → Create token.**
   - Permissions: **Object Read & Write**
   - Specify bucket: the one you just created
   - TTL: forever
   Note the Access Key ID, Secret Access Key, and your Cloudflare Account
   ID.

Env vars to set in Vercel:

```
R2_ACCOUNT_ID            (Cloudflare account ID)
R2_ACCESS_KEY_ID         (Access Key ID from the token)
R2_SECRET_ACCESS_KEY     (Secret Access Key from the token)
R2_BUCKET                horsetounicorn-media
R2_PUBLIC_BASE_URL       https://cdn.horsetounicorn.com
```

## 2. GitHub Personal Access Token (article content)

1. <https://github.com/settings/tokens?type=beta> → **Generate new token (fine-grained)**.
2. **Resource owner**: your user.
3. **Repository access**: **Only select repositories** → pick this repo.
4. **Permissions → Repository permissions**:
   - **Contents**: **Read and write**
   - **Metadata**: **Read-only** (auto-required)
5. Expiration: 12 months is fine. Set a calendar reminder.
6. Copy the token (it's only shown once).

Env vars to set in Vercel:

```
GITHUB_TOKEN             (the PAT, starts with github_pat_...)
GITHUB_OWNER             thomasbudin
GITHUB_REPO              horsetounicorn
# Optional, defaults shown:
GITHUB_BRANCH            main
GITHUB_AUTHOR_NAME       Tom B
GITHUB_AUTHOR_EMAIL      thomasbudin@gmail.com
```

## 3. Vercel project setup

1. **Vercel dashboard → Project → Settings → Environment Variables.**
2. Add all of the R2 + GitHub vars above, plus the existing Resend / admin
   vars from `.env.example`. Apply to **Production** and **Preview**.
3. **Git → Connected repository** is already wired if you deployed via
   Vercel. Make sure auto-deploy on push to `main` is enabled (default).

## 4. Verify

After deploy:

1. Visit `https://horsetounicorn.com/admin/login` from your phone.
2. Log in with `ADMIN_PASSWORD`.
3. Open any article and try:
   - Edit a paragraph → **Save** → check the repo's commit log; you should
     see a new commit *"Update article <slug>"* signed by your PAT.
     Vercel kicks off a deploy automatically.
   - Upload a cover → check that the article reloads with the new image
     loading from `https://cdn.horsetounicorn.com/articles/<slug>/cover.png`.

Within ~30–60 seconds of save (the Vercel build time), the change is live.

## How fallback works

The code checks at request time whether the env vars are set. Without
them, both R2 and the GitHub commit are skipped and writes go to the local
filesystem — same as before. So **local dev still works with zero
setup**. Set the env vars only when you want remote admin to work.
