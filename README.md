# Commit Message Generator

Generate a commit message for staged Git changes from the VS Code Source Control view using Codex CLI or Claude Code CLI.

## Features

- Adds a **Generate Commit Message** action to the Source Control toolbar.
- Reads staged changes with `git diff --cached`.
- Sends the diff to either `codex exec` or `claude --print`.
- Writes the generated message back to the Git commit input.
- Supports a customizable prompt template with `{diff}` replacement.
- Supports optional model names for both providers.
- Limits the number of diff lines sent to the CLI to keep generation fast and predictable.

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
| `commitMessageGenerator.provider` | `codex` | CLI provider. Supported values: `codex`, `claude`. |
| `commitMessageGenerator.model` | `""` | Optional model name passed to the selected CLI. |
| `commitMessageGenerator.buttonIcon` | `sparkle` | Toolbar icon. Supported values: `sparkle`, `hubot`, `gitCommit`, `commentAdd`. |
| `commitMessageGenerator.prompt` | Conventional commit prompt | Prompt template. Use `{diff}` where the staged diff should be inserted. |
| `commitMessageGenerator.maxDiffLines` | `100` | Maximum staged diff lines sent to the CLI. Use `0` to disable truncation. |

Example settings:

```json
{
  "commitMessageGenerator.provider": "codex",
  "commitMessageGenerator.model": "",
  "commitMessageGenerator.buttonIcon": "sparkle",
  "commitMessageGenerator.maxDiffLines": 100,
  "commitMessageGenerator.prompt": "Generate a conventional commit message for this staged git diff.\n\nRequirements:\n- Use conventional commit format: type(scope?): description\n- Be concise\n- Infer the most appropriate type\n- Output only the commit message\n\nDiff:\n{diff}"
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
code --install-extension commit-message-generator-0.0.1.vsix
```

## Publishing

Before publishing, update these fields in `package.json` if they do not match your publisher or repository:

- `publisher`
- `repository.url`
- `bugs.url`
- `homepage`

The extension can be packaged with `@vscode/vsce`. If you publish to Open VSX, use the same VSIX package or the Open VSX publishing flow for your namespace.

## License

MIT
