export interface FunctionAnalysisResult {
    /** Total number of Python files analyzed */
    totalFiles: number;
    /** Total number of functions found across all files */
    totalFunctions: number;
    /** Mapping of file paths to their function counts */
    fileData: { [filePath: string]: number };
    /** Root path that was analyzed */
    rootPath: string;
    /** ISO timestamp of when analysis was performed */
    timestamp: string;
    /** Any errors encountered during analysis */
    errors?: string[];
    /** Analysis configuration used */
    config: AnalysisConfig;
}

export interface AnalysisConfig {
    /** Whether to include nested functions */
    includeNestedFunctions: boolean;
    /** Patterns to exclude from analysis */
    excludePatterns: string[];
    /** Maximum depth for directory traversal */
    maxDepth?: number;
}

export interface PythonAnalysisOutput {
    /** Raw file counts from Python script */
    fileCounts: { [filePath: string]: number };
    /** Total files processed */
    totalFiles: number;
    /** Path that was analyzed */
    analysisPath: string;
    /** Any errors from Python script */
    error?: string;
    /** Processing time in seconds */
    processingTime?: number;
}

export interface TreeNode {
    /** Display name of the node */
    name: string;
    /** Child nodes (folders/files) */
    children: { [key: string]: TreeNode };
    /** Function count (only for files) */
    functionCount: number;
    /** Whether this node represents a file */
    isFile?: boolean;
    /** Full path to the file/folder */
    fullPath?: string;
}

export interface ExtensionConfig {
    /** User-defined exclude patterns */
    excludePatterns: string[];
    /** Whether to show nested functions */
    showNestedFunctions: boolean;
}
