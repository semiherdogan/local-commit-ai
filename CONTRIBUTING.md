# Contributing

## Development Setup

Use the project runtime when possible:

```sh
devbox shell
npm install
```

If you do not use devbox, install Node.js 22 or newer and run:

```sh
npm install
```

## Build

Compile the extension:

```sh
npm run compile
```

Watch TypeScript during development:

```sh
npm run watch
```

There is no test suite in this project yet. For changes that affect runtime behavior, verify with at least `npm run compile` and a local VSIX install.

## Local Packaging

Create a VSIX package:

```sh
npm run package
```

Install the generated package locally:

```sh
code --install-extension local-commit-ai-cli-*.vsix
```

When checking package contents without writing a VSIX into the repo, use an explicit output path:

```sh
npm run package -- --out /tmp/local-commit-ai-cli.vsix
```

The extension package intentionally excludes repository-only files such as source files, release scripts, devbox config, changelog, demo gif, and this contributing guide.

## Release Process

Releases are tag-based. Release tags must use semantic versioning with a `v` prefix, for example:

```sh
v0.3.1
```

Preferred release path:

1. Run the **Prepare Release** GitHub Actions workflow.
2. Enter the version without the `v` prefix, for example `0.3.1`.
3. The workflow updates `CHANGELOG.md`, commits the changelog when needed, creates the tag, pushes it, and triggers the release workflow.

The release workflow:

1. Sets `package.json` version from the tag.
2. Packages the extension.
3. Publishes to Open VSX.
4. Publishes to VS Code Marketplace.
5. Creates a GitHub release with the VSIX attached.

To prepare a changelog locally before tagging:

```sh
npm run changelog:release -- v0.3.1
```

Publishing requires these repository secrets:

- `OPEN_VSX_TOKEN`
- `VSCE_PAT`

## Documentation

Keep `README.md` focused on extension users because it is shown in VS Code and extension registries. Put maintainer-only instructions, packaging notes, and release details in this file.
