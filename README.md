<p align="center"><img src="docs/banner.svg" alt="Rudy Breach Checker — Breach-source observations through Discord." width="100%"></p>

<p align="center">
  <img src="https://img.shields.io/badge/Runtime-Node.js%20%2F%20Discord-55e0b6?style=flat-square&labelColor=101b28" alt="Node.js / Discord">
  <img src="https://img.shields.io/badge/Docs-source_reviewed-55e0b6?style=flat-square&labelColor=101b28" alt="Documentation based on source review">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-55e0b6?style=flat-square&labelColor=101b28" alt="MIT license"></a>
</p>

<p align="center"><strong>Breach-source observations through Discord.</strong></p>

<p align="center"><a href="#overview">Overview</a> · <a href="#capabilities">Capabilities</a> · <a href="#quick-start">Quick start</a> · <a href="#implementation-notes">Implementation notes</a></p>

---

## Overview

A Discord bot that sends email, hashed-email or username queries to a configured breach-lookup endpoint and formats the provider's response. The code expects `found`, `sources` and `fields` properties; provider compatibility must be configured and verified.

## Capabilities

| Command | Implemented behavior |
| :--- | :--- |
| `/mail` | Sends the supplied email as the endpoint's `check` query parameter |
| `/hashmail` | Lowercases/trims the email, hashes it with SHA-256 and queries that hash |
| `/usernamev2` | Queries a supplied username |
| Response | Displays source names/dates and exposed-field labels when returned by the provider |

## Quick start

Requires Node.js with a built-in global `fetch`, a Discord application and a compatible lookup API. Keep `raven.png`; startup requires the file to be at least 1 KB.

```bash
git clone https://github.com/r4venrudy/rudy-breach-checker.git
cd rudy-breach-checker
npm install
```

Set the local placeholders in `index.js`: `DISCORD_TOKEN`, `CLIENT_ID` and `LEAKCHECK_API`. The endpoint must accept `?check=...` and return the response shape expected by `createEmbed`. The code does not implement a provider API-key header automatically.

```bash
node index.js
```

Invite the bot with `bot` and `applications.commands` scopes. Test with a consented test account after configuring your provider.

## Implementation notes

- This repository contains a provider adapter, not a breach database. A `found: false` response does not establish that an account is safe or absent from every breach.
- `/hashmail` hashes the full email with SHA-256. It is not a k-anonymity protocol; only providers supporting that hash format can return useful matches.
- Queries go to the configured provider and results are visible in the Discord channel. Avoid submitting another person's personal information without permission.
- The HTTP request has no explicit timeout and long provider responses may exceed embed limits. Live provider authentication and behavior were not tested in this documentation review.

## Project map

```text
index.js       Slash commands, query adapter, hashing and embeds
package.json   Discord dependency
raven.png      Required startup asset
```

## License

[MIT](LICENSE). Preserve the attribution in the license file.

---

<p align="center">Part of the <a href="https://github.com/r4venrudy">r4venrudy</a> project collection.</p>
