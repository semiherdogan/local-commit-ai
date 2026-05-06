# Local Commit AI

Generate Git commit messages from staged changes in VS Code using your local AI CLI.

Local Commit AI currently supports Codex CLI and Claude Code CLI. The extension runs the selected CLI on your machine, sends it the staged Git diff, and writes the generated message back to the Source Control commit input.

## Features

- Adds a **Generate Commit Message** action to the Source Control toolbar.
- Reads staged changes with `git diff --cached`.
- Sends the diff to either `codex exec` or `claude --print`.
- Writes the generated message back to the Git commit input.
- Supports a customizable prompt template with `{diff}` replacement.
- Supports optional model names for both providers.
- Limits the number of diff lines sent to the CLI to keep generation fast and predictable.
- Lets you choose the toolbar icon from a small set of built-in VS Code icons.

## Requirements

Install at least one supported CLI and make sure it is available on `PATH`:

- [Codex CLI](https://github.com/openai/codex)
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code/overview)

The extension only uses staged changes. Stage files before generating a commit message.

## Usage

1. Open a Git repository in VS Code.
2. Stage the changes you want to commit.
3. Open the Source Control view.
4. Click **Generate Commit Message** in the Source Control toolbar.
5. Review the generated message before committing.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `localCommitAi.provider` | `codex` | CLI provider. Supported values: `codex`, `claude`. |
| `localCommitAi.model` | `""` | Optional model name passed to the selected CLI. |
| `localCommitAi.buttonIcon` | `sparkle` | Toolbar icon. Supported values: `sparkle`, `hubot`, `gitCommit`, `commentAdd`. |
| `localCommitAi.prompt` | Conventional commit prompt | Prompt template. Use `{diff}` where the staged diff should be inserted. |
| `localCommitAi.maxDiffLines` | `100` | Maximum staged diff lines sent to the CLI. Use `0` to disable truncation. |

Example settings:

```json
{
  "localCommitAi.provider": "codex",
  "localCommitAi.model": "",
  "localCommitAi.buttonIcon": "sparkle",
  "localCommitAi.maxDiffLines": 100,
  "localCommitAi.prompt": "Generate a conventional commit message for this staged git diff.\n\nRequirements:\n- Use conventional commit format: type(scope?): description\n- Be concise\n- Infer the most appropriate type\n- Output only the commit message\n\nDiff:\n{diff}"
}
```

## Packaging

Install dependencies:

```sh
npm install
```

Build:

```sh
npm run compile
```

Create a VSIX package:

```sh
npm run package
```

Install the generated package locally:

```sh
code --install-extension local-commit-ai-0.0.1.vsix
```

## Release Artifacts

GitHub Actions creates a release and uploads the VSIX package when a version tag is pushed.

```sh
git tag v0.0.1
git push origin v0.0.1
```

## License

MIT
