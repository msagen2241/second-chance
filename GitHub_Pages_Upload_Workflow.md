# How This Game Was Uploaded to GitHub Pages

This file explains, from start to finish, how `Second_Chance.html` was published from this computer to GitHub Pages.

It is written for someone who is completely new to:

1. Git
2. GitHub
3. GitHub Pages
4. Using Git on this Windows computer
5. Using the GitHub CLI (`gh`)

## What Git, GitHub, and GitHub Pages Are

### Git

Git is a version control tool. It tracks changes in files over time.

With Git, you can:

1. Save checkpoints of your work called commits
2. See what changed
3. Push your project to GitHub
4. Pull it back down later

### GitHub

GitHub is a website that hosts Git repositories online.

A GitHub repository is basically an online home for your project.

### GitHub Pages

GitHub Pages is GitHub's free website hosting for static files.

That means if your project is plain:

1. HTML
2. CSS
3. JavaScript

then GitHub Pages can host it directly without a server.

Your game fits that model because everything lives in:

`Second_Chance.html`

## What Was Already True on This Computer

Before uploading, this folder already had a local Git repository.

The project path was:

`G:\MidTier\AI-Projects\Document-Memory\Games\Second Chance`

The main game file was:

`Second_Chance.html`

I checked the Git status and found:

1. The folder was already a Git repo
2. There was no GitHub remote configured yet
3. There were unrelated local changes in other files

That mattered because I needed to avoid uploading or overwriting things you did not ask to publish.

## What Login Was Used

This computer already had the GitHub CLI installed and already logged in.

I checked that with:

```powershell
gh --version
gh auth status
git config --get user.name
git config --get user.email
```

The result showed:

1. `gh` was installed
2. GitHub CLI was authenticated already
3. The active GitHub account was `msagen2241`
4. Git was configured with:
   `Matt`
   `matth@users.noreply.github.com`

Important:

The login token itself was not exposed or copied into any file. GitHub CLI stored and used the existing authenticated session.

## The Main Problem to Solve

GitHub Pages expects a default web entry file such as:

`index.html`

But this project's real game file was named:

`Second_Chance.html`

That means if someone visited the root Pages URL, GitHub Pages would not automatically know to open the game file first.

## Why `index.html` Was Added

Instead of renaming your game file, I added a tiny `index.html` file.

That file redirects the browser to:

`./Second_Chance.html`

This is a safe approach because:

1. It leaves your original game file alone
2. It makes the GitHub Pages root URL work
3. It avoids changing the whole project structure

## Exact Workflow Used

### Step 1: Check the folder and repository state

I inspected the project with commands like:

```powershell
Get-Location
Get-ChildItem -Force | Select-Object Name,Length,Mode
git status --short --branch
git remote -v
```

This told me:

1. I was in the correct folder
2. The repo existed locally
3. There was no `origin` remote yet
4. There were unrelated local changes present

### Step 2: Check GitHub CLI login

I verified whether I could talk to GitHub directly from this machine:

```powershell
gh --version
gh auth status
git config --get user.name
git config --get user.email
```

This confirmed I could create a GitHub repository without asking you to manually log in first.

### Step 3: Add a GitHub Pages entry file

I created:

`index.html`

Its purpose was only to forward the browser into the real game file.

Conceptually, it did this:

1. Browser opens the root site
2. `index.html` loads
3. It immediately redirects to `Second_Chance.html`

### Step 4: Commit only the Pages entrypoint

Because there were other uncommitted files in the repo, I did not want to bundle everything together.

So I committed only `index.html`.

The commands used were:

```powershell
git add -- index.html
git commit -m "deploy: add GitHub Pages entrypoint"
```

This created a clean commit specifically for the publishing setup.

### Step 5: Check whether the target GitHub repo already existed

I checked for a repository named:

`msagen2241/second-chance`

using:

```powershell
gh repo view msagen2241/second-chance
```

It did not exist yet.

### Step 6: Create the GitHub repository and connect this local repo to it

I created the repository and set it as the `origin` remote in one step:

```powershell
gh repo create msagen2241/second-chance --public --source . --remote origin --push
```

This command did several things at once:

1. Created a new public GitHub repository named `second-chance`
2. Used the current folder as the source
3. Added the GitHub repository as the local Git remote named `origin`
4. Pushed the current branch (`master`) to GitHub

After that, the repository existed online at:

`https://github.com/msagen2241/second-chance`

### Step 7: Turn on GitHub Pages

Creating the repository does not automatically make the website live.

GitHub Pages must be enabled for a branch and path.

I enabled Pages from:

1. Branch: `master`
2. Path: `/`

using:

```powershell
gh api repos/msagen2241/second-chance/pages -X POST -H "Accept: application/vnd.github+json" -f "source[branch]=master" -f "source[path]=/"
```

That told GitHub:

"Build a Pages site from the root of the `master` branch."

GitHub then returned the site URL:

`https://msagen2241.github.io/second-chance/`

### Step 8: Wait for the Pages build

