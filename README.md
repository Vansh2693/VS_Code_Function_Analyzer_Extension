# 🐍 Python Function Analyzer – VS Code Extension

A Visual Studio Code extension that analyzes Python files in your workspace and displays function counts in an interactive panel.

---

## ✨ Features

- 🔍 **Recursive Analysis**: Scans all `.py` files in selected folders
- 📊 **Function Counting**: Counts top-level function definitions
- ⚡ **Async & Sync Breakdown**: Distinguishes between `async` and `sync` functions — shown in the total summary and per file
- 🌳 **Tree View Display**: Results shown in a clean, collapsible hierarchical tree format
- 🧠 **Smart Folder Context**: Right-click folder to analyze instantly
- 🚀 **Fast Backend**: Efficiently executes Python using subprocesses

---

## 🛠 Installation

1. Clone this repository  
2. Run `npm install` to install dependencies  
3. Ensure you have Python 3.x installed  

---

## ▶️ Usage

### ✅ Recommended Method: Bash Script

To make running the extension easier, use the provided script:

```bash
./run-extension.sh
```

This script will:
- Compile the extension
- Launch VS Code in **Extension Development Mode**
- Optionally accept a custom folder to analyze

> Example:  
> ```bash  
> ./run-extension.sh ./my-python-folder  
> ```

---

## 🧪 Output Format

Once launched, the extension will display results in a **WebView panel**:

```
Python Function Analysis

📁 utils/
  ├── helper.py: 3 functions (2 sync, 1 async)
  └── formatter.py: 0 functions

📄 main.py: 5 functions (all sync)

Summary:
- Total Files: 4
- Total Functions: 8
  - Sync: 6
  - Async: 2
```
