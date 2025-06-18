import * as vscode from 'vscode';
import { FunctionAnalyzer } from './functionAnalyzer';
import { WebViewPanelManager } from './WebViewPanel';

export function activate(context: vscode.ExtensionContext) {
    console.log('Python Function Analyzer extension is now active');

    // Initialize the function analyzer with extension context
    const functionAnalyzer = new FunctionAnalyzer(context);
    const webViewManager = new WebViewPanelManager(context);

    const analyzeCommand = vscode.commands.registerCommand(
        'pythonFunctionAnalyzer.analyzeFunctions',
        async (uri?: vscode.Uri) => {
            try {
                await handleAnalyzeCommand(functionAnalyzer, webViewManager, uri);
            } catch (error) {
                vscode.window.showErrorMessage(`Analysis failed: ${error}`);
            }
        },
    );

    // Add command to extension subscriptions for proper cleanup
    context.subscriptions.push(analyzeCommand);
}

async function handleAnalyzeCommand(
    analyzer: FunctionAnalyzer,
    webViewManager: WebViewPanelManager,
    uri?: vscode.Uri,
): Promise<void> {
    const targetFolder = await determineTargetFolder(uri);
    if (!targetFolder) {
        return;
    }

    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Analyzing Python functions...',
            cancellable: false,
        },
        async (progress) => {
            progress.report({ increment: 0, message: 'Scanning files...' });

            // Perform the analysis
            const analysisResult = await analyzer.analyzePythonFunctions(targetFolder);

            progress.report({ increment: 50, message: 'Processing results...' });

            webViewManager.showResults(analysisResult, targetFolder);

            progress.report({ increment: 100, message: 'Complete!' });
        },
    );
}

async function determineTargetFolder(uri?: vscode.Uri): Promise<string | undefined> {
    if (uri && uri.fsPath) {
        // Called from context menu on a folder
        return uri.fsPath;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length === 1) {
        return workspaceFolders[0].uri.fsPath;
    } else if (workspaceFolders && workspaceFolders.length > 1) {
        const selected = await vscode.window.showQuickPick(
            workspaceFolders.map((folder) => ({
                label: folder.name,
                description: folder.uri.fsPath,
                folder: folder,
            })),
            { placeHolder: 'Select workspace folder to analyze' },
        );
        return selected?.folder.uri.fsPath;
    }

    const folderUri = await vscode.window.showOpenDialog({
        canSelectFolders: true,
        canSelectFiles: false,
        canSelectMany: false,
        openLabel: 'Select Folder to Analyze',
    });

    return folderUri?.[0]?.fsPath;
}

export function deactivate() {
    console.log('Python Function Analyzer extension deactivated');
}
