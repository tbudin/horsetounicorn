/**
 * GitHub commit-on-save helper. Uses the Git Tree API so we can rewrite
 * multiple files in a single atomic commit, which is what we want when
 * saving an article (metadata.json + content.json together) and especially
 * for slug renames (delete old folder + write new folder in one shot).
 *
 * Required env:
 *   GITHUB_TOKEN          — fine-grained PAT with `contents: read & write`
 *                           on this repo (Settings → Developer settings →
 *                           Personal access tokens → Fine-grained)
 *   GITHUB_OWNER          — repo owner ("thomasbudin")
 *   GITHUB_REPO           — repo name ("horsetounicorn")
 *
 * Optional env:
 *   GITHUB_BRANCH         — defaults to "main"
 *   GITHUB_AUTHOR_NAME    — defaults to "horsetounicorn admin"
 *   GITHUB_AUTHOR_EMAIL   — defaults to "admin@horsetounicorn.com"
 */
import { Octokit } from '@octokit/rest';

let _octokit: Octokit | null = null;

function getOctokit(): Octokit {
  if (_octokit) return _octokit;
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN env var is missing');
  _octokit = new Octokit({ auth: token });
  return _octokit;
}

function getRepo() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  if (!owner || !repo) {
    throw new Error('GITHUB_OWNER / GITHUB_REPO env vars are missing');
  }
  return { owner, repo };
}

function getBranch(): string {
  return process.env.GITHUB_BRANCH || 'main';
}

function getAuthor() {
  return {
    name: process.env.GITHUB_AUTHOR_NAME || 'horsetounicorn admin',
    email: process.env.GITHUB_AUTHOR_EMAIL || 'admin@horsetounicorn.com',
  };
}

export interface FileWrite {
  /** Repo-relative path, e.g. "content/articles/foo/metadata.json". */
  path: string;
  /** UTF-8 file contents. */
  content: string;
}

/**
 * Atomically write a set of files (and optionally delete a set of paths) in
 * a single commit. Each `write` either creates or updates the file. Each
 * `deletePath` removes the file from the tree.
 *
 * Implementation: fetch the current branch HEAD, create blobs for the
 * writes, build a new tree using the old tree as base + the new entries
 * (with `sha: null` for deletes), create a commit pointing at the tree,
 * fast-forward the branch.
 */
export async function commitFiles({
  writes,
  deletePaths = [],
  message,
}: {
  writes: FileWrite[];
  deletePaths?: string[];
  message: string;
}): Promise<{ commitSha: string; commitUrl: string }> {
  const octokit = getOctokit();
  const { owner, repo } = getRepo();
  const branch = getBranch();
  const author = getAuthor();

  // 1. Get the current branch tip and its tree SHA.
  const { data: ref } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  const parentCommitSha = ref.object.sha;
  const { data: parentCommit } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: parentCommitSha,
  });
  const baseTreeSha = parentCommit.tree.sha;

  // 2. Create a blob per write (so we can pass `sha`, which lets the Tree
  //    API accept files of any size and avoids the contents-API 1MB limit).
  const blobs = await Promise.all(
    writes.map(async (f) => {
      const { data } = await octokit.git.createBlob({
        owner,
        repo,
        content: Buffer.from(f.content, 'utf8').toString('base64'),
        encoding: 'base64',
      });
      return { path: f.path, sha: data.sha };
    }),
  );

  // 3. Build the new tree on top of the base.
  const tree = [
    ...blobs.map((b) => ({
      path: b.path,
      mode: '100644' as const,
      type: 'blob' as const,
      sha: b.sha,
    })),
    ...deletePaths.map((p) => ({
      path: p,
      mode: '100644' as const,
      type: 'blob' as const,
      sha: null, // sha: null tells the API to remove the file
    })),
  ];

  // The Octokit typings disallow `sha: null` even though the REST API
  // documents it as the delete signal — cast around the typing.
  const { data: newTree } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseTreeSha,
    tree: tree as unknown as { path: string; mode: '100644'; type: 'blob'; sha: string }[],
  });

  // 4. Create the commit pointing at the new tree.
  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message,
    tree: newTree.sha,
    parents: [parentCommitSha],
    author: { ...author, date: new Date().toISOString() },
    committer: author,
  });

  // 5. Fast-forward the branch ref to the new commit.
  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
    force: false,
  });

  return { commitSha: newCommit.sha, commitUrl: newCommit.html_url };
}

/**
 * List all paths under a directory in the repo, recursively. Used by the
 * slug-rename flow so we know what files to move under the new prefix.
 */
export async function listRepoPaths(prefix: string): Promise<string[]> {
  const octokit = getOctokit();
  const { owner, repo } = getRepo();
  const branch = getBranch();
  const cleanPrefix = prefix.replace(/^\/+|\/+$/g, '');

  // Pull the tree of the prefix folder using contents API. For folders we
  // recurse manually since the GitHub `contents` API only returns one level
  // at a time.
  const paths: string[] = [];
  async function walk(p: string) {
    let entries: Array<{ type: string; path: string; name: string }>;
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: p,
        ref: branch,
      });
      entries = Array.isArray(data)
        ? (data as Array<{ type: string; path: string; name: string }>)
        : [data as unknown as { type: string; path: string; name: string }];
    } catch (err: unknown) {
      // Folder doesn't exist on this branch — return nothing.
      const e = err as { status?: number };
      if (e?.status === 404) return;
      throw err;
    }
    for (const entry of entries) {
      if (entry.type === 'file') {
        paths.push(entry.path);
      } else if (entry.type === 'dir') {
        await walk(entry.path);
      }
    }
  }
  await walk(cleanPrefix);
  return paths;
}

/** True when the env is configured to commit to GitHub. */
export function isGitHubConfigured(): boolean {
  return !!(
    process.env.GITHUB_TOKEN &&
    process.env.GITHUB_OWNER &&
    process.env.GITHUB_REPO
  );
}
