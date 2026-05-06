import * as vscode from 'vscode';
import { spawn } from 'node:child_process';

const outputChannel = vscode.window.createOutputChannel('Local Commit AI');

type Provider = 'codex' | 'claude' | 'custom';

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
  debug: boolean;
  customCommand: string;
  customArgs: string[];
  customPromptStdin: boolean;
}

export function activate(context: vscode.ExtensionContext) {
  const commands = [
    'localCommitAi.generate',
    'localCommitAi.generate.sparkle',
    'localCommitAi.generate.hubot',
    'localCommitAi.generate.gitCommit',
    'localCommitAi.generate.commentAdd'
  ];

  context.subscriptions.push(
    outputChannel,
    ...commands.map((command) => vscode.commands.registerCommand(command, generateCommitMessage))
  );
}

export function deactivate() {}

async function generateCommitMessage() {
  const config = getConfig();
  beginDebugSession(config);

  try {
    debugLog(config, 'Generate command invoked');

    const repository = await getRepository();

    if (!repository) {
      debugLog(config, 'No Git repository found');
      vscode.window.showWarningMessage('No Git repository found.');
      return;
    }

    const diff = await runCommand('git', ['diff', '--cached'], repository.rootUri.fsPath);

    if (!diff.trim()) {
      debugLog(config, 'No staged changes found');
      vscode.window.showWarningMessage('No staged changes to generate a commit message.');
      return;
    }

    const limitedDiff = limitDiff(diff, config.maxDiffLines);

    debugLog(config, 'Starting generation');
    debugLog(config, `Repository: ${repository.rootUri.fsPath}`);
    debugLog(config, `Provider: ${config.provider}`);
    debugLog(config, `Diff lines: ${countLines(diff)}`);
    debugLog(config, `Prompt diff lines: ${countLines(limitedDiff)}`);

    const prompt = config.prompt.includes('{diff}')
      ? config.prompt.replaceAll('{diff}', limitedDiff)
      : `${config.prompt.trim()}\n\nDiff:\n${limitedDiff}`;

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.SourceControl,
        title: 'Generating commit message...'
      },
      async () => {
        const message = await runGenerator(config, prompt, repository.rootUri.fsPath);
        const sanitizedMessage = sanitizeCommitMessage(message);

        debugLog(config, `Raw output length: ${message.length}`);
        debugLog(config, `Sanitized output length: ${sanitizedMessage.length}`);
        debugLog(config, `Generated message: ${sanitizedMessage}`);

        repository.inputBox.value = sanitizedMessage;
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    debugLog(config, `Generation failed: ${message}`);
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
  const config = vscode.workspace.getConfiguration('localCommitAi');
  const provider = config.get<Provider>('provider', 'codex');

  return {
    provider,
    model: config.get<string>('model', '').trim(),
    prompt: config.get<string>('prompt', '').trim(),
    maxDiffLines: Math.max(0, Math.floor(config.get<number>('maxDiffLines', 100))),
    debug: config.get<boolean>('debug', false),
    customCommand: config.get<string>('customCommand', '').trim(),
    customArgs: config.get<string[]>('customArgs', []),
    customPromptStdin: config.get<boolean>('customPromptStdin', true)
  };
}

function countLines(value: string): number {
  return value ? value.split(/\r?\n/).length : 0;
}

function beginDebugSession(config: GeneratorConfig) {
  if (!config.debug) {
    return;
  }

  outputChannel.show(true);
  outputChannel.appendLine('');
  outputChannel.appendLine('--- Local Commit AI ---');
}

function debugLog(config: GeneratorConfig, message: string) {
  if (!config.debug) {
    return;
  }

  outputChannel.appendLine(`[${new Date().toISOString()}] ${message}`);
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

function runGenerator(config: GeneratorConfig, prompt: string, cwd: string): Promise<string> {
  if (config.provider === 'custom') {
    return runCustomGenerator(config, prompt, cwd);
  }

  const command = config.provider;
  const args = config.provider === 'codex' ? ['exec'] : ['--print'];

  if (config.model) {
    args.push(config.provider === 'codex' ? '-m' : '--model', config.model);
  }

  if (config.provider === 'codex') {
    args.push('-');
  }

  debugLog(config, `Command: ${command}`);
  debugLog(config, `Args: ${JSON.stringify(args)}`);
  debugLog(config, 'Prompt source: stdin');

  return runCommand(command, args, cwd, prompt, config);
}

function runCustomGenerator(config: GeneratorConfig, prompt: string, cwd: string): Promise<string> {
  if (!config.customCommand) {
    throw new Error('Custom provider requires localCommitAi.customCommand.');
  }

  const argsIncludePrompt = config.customArgs.some((arg) => arg.includes('{prompt}'));
  const args = config.customArgs.map((arg) => arg.replaceAll('{prompt}', prompt));
  const stdin = config.customPromptStdin && !argsIncludePrompt ? prompt : undefined;

  debugLog(config, `Command: ${config.customCommand}`);
  debugLog(config, `Args template: ${JSON.stringify(config.customArgs)}`);
  debugLog(config, `Prompt source: ${stdin === undefined ? 'args' : 'stdin'}`);

  return runCommand(config.customCommand, args, cwd, stdin, config);
}

function runCommand(command: string, args: string[], cwd: string, stdin?: string, config?: GeneratorConfig): Promise<string> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
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
      if (config) {
        debugLog(config, `Command error: ${error.message}`);
      }

      reject(error);
    });

    child.on('close', (code) => {
      if (config) {
        debugLog(config, `Exit code: ${code}`);
        debugLog(config, `Duration: ${Date.now() - startedAt}ms`);

        if (stderr.trim()) {
          debugLog(config, `Stderr: ${truncateForLog(stderr.trim())}`);
        }
      }

      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(new Error(stderr.trim() || `${command} exited with code ${code}`));
    });

    child.stdin.end(stdin);
  });
}

function truncateForLog(value: string): string {
  return value.length > 1000 ? `${value.slice(0, 1000)}...` : value;
}

function sanitizeCommitMessage(message: string): string {
  const cleaned = message
    .trim()
    .replace(/^```(?:\w+)?\s*/, '')
    .replace(/\s*```$/, '')
    .trim();

  const conventionalCommitPattern = /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([^)]+\))?!?: .+/;
  const lines = cleaned
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*>\s`]+/, '').replace(/`+$/, '').trim());
  const commitLineIndex = lines.findIndex((line) => conventionalCommitPattern.test(line));

  return commitLineIndex === -1 ? cleaned : lines.slice(commitLineIndex).join('\n').trim();
}
