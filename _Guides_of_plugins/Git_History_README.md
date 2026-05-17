# Git History Plugin for Obsidian

View git commit history for the current file, with support for multiple repositories and both desktop (git CLI) and mobile (GitHub API) platforms.

## Features

- **Desktop**: Uses local git CLI to fetch commit history
- **Mobile**: Uses GitHub API to fetch commit history
- **Multi-repo support**: Merge and display commits from multiple repositories (e.g., TUD1, TUD2, TUD3, etc.)
- **Selection search**: Find commits that modified specific text
- **File diff view**: Right-click on any file in a commit to see the diff
- **Commit filtering**: Filter commits by keyword in the history panel

## Settings

### GitHub Configuration (for Mobile/Desktop fallback)

| Setting | Description |
|---------|-------------|
| **GitHub owner** | Your GitHub username or organization |
| **GitHub repository** | Repository name (e.g., `my-vault`) |
| **Branch** | Default branch to query (e.g., `main` or `master`) |
| **Max commits (desktop)** | Number of commits to fetch when using local git (1-50). Default: 10. |
| **Max commits (mobile/GitHub API)** | Number of commits to fetch from GitHub API (1-50). (Keep this LOW on mobiles with less RAM) Default: 5. |
| **Skip init commits** | Skip full-file "init" commits where the entire file is added as new. These show the whole file in green and are usually just repository initialization noise. Default: ON. Turn OFF to see the complete history including the first commit. |
| **Personal Access Token** | GitHub PAT with `repo` scope (required for private repos) |

### Multi-Repo Configuration

**Field**: `Extra GitHub repositories`

Format: comma-separated list of `owner/repo@branch` entries, oldest repo first:
For example:
```
myuser/repo1@master,myuser/repo2@master,myuser/repo3@master,myuser/repo4@main,myuser/repo5@main
```

**Important**: You **must** specify the branch for each repo. The plugin uses your default branch setting only for the main repo. If a repo uses `master` instead of `main`, you must write `@master`.

**Why oldest repo first?** The plugin labels commits with `[repo-name]`. When the same file exists across repos with continuous history, ordering oldest first ensures the chronological flow is preserved.

### Legacy: Local Repository Paths (Desktop Only)

**Deprecated**: Only use this if your old repos are physically present on your drive with `.git` folders. This requires the full git repository to be present locally.

Format: comma-separated absolute paths:

```
/Users/me/vaults/TUD1,/Users/me/vaults/TUD2
```

## Mobile Usage Tips

⚠️ **GitHub API Rate Limits**: On mobile, every commit fetch uses the GitHub API. Too many commits × too many repos = rate limit errors.

**Recommended mobile settings:**
- **Max commits (mobile/GitHub API)**: `3` or `5` (default is 5)
- Number of extra repos: Keep under 5
- Enable a GitHub Personal Access Token (even for public repos) — authenticated requests have higher rate limits

**API calls per file open:**
- 1 call per repo to fetch commit list
- 1 call per commit to fetch diff details

**Example: 5 repos × 5 commits each:**
- 5 calls (commit lists) + 25 calls (diffs) = **30 API calls per file**
- Open 10 files = 300 calls

**Rate limit with GitHub PAT:**
- 5,000 requests/hour per user
- With 5 repos × 5 commits: ~166 files/hour

(Without PAT: only 60 requests/hour - not recommended for multi-repo use)

## Troubleshooting

### 404 Errors for Extra Repos

If you see:
```
git-history: skipping extra repo zanodor/TUDASTAR: Error: Request failed, status 404
```

**Cause**: The branch doesn't exist. The plugin tried `main` (your default), but the repo uses `master`.

**Fix**: Add `@branch` explicitly:
```
zanodor/TUDASTAR@master
```

### 422 Errors

Usually indicates a commit hash or file path issue. Check that your GitHub settings are correct and the file exists in the specified branch.

### No Commits Found

- **Desktop**: Check that the file path exists in the old repo
- **Mobile**: Check your GitHub token, repo names, and branch names

## Command

The plugin adds a command: **"Show Git History"** — bind it to a hotkey for quick access.

### Interactive Scope Selection

When you run the command, a modal appears asking which scope to search:

- **Current repo only**: Search only the main repository (faster, fewer API calls)
- **All repos**: Search main repository + all configured extra repositories
- **Cancel**: Close the modal without searching

If no extra repositories are configured, only "Current repo only" will be active.

## How It Works

1. Shows scope selection modal (Current repo only / All repos)
2. Fetches commits from selected scope:
   - Main repo (desktop: git CLI, mobile: GitHub API)
   - Extra repos via GitHub API (if "All repos" selected)
3. Merges all commits, sorts by date (newest first)
4. Labels extra repo commits with `[repo-name]` prefix
5. Displays in a scrollable panel with diff preview

## License

MIT
