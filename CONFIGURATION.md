# Configuration reference

Environment values take priority over local file values. Configuration files are bounded to 64 KiB and must contain a UTF-8 JSON object; an initial UTF-8 BOM is supported. Validation uses no network credentials or external service calls.

## Explicit file selection

A nonempty `RUDY_CONFIG` selects an existing regular JSON file. Missing or non-file selections are errors even when environment credentials are complete. A programmatic filename override takes precedence. The optional default file may be absent when environment settings supply the required values.

## Credential text

After trimming surrounding whitespace, embedded C0 control characters and DEL are rejected in required settings before client initialization. Diagnostics identify setting names without echoing credential values.

## Unicode integrity

Required setting values reject unpaired UTF-16 surrogate code points. Valid Unicode, including supplementary characters, is retained unchanged; the loader does not silently replace malformed credential text.

## Application IDs

Application IDs are compared as integer strings using BigInt, without floating-point rounding, and cannot exceed 18446744073709551615. This validates the [documented snowflake range](https://github.com/discord/discord-api-docs/blob/main/developers/reference.mdx); it does not authenticate an application or contact Discord.
