import * as vscode from 'vscode';
import * as child_process from 'child_process';

let panel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('simple-todo.todo', async () => {
		// Add the root directory of the extension to the PATH environment variable
		process.env.PATH = `${context.extensionPath}:${process.env.PATH}`;

		// Prompt the user to select a command
		const command = await vscode.window.showQuickPick(['add', 'list', 'remove', 'update'], {
			placeHolder: 'Select a command'
		});
		if (!command) {
			return;
		}

		// Prompt the user for input
		let args: string[];
		if (command === 'add') {
			const taskName = await vscode.window.showInputBox({ prompt: 'Enter task name' });
			if (!taskName) {
				return;
			}

			const description = await vscode.window.showInputBox({ prompt: 'Enter description' });
			if (!description) {
				return;
			}

			const deadline = await vscode.window.showInputBox({ prompt: 'Enter deadline (DD-MM-YYYY)' });
			if (!deadline) {
				return;
			}

			args = [command, taskName, '--description', description, '--deadline', deadline];
		} else if (command === 'list') {
			args = [command];
		} else if (command === 'update') {
			const taskName = await vscode.window.showInputBox({ prompt: 'Enter task name' });
			if (!taskName) {
			  return;
			}
	  
			const description = await vscode.window.showInputBox({ prompt: 'Enter new description (optional)' });
			const deadline = await vscode.window.showInputBox({ prompt: 'Enter new deadline (DD-MM-YYYY, optional)' });
	  
			args = [command, taskName];
			if (description) {
			  args.push('--description', description);
			}
			if (deadline) {
			  args.push('--deadline', deadline);
			}
		  } else {
			const input = await vscode.window.showInputBox({ prompt: `Enter ${command} argument` });
			if (!input) {
			  return;
			}
	  
			args = [command, input];
		  }

		// Create a new Webview panel
		if (!panel) {
			panel = vscode.window.createWebviewPanel(
				'simpleTodo',
				'Simple Todo',
				vscode.ViewColumn.Two,
				{}
			);
		}

		// Call the external binary with command line arguments
		const child = child_process.spawn('todo-cli', args);

		child.on('error', (error) => {
			console.error(`Error: ${error.message}`);
		});

		child.stdout.on('data', (data) => {
			// Update the Webview panel with the output
			if (panel) {
				// panel.webview.html = data.toString();
				panel.webview.html = `<pre>${data}</pre>`;
			}
		});

		child.stderr.on('data', (data) => {
			console.error(`stderr: ${data}`);
		});

		child.on('close', (code) => {
			console.log(`child process exited with code ${code}`);
		});
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
