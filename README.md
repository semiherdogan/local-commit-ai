# Local Commit AI

Generate Git commit messages from staged changes in VS Code using your local AI CLI.

Local Commit AI includes presets for Codex CLI and Claude Code CLI, plus a custom provider for any command-line tool that can generate text. The extension runs the selected command on your machine, sends it the staged Git diff, and writes the generated message back to the Source Control commit input.

![Local Commit AI demo](https://raw.githubusercontent.com/semiherdogan/local-commit-ai/main/media/demo.gif)

## Features

- Adds a **Generate Commit Message** action to the Source Control toolbar.
- Reads staged changes with `git diff --cached`.
- Sends the diff to `codex exec`, `claude --print`, or your custom command.
- Writes the generated message back to the Git commit input.
- Supports a customizable prompt template with `{diff}` replacement.
- Supports optional model names for both providers.
- Limits the number of diff lines sent to the CLI to keep generation fast and predictable.
- Lets you choose the toolbar icon from a small set of built-in VS Code icons.

## Installation

Install from:

- [Open VSX Registry](https://open-vsx.org/extension/semiherdogan/local-commit-ai)
- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=semiherdogan.local-commit-ai-cli)

Download the latest VSIX file from [GitHub Releases](https://github.com/semiherdogan/local-commit-ai/releases).

Then install it in VS Code:

1. Open the Extensions view.
2. Open the `...` menu in the top-right corner.
3. Select **Install from VSIX...**.
4. Choose the downloaded `local-commit-ai-*.vsix` file.

You can also install it from the command line:

```sh
code --install-extension local-commit-ai-*.vsix
```

## Requirements

Install at least one supported CLI and make sure it is available on `PATH`:

- [Codex CLI](https://github.com/openai/codex)
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code/overview)
- Any custom CLI that accepts a prompt through stdin or command arguments

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
| `localCommitAi.provider` | `codex` | CLI provider. Supported values: `codex`, `claude`, `custom`. |
| `localCommitAi.model` | `""` | Optional model name passed to the selected CLI. |
| `localCommitAi.buttonIcon` | `hubot` | Toolbar icon. Supported values: `sparkle`, `hubot`, `gitCommit`, `commentAdd`. |
| `localCommitAi.customCommand` | `""` | Command used when `provider` is `custom`. |
| `localCommitAi.customArgs` | `[]` | Arguments used when `provider` is `custom`. Use `{prompt}` to insert the generated prompt into an argument. |
| `localCommitAi.customPromptStdin` | `true` | Send the generated prompt to stdin when `customArgs` does not include `{prompt}`. |
| `localCommitAi.prompt` | Conventional commit prompt | Prompt template. Use `{diff}` where the staged diff should be inserted. |
| `localCommitAi.maxDiffLines` | `100` | Maximum staged diff lines sent to the CLI. Use `0` to disable truncation. |
| `localCommitAi.debug` | `false` | Write generation diagnostics to the **Local Commit AI** output channel. |

Example settings:

```json
{
  "localCommitAi.provider": "codex",
  "localCommitAi.model": "gpt-5.4-mini",
  "localCommitAi.buttonIcon": "hubot",
  "localCommitAi.maxDiffLines": 100,
  "localCommitAi.prompt": "You are a commit message generator.\n\nReturn exactly one line and nothing else.\n\nRules:\n- Output must be a single conventional commit message\n- Format: type(scope?): description\n- Allowed types: build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test\n- Use lowercase type\n- Keep the description concise\n- Do not use markdown\n- Do not wrap the message in quotes\n- Do not add explanations, alternatives, notes, warnings, or recommendations\n- Do not mention whether the diff is ready to commit\n- If the diff is small or incomplete, still generate the best possible commit message\n\nStaged git diff:\n{diff}"
}
```

Model examples:

| Provider | Model setting |
| --- | --- |
| Codex CLI | `gpt-5.4-mini` |
| Claude Code CLI | `claude-haiku-4-5-20251001` |

Custom provider example with opencode:

```json
{
  "localCommitAi.provider": "custom",
  "localCommitAi.customCommand": "opencode",
  "localCommitAi.customArgs": ["run", "{prompt}"],
  "localCommitAi.customPromptStdin": false
}
```

If your CLI reads from stdin, omit `{prompt}` from `customArgs` and leave `customPromptStdin` enabled:

```json
{
  "localCommitAi.provider": "custom",
  "localCommitAi.customCommand": "your-cli",
  "localCommitAi.customArgs": ["generate-commit-message"],
  "localCommitAi.customPromptStdin": true
}
```

## Debugging

Enable `localCommitAi.debug` to inspect generation diagnostics in the **Local Commit AI** output channel.

The debug log includes provider, command, argument template, prompt source, diff line counts, duration, exit code, stderr preview, and the generated message. It does not log the full prompt or diff content.

## Packaging

Install dependencies:

```sh
npm install
```

Build:

```sh
npm run compile
```

Prepare the changelog before tagging a release:

```sh
npm run changelog:release -- v0.3.1
```

Create a VSIX package:

```sh
npm run package
```

Create a VS Code Marketplace package:

```sh
npm run build:marketplace
```

Install the generated package locally:

```sh
code --install-extension local-commit-ai-0.0.1.vsix
```


## License

MIT
