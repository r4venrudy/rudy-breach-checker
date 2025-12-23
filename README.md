##################################################
#            Rudy Breach Checker Bot              #
##################################################

Description:
-------------
Rudy Breach Checker is a Discord-based breach intelligence bot designed to check
emails, hashed emails, and usernames against known data breaches using an external
leak intelligence API.

The bot is intended for OSINT investigations, digital footprint analysis, and
cybersecurity research. It provides clear, structured results via Discord slash
commands and presents findings in detailed embeds for easy review.

Sensitive inputs such as emails can be hashed locally before being queried,
adding an extra layer of privacy during lookups.

--------------------------------------------------

Features:
---------
1. Email Breach Lookup
   - Searches plain email addresses against breach databases
   - Indicates whether the email was found in known leaks
   - Displays breach sources and exposed data fields

2. Hashed Email Lookup (SHA256)
   - Hashes email addresses locally using SHA256
   - Queries breach data using the hashed value
   - Helps reduce direct exposure of sensitive emails

3. Username Breach Lookup
   - Searches usernames across breach datasets
   - Useful for OSINT and account correlation
   - Complements email-based investigations

4. Detailed Breach Intelligence
   - Lists breach source names
   - Includes breach dates when available
   - Displays exposed data types (passwords, emails, etc.)

5. Discord Slash Commands
   - /mail – search by email address
   - /hashmail – hash and search an email
   - /usernamev2 – search by username
   - Clean embed-based output with status indicators

--------------------------------------------------

Requirements:
-------------
- Node.js v18 or newer
- Discord bot token
- Discord application Client ID
- Leak intelligence API endpoint
- Internet access

Required NPM packages:
----------------------
- discord.js
- crypto (built-in)
- fetch (Node.js built-in in v18+)

--------------------------------------------------

Installation:
-------------
1. Clone or download the bot source files.

2. Install dependencies:
   npm install discord.js

3. Configure the bot by editing the following values in the source:
   - DISCORD_TOKEN
   - CLIENT_ID
   - LEAKCHECK_API

4. Start the bot:
   node index.js

--------------------------------------------------

Usage:
------
1. Invite the bot to your Discord server with application command permissions.

2. Use one of the following slash commands:

   /mail email:example@email.com
   - Searches for breaches linked to the email address

   /hashmail email:example@email.com
   - Hashes the email with SHA256 and searches using the hash

   /usernamev2 username:exampleuser
   - Searches for breaches linked to the username

3. The bot will respond with:
   - Query value
   - Query type
   - Breach status (Found / Not Found)
   - Breach source list (if found)
   - Exposed data fields (if available)

--------------------------------------------------

Output Format:
--------------
- Results are displayed in a Discord embed.
- Color-coded status:
  - Red: Breach found
  - Green: Not found
- Breach sources are listed numerically.
- Large breach lists are split into multiple embed fields.
- Timestamps are included for reference.

--------------------------------------------------

Error Handling:
---------------
- API request failures are caught and displayed as errors.
- Invalid responses do not crash the bot.
- Partial data is handled gracefully.
- User receives a clear error message on failure.

--------------------------------------------------

Security Notes:
---------------
- Email hashing is performed locally using SHA256.
- The bot does not store queried data.
- All lookups rely on third-party breach intelligence APIs.
- Results depend on the accuracy and coverage of the API used.

--------------------------------------------------

Legal & Ethical Use:
-------------------
- This tool is for educational, OSINT, and authorized security research only.
- Do not check emails or usernames without proper authorization.
- Breach data may be sensitive and should be handled responsibly.
- The author is not responsible for misuse.

--------------------------------------------------

Customization:
--------------
The bot can be extended by:
- Adding cooldowns or rate limits
- Logging queries for audit purposes
- Adding role-based access control
- Supporting additional hash types
- Integrating multiple breach intelligence providers

--------------------------------------------------

Author:
-------
Created for breach intelligence, OSINT investigations, and cybersecurity research.

--------------------------------------------------

License:
--------
Provided as-is.
Use responsibly.
For authorized and ethical use only.
