import * as vscode from 'vscode';
import * as path from 'path';
import { FunctionAnalysisResult, FunctionDetails } from './functionAnalyzer';

export class WebViewPanelManager {
    private context: vscode.ExtensionContext;
    private currentPanel: vscode.WebviewPanel | undefined = undefined;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public showResults(result: FunctionAnalysisResult, rootPath: string): void {
        const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        if (this.currentPanel) {
            // If panel already exists, update its content
            this.currentPanel.reveal(columnToShowIn);
            this.updatePanelContent(result, rootPath);
        } else {
            this.currentPanel = vscode.window.createWebviewPanel(
                'pythonFunctionAnalysis',
                'Python Function Analysis',
                columnToShowIn || vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'media'))],
                },
            );

            this.currentPanel.onDidDispose(
                () => {
                    this.currentPanel = undefined;
                },
                null,
                this.context.subscriptions,
            );

            this.updatePanelContent(result, rootPath);
        }
    }

    private updatePanelContent(result: FunctionAnalysisResult, rootPath: string): void {
        if (!this.currentPanel) {
            return;
        }

        this.currentPanel.webview.html = this.generateHtmlContent(result, rootPath);
    }

    private generateHtmlContent(result: FunctionAnalysisResult, rootPath: string): string {
        const treeHtml = this.generateTreeStructure(result.fileData, rootPath);

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Python Function Analysis</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                    line-height: 1.6;
                }
                .header {
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                }
                .title {
                    font-size: 24px;
                    font-weight: bold;
                    color: var(--vscode-textLink-foreground);
                    margin-bottom: 10px;
                }
                .summary {
                    display: flex;
                    gap: 30px;
                    margin-bottom: 10px;
                    flex-wrap: wrap;
                }
                .stat {
                    background-color: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    padding: 8px 12px;
                    border-radius: 4px;
                    font-weight: bold;
                    min-width: 80px;
                    text-align: center;
                }
                .stat.sync {
                    background-color: var(--vscode-charts-blue);
                }
                .stat.async {
                    background-color: var(--vscode-charts-orange);
                }
                .tree-container {
                    font-family: 'Courier New', monospace;
                    background-color: var(--vscode-textCodeBlock-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 15px;
                    overflow-x: auto;
                }
                .tree-item {
                    margin: 3px 0;
                    white-space: pre;
                }
                .folder {
                    color: var(--vscode-symbolIcon-folderForeground);
                    font-weight: bold;
                }
                .file {
                    color: var(--vscode-symbolIcon-fileForeground);
                }
                .function-count {
                    color: var(--vscode-textLink-foreground);
                    font-weight: bold;
                }
                .function-detail {
                    color: var(--vscode-descriptionForeground);
                    font-size: 11px;
                    margin-left: 8px;
                }
                .async-indicator {
                    color: var(--vscode-charts-orange);
                    font-weight: bold;
                }
                .sync-indicator {
                    color: var(--vscode-charts-blue);
                    font-weight: bold;
                }
                .timestamp {
                    color: var(--vscode-descriptionForeground);
                    font-size: 12px;
                    margin-top: 10px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">Python Function Analysis</div>
                <div class="summary">
                    <div class="stat">Files: ${result.totalFiles}</div>
                    <div class="stat">Total: ${result.totalFunctions}</div>
                    <div class="stat sync">Sync: ${result.syncFunctions}</div>
                    <div class="stat async">Async: ${result.asyncFunctions}</div>
                </div>
                <div class="timestamp">Analyzed: ${new Date(result.timestamp).toLocaleString()}</div>
            </div>
            
            <div class="tree-container">
                ${treeHtml}
            </div>
        </body>
        </html>
        `;
    }

    private generateTreeStructure(fileData: { [filePath: string]: FunctionDetails }, rootPath: string): string {
        const tree = this.buildTreeFromPaths(fileData, rootPath);
        return this.renderTreeNode(tree, '', true);
    }

    private buildTreeFromPaths(fileData: { [filePath: string]: FunctionDetails }, rootPath: string): TreeNode {
        const root: TreeNode = {
            name: path.basename(rootPath) || 'root',
            children: {},
            functionDetails: { total: 0, sync: 0, async: 0 },
        };

        for (const [filePath, functionDetails] of Object.entries(fileData)) {
            const relativePath = path.relative(rootPath, filePath);
            const pathParts = relativePath.split(path.sep);

            let currentNode = root;

            // Navigate/create path structure
            for (let i = 0; i < pathParts.length - 1; i++) {
                const part = pathParts[i];
                if (!currentNode.children[part]) {
                    currentNode.children[part] = {
                        name: part,
                        children: {},
                        functionDetails: { total: 0, sync: 0, async: 0 },
                    };
                }
                currentNode = currentNode.children[part];
            }

            // Add file node
            const fileName = pathParts[pathParts.length - 1];
            currentNode.children[fileName] = {
                name: fileName,
                children: {},
                functionDetails: functionDetails,
                isFile: true,
            };
        }

        return root;
    }

    private renderTreeNode(node: TreeNode, prefix: string, isLast: boolean): string {
        let html = '';
        const children = Object.values(node.children);

        if (node.name !== 'root') {
            const connector = isLast ? '└── ' : '├── ';
            let displayName: string;

            if (node.isFile) {
                const details = node.functionDetails;
                let functionText = `<span class="function-count">${details.total} functions</span>`;

                // Add breakdown if there are both sync and async functions
                if (details.sync > 0 && details.async > 0) {
                    functionText += `<span class="function-detail">(<span class="sync-indicator">${details.sync} sync</span>, <span class="async-indicator">${details.async} async</span>)</span>`;
                } else if (details.async > 0) {
                    functionText += `<span class="function-detail">(<span class="async-indicator">all async</span>)</span>`;
                } else if (details.sync > 0) {
                    functionText += `<span class="function-detail">(<span class="sync-indicator">all sync</span>)</span>`;
                }

                displayName = `📄<span class="file">${node.name}</span>: ${functionText}`;
            } else {
                displayName = `📁<span class="folder">${node.name}/</span>`;
            }

            html += `<div class="tree-item">${prefix}${connector}${displayName}</div>\n`;
        }

        // Render children
        children.forEach((child, index) => {
            const isChildLast = index === children.length - 1;
            const childPrefix = node.name === 'root' ? '' : prefix + (isLast ? '    ' : '│   ');
            html += this.renderTreeNode(child, childPrefix, isChildLast);
        });

        return html;
    }
}

interface TreeNode {
    name: string;
    children: { [key: string]: TreeNode };
    functionDetails: FunctionDetails;
    isFile?: boolean;
}