GitHub Pages usually takes a short time to build and publish.

I checked the build status with:

```powershell
gh api repos/msagen2241/second-chance/pages
gh api repos/msagen2241/second-chance/pages/builds/latest
```

When a build is still running, the status may show:

`building`

After it finishes, the site becomes live.

## The Bug Fix That Was Pushed Afterward

After publishing, you reported a gameplay issue:

1. You could answer one question
2. Then no `NEXT` button appeared properly

That turned out to be a bug in `Second_Chance.html`, not an upload failure.

I fixed the touch/click handling and then pushed that update too.

The commands used were:

```powershell
git add -- Second_Chance.html
git commit -m "fix: correct touch answer handling on GitHub Pages"
git push origin master
```

That updated the site with the corrected game logic.

## What Actually Got Uploaded

These project files were uploaded through Git:

1. `Second_Chance.html`
2. `index.html`
3. Any other files already tracked in the repo history on the branch that was pushed

These local items were intentionally not included in the publishing commit unless already tracked and pushed separately:

1. Unrelated modified files
2. Untracked scratch folders
3. Anything not staged for the commit

That was important because the repo had unrelated local changes when this work started.

## How to Repeat This Yourself Next Time

If you make changes to `Second_Chance.html` and want the website to update, the normal workflow is:

### 1. Open PowerShell in the project folder

```powershell
cd "G:\MidTier\AI-Projects\Document-Memory\Games\Second Chance"
```

### 2. Check what changed

```powershell
git status
```

### 3. Stage the file you want to publish

If you only changed the game file:

```powershell
git add -- Second_Chance.html
```

If you changed both the game file and the redirect page:

```powershell
git add -- Second_Chance.html index.html
```

### 4. Create a commit

```powershell
git commit -m "update: improve quiz game"
```

A commit message should briefly describe what changed.

### 5. Push to GitHub

```powershell
git push origin master
```

### 6. Wait a minute and refresh the site

Open:

`https://msagen2241.github.io/second-chance/`

Then refresh the page.

If the browser seems to show an old version, use a hard refresh:

1. `Ctrl + F5`
2. Or open the site in a private/incognito window

## How to Do the Initial Login Yourself on a New Computer

If GitHub CLI is not already logged in on another machine, the beginner workflow is:

### 1. Install Git

Download Git for Windows and install it.

### 2. Install GitHub CLI

Download and install GitHub CLI from GitHub.

### 3. Sign in with GitHub CLI

Run:

```powershell
gh auth login
```

It will guide you through:

1. Choosing `GitHub.com`
2. Choosing HTTPS
3. Choosing browser login
4. Approving access in your browser

### 4. Verify login worked

```powershell
gh auth status
```

## How to Do the Same Setup Manually in the GitHub Website

If you do not want to use `gh`, you can do the first-time setup through the GitHub website instead.

The manual beginner process is:

### 1. Create a new repository on GitHub.com

For example:

`second-chance`

### 2. In your local folder, add the remote

```powershell
git remote add origin https://github.com/msagen2241/second-chance.git
```

### 3. Push your branch

```powershell
git push -u origin master
```

### 4. Open the repository on GitHub in a browser

### 5. Go to `Settings`

### 6. Go to `Pages`

### 7. Under "Build and deployment", choose:

1. Source: `Deploy from a branch`
2. Branch: `master`
3. Folder: `/ (root)`

### 8. Save

GitHub Pages will then build and publish the site.

## Beginner Mental Model

The simplest way to think about the workflow is:

1. Edit files on your computer
2. Use `git add` to say which changes you want included
3. Use `git commit` to save a version snapshot locally
4. Use `git push` to send that snapshot to GitHub
5. GitHub Pages publishes the website from the repository branch

## The Exact URLs Created

Repository:

`https://github.com/msagen2241/second-chance`

Live website:

`https://msagen2241.github.io/second-chance/`

## Short Version

The actual upload workflow used here was:

1. Confirm the local folder was a Git repo
2. Confirm GitHub CLI was already logged into `msagen2241`
3. Add `index.html` so GitHub Pages had a root entrypoint
4. Commit only that new file
5. Create the GitHub repository with `gh repo create`
6. Push the local branch to GitHub
7. Enable GitHub Pages from `master` root
8. Wait for the build
9. Fix the gameplay bug in `Second_Chance.html`
10. Commit and push the fix

## Recommended Safe Habits

For future updates, these habits will help:

1. Run `git status` before every commit
2. Stage only the files you actually want to publish
3. Use clear commit messages
4. Push after each meaningful change
5. Refresh the live site in an incognito window if caching is confusing
6. Do not paste tokens or passwords into project files

## If You Want a Simpler Rule to Remember

For this specific project, the repeatable update command sequence is usually just:

```powershell
cd "G:\MidTier\AI-Projects\Document-Memory\Games\Second Chance"
git status
git add -- Second_Chance.html
git commit -m "update: describe what changed"
git push origin master
```

Then open:

`https://msagen2241.github.io/second-chance/`
