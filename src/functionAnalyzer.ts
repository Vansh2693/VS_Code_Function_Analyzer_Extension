import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';

/**
 * Interface defining the structure of analysis results
 * Enhanced to support both sync and async function counts
 */
export interface FunctionAnalysisResult {
    totalFiles: number;
    totalFunctions: number;
    syncFunctions: number;
    asyncFunctions: number;
    fileData: { [filePath: string]: FunctionDetails };
    rootPath: string;
    timestamp: string;
}

/**
 * Interface defining function count details for each file
 */
export interface FunctionDetails {
    total: number;
    sync: number;
    async: number;
}

/**
 * Class responsible for analyzing Python functions in a given directory
 * Follows OOP principles with clear separation of concerns
 */
export class FunctionAnalyzer {
    private context: vscode.ExtensionContext;
    private pythonScriptPath: string;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.pythonScriptPath = path.join(this.context.extensionPath, 'pythonFiles', 'analyze_functions.py');
    }

    public async analyzePythonFunctions(folderPath: string): Promise<FunctionAnalysisResult> {
        return new Promise((resolve, reject) => {
            // Spawn Python subprocess to perform the analysis
            const pythonProcess = spawn('python', [this.pythonScriptPath, folderPath], {
                cwd: this.context.extensionPath,
                stdio: ['pipe', 'pipe', 'pipe'],
            });

            let outputData = '';
            let errorData = '';

            pythonProcess.stdout.on('data', (data) => {
                outputData += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorData += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    try {
                        const rawResult = JSON.parse(outputData.trim());
                        const analysisResult = this.processAnalysisResult(rawResult, folderPath);
                        resolve(analysisResult);
                    } catch (parseError) {
                        reject(new Error(`Failed to parse analysis results: ${parseError}`));
                    }
                } else {
                    reject(new Error(`Python analysis failed (code ${code}): ${errorData}`));
                }
            });

            pythonProcess.on('error', (error) => {
                reject(new Error(`Failed to start Python process: ${error.message}`));
            });
        });
    }

    private processAnalysisResult(rawResult: any, rootPath: string): FunctionAnalysisResult {
        const fileData = rawResult.file_counts || {};
        const summary = rawResult.summary || {};

        const totalFiles = Object.keys(fileData).length;
        const totalFunctions = summary.total_functions || 0;
        const syncFunctions = summary.sync_functions || 0;
        const asyncFunctions = summary.async_functions || 0;

        return {
            totalFiles,
            totalFunctions,
            syncFunctions,
            asyncFunctions,
            fileData,
            rootPath,
            timestamp: new Date().toISOString(),
        };
    }

    public async validatePythonAvailability(): Promise<boolean> {
        return new Promise((resolve) => {
            const pythonProcess = spawn('python', ['--version'], { stdio: 'pipe' });

            pythonProcess.on('close', (code) => {
                resolve(code === 0);
            });

            pythonProcess.on('error', () => {
                resolve(false);
            });
        });
    }
}
