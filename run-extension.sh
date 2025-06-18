EXTENSION_PATH="E:\VSC Extension\python-function-analyzer"

echo "🔧 Compiling TypeScript..."
npm run compile

echo "🚀 Launching VS Code with your extension..."
code --extensionDevelopmentPath="$EXTENSION_PATH"