# Local Commit AI CLI

Generate Git commit messages from staged changes in VS Code using your local AI CLI.

Local Commit AI CLI includes presets for Codex CLI and Claude Code CLI, plus a custom provider for any command-line tool that can generate text. The extension runs the selected command on your machine, sends it the staged Git diff, and writes the generated message back to the Source Control commit input.

![Local Commit AI CLI demo](https://raw.githubusercontent.com/semiherdogan/local-commit-ai/main/media/demo.gif?v=050)

## Features

- Adds a **Generate Commit Message** action to the Source Control toolbar.
- Reads staged changes with `git diff --cached`.
- Supports Git worktrees and repositories opened from a subfolder.
- Prompts for a repository when multiple Git repositories are open and VS Code does not provide the clicked Source Control context.
- Sends the diff to `codex exec`, `claude --print`, or your custom command.
- Writes the generated message back to the Git commit input.
- Supports a customizable prompt template with `{diff}` replacement.
- Supports optional model names for built-in providers.
- Limits the number of diff lines sent to the CLI to keep generation fast and predictable.
- Lets you choose the toolbar icon from a small set of built-in VS Code icons.

## Installation

Install from the extension registry:

- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=semiherdogan.local-commit-ai-cli)
- [Open VSX Registry](https://open-vsx.org/extension/semiherdogan/local-commit-ai-cli)

For manual installation, download the latest VSIX file from [GitHub Releases](https://github.com/semiherdogan/local-commit-ai/releases).

Then install it in VS Code:

1. Open the Extensions view.
2. Open the `...` menu in the top-right corner.
3. Select **Install from VSIX...**.
4. Choose the downloaded `local-commit-ai-cli-*.vsix` file.

You can also install it from the command line:

```sh
code --install-extension local-commit-ai-cli-*.vsix
```

## Requirements

Install at least one supported CLI:

- [Codex CLI](https://github.com/openai/codex)
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code/overview)
- Any custom CLI that accepts a prompt through stdin or command arguments

The CLI must be available on the `PATH` seen by VS Code.

## Usage

1. Open a Git repository in VS Code.
2. Stage the changes you want to commit.
3. Open the Source Control view.
4. Click **Generate Commit Message** in the Source Control toolbar.
5. Review the generated message before committing.

Only staged changes are used to generate the commit message.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `localCommitAi.provider` | `codex` | CLI provider. Supported values: `codex`, `claude`, `custom`. |
| `localCommitAi.command` | `""` | Optional command or absolute executable path for the selected provider. |
| `localCommitAi.model` | `""` | Optional model name passed to the selected CLI. |
| `localCommitAi.buttonIcon` | `hubot` | Toolbar icon. Supported values: `sparkle`, `hubot`, `gitCommit`, `commentAdd`. |
| `localCommitAi.prompt` | Conventional commit prompt | Prompt template. Use `{diff}` where the staged diff should be inserted. |
| `localCommitAi.maxDiffLines` | `100` | Maximum staged diff lines sent to the CLI. Use `0` to disable truncation. |
| `localCommitAi.recentCommitExampleCount` | `0` | Number of recent commit message subjects to include as style examples. Use `0` to disable. |
| `localCommitAi.debug` | `false` | Write generation diagnostics to the **Local Commit AI CLI** output channel. |
| `localCommitAi.customArgs` | `[]` | Arguments used when `provider` is `custom`. Use `{prompt}` to insert the generated prompt into an argument. |
| `localCommitAi.customPromptStdin` | `true` | Send the generated prompt to stdin when `customArgs` does not include `{prompt}`. |
| `localCommitAi.customCommand` | `""` | Deprecated. Use `localCommitAi.command` instead. |

Example settings:

```json
{
  "localCommitAi.provider": "codex",
  "localCommitAi.buttonIcon": "hubot",
  "localCommitAi.maxDiffLines": 100,
  "localCommitAi.recentCommitExampleCount": 3
}
```

Start without setting `localCommitAi.model`. When it is empty, the extension lets the selected CLI use its own default model.

Prompt customization example:

```json
{
  "localCommitAi.prompt": "Write one conventional commit message for this staged diff:\n\n{diff}"
}
```

Minimal provider settings:

| Provider | Setting |
| --- | --- |
| Codex CLI | `"localCommitAi.provider": "codex"` |
| Claude Code CLI | `"localCommitAi.provider": "claude"` |
| Custom CLI | `"localCommitAi.provider": "custom"` and `"localCommitAi.command": "your-cli"` |

Only set `localCommitAi.model` if you want to override the CLI default. For Claude Code, aliases such as `sonnet` and `haiku` are supported by the CLI. For Codex CLI, use a model name supported by your Codex CLI version and account.

If the selected CLI is installed outside the `PATH` seen by VS Code, set `localCommitAi.command` to the command name or absolute executable path:

```json
{
  "localCommitAi.provider": "codex",
  "localCommitAi.command": "/custom/path/to/codex"
}
```

Custom provider example:

```json
{
  "localCommitAi.provider": "custom",
  "localCommitAi.command": "your-cli",
  "localCommitAi.customArgs": ["generate-commit-message"],
  "localCommitAi.customPromptStdin": true
}
```

Prefer stdin for custom providers. Only use `{prompt}` in `customArgs` when the CLI cannot read stdin, because it places the full prompt in process arguments:

```json
{
  "localCommitAi.provider": "custom",
  "localCommitAi.command": "your-cli",
  "localCommitAi.customArgs": ["generate-commit-message", "{prompt}"],
  "localCommitAi.customPromptStdin": false
}
```

## Debugging

Enable `localCommitAi.debug` to inspect generation diagnostics in the **Local Commit AI CLI** output channel.

The debug log includes provider, command, argument template, prompt source, diff line counts, duration, exit code, stderr preview, and the generated message. It does not log the full prompt or diff content.

## Development

For packaging and release steps, see [CONTRIBUTING.md](https://github.com/semiherdogan/local-commit-ai/blob/main/CONTRIBUTING.md).

## License

MIT
