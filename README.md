# Commit Message Generator

VS Code extension that adds a robot button to the Git commit input box and generates a commit message from staged changes.

## Settings

- `commitMessageGenerator.provider`: `codex` or `claude`
- `commitMessageGenerator.model`: optional model name
- `commitMessageGenerator.prompt`: prompt template. Use `{diff}` for the staged `git diff --cached` output.
- `commitMessageGenerator.maxDiffLines`: maximum staged diff lines sent to the CLI. Default: `100`. Use `0` for no limit.

The selected CLI must be installed and available on `PATH`.
