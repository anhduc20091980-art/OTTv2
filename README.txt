OTTv2 — Account & Game Log update
=================================

Files included:
- app.js
- index.html
- styles.css
- server.js

Install:
1. Back up your current OTT folder first.
2. Copy these four files into the folder containing your existing project, replacing the old files.
3. Keep your existing package.json. No npm package is required for the new account API.
4. Run from PowerShell: npm.cmd start
5. Open http://localhost:6767

Accounts:
- Choose a username with 3–24 letters, numbers, underscore or hyphen.
- Password must be 8–128 characters.
- Use Register to create an account, then the account is logged in.
- Use the login form to log in to an existing account.
- Passwords are stored as scrypt hashes, not plain text.
- Sessions are held in memory and expire when the server restarts; log in again after restart.

Game Log:
- Stored by the server in data/gamelog.json.
- Account credentials are stored in data/users.json.
- The server creates the data folder automatically.
- Back up the data folder if you want to preserve accounts and logs when moving the project.
- The log records a game when the signed-in player makes the winning move. This first version does not yet verify game results on the server, so use it as a personal history, not as a tamper-proof competitive record.

Network note:
Everyone should access the game through the same server address/hostname for PlayHTML room sync. Use HTTPS and additional deployment hardening before exposing this to the public internet.
