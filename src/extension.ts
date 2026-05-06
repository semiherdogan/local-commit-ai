import * as vscode from 'vscode';
import { spawn } from 'node:child_process';

type Provider = 'codex' | 'claude';

interface GitExtensionApi {
  getAPI(version: 1): GitApi;
}

interface GitApi {
  repositories: GitRepository[];
}

interface GitRepository {
  rootUri: vscode.Uri;
  inputBox: {
    value: string;
  };
}

interface GeneratorConfig {
  provider: Provider;
  model: string;
  prompt: string;
  maxDiffLines: number;
}

export function activate(context: vscode.ExtensionContext) {
  const commands = [
    'commitMessageGenerator.generate',
    'commitMessageGenerator.generate.sparkle',
    'commitMessageGenerator.generate.hubot',
    'commitMessageGenerator.generate.gitCommit',
    'commitMessageGenerator.generate.commentAdd'
  ];

  context.subscriptions.push(
    ...commands.map((command) => vscode.commands.registerCommand(command, generateCommitMessage))
  );
}

export function deactivate() {}

async function generateCommitMessage() {
  try {
    const repository = await getRepository();

    if (!repository) {
      vscode.window.showWarningMessage('No Git repository found.');
      return;
    }

    const diff = await runCommand('git', ['diff', '--cached'], repository.rootUri.fsPath);

    if (!diff.trim()) {
      vscode.window.showWarningMessage('No staged changes to generate a commit message.');
      return;
    }

    const config = getConfig();
    const limitedDiff = limitDiff(diff, config.maxDiffLines);
    const prompt = config.prompt.includes('{diff}')
      ? config.prompt.replaceAll('{diff}', limitedDiff)
      : `${config.prompt.trim()}\n\nDiff:\n${limitedDiff}`;

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.SourceControl,
        title: 'Generating commit message...'
      },
      async () => {
        const message = await runGenerator(config.provider, config.model, prompt, repository.rootUri.fsPath);
        repository.inputBox.value = sanitizeCommitMessage(message);
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Failed to generate commit message: ${message}`);
  }
}

async function getRepository(): Promise<GitRepository | undefined> {
  const gitExtension = vscode.extensions.getExtension<GitExtensionApi>('vscode.git');
  const git = gitExtension?.isActive ? gitExtension.exports : await gitExtension?.activate();
  const api = git?.getAPI(1);

  if (!api?.repositories.length) {
    return undefined;
  }

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

  if (!workspaceFolder) {
    return api.repositories[0];
  }

  return api.repositories.find((repository) => repository.rootUri.fsPath === workspaceFolder.uri.fsPath)
    ?? api.repositories[0];
}

function getConfig(): GeneratorConfig {
  const config = vscode.workspace.getConfiguration('commitMessageGenerator');
  const provider = config.get<Provider>('provider', 'codex');

  return {
    provider,
    model: config.get<string>('model', '').trim(),
    prompt: config.get<string>('prompt', '').trim(),
    maxDiffLines: Math.max(0, Math.floor(config.get<number>('maxDiffLines', 100)))
  };
}

function limitDiff(diff: string, maxLines: number): string {
  if (maxLines === 0) {
    return diff;
  }

  const lines = diff.split(/\r?\n/);

  if (lines.length <= maxLines) {
    return diff;
  }

  return lines.slice(0, maxLines).join('\n');
}

function runGenerator(provider: Provider, model: string, prompt: string, cwd: string): Promise<string> {
  const command = provider;
  const args = provider === 'codex' ? ['exec'] : ['--print'];

  if (model) {
    args.push(provider === 'codex' ? '-m' : '--model', model);
  }

  if (provider === 'codex') {
    args.push('-');
  }

  return runCommand(command, args, cwd, prompt);
}

function runCommand(command: string, args: string[], cwd: string, stdin?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd });
    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.stdout.on('data', (data: string) => {
      stdout += data;
    });

    child.stderr.on('data', (data: string) => {
      stderr += data;
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(new Error(stderr.trim() || `${command} exited with code ${code}`));
    });

    child.stdin.end(stdin);
  });
}

function sanitizeCommitMessage(message: string): string {
  return message
    .trim()
    .replace(/^```(?:\w+)?\s*/, '')
    .replace(/\s*```$/, '')
    .trim();
}
