---
name: file-system-operations
description: File and folder operations for Windows PowerShell 5.1 environment. Use when creating directories, moving files, cleaning up folders, or any file system manipulation in this project.
---

# File System Operations

This project runs on **Windows 11 with PowerShell 5.1**. Standard Unix commands (`mkdir -p`, `rm -rf`, `mv`, `cp`) will **FAIL** or behave unexpectedly. Use the patterns below exclusively.

## CRITICAL RULES

1. **NEVER** use `mkdir -p` — PowerShell doesn't support `-p` flag and interprets the second argument as a positional parameter error
2. **NEVER** use `rm -rf` — PowerShell uses `Remove-Item -Recurse -Force`
3. **NEVER** use `mv` or `cp` with Unix syntax — Use `Move-Item` and `Copy-Item`
4. **NEVER** use `&&` for chaining — PowerShell doesn't support it. Use `;` or `if ($?) { ... }`
5. **Always use forward slashes** in paths (`C:/path/to/dir`) — they work reliably in PowerShell
6. **NEVER use `echo` for file writing** — use the `Write` tool instead
7. **Always clean up accidentally created directories** — if a command creates directories in wrong locations (like `C:/Users/ZIRO/Projects`), remove them immediately

## Directory Creation

### Create a single directory
```powershell
New-Item -ItemType Directory -Force -Path "C:/path/to/dir"
```

### Create multiple directories (including nested)
```powershell
New-Item -ItemType Directory -Force -Path "C:/base/path/a/b/c", "C:/base/path/d/e/f", "C:/base/path/g/h"
```
PowerShell automatically creates intermediate directories.

### Create nested directory structure in one call
```powershell
New-Item -Path "C:/base/src/domain/entities" -ItemType Directory; New-Item -Path "C:/base/src/domain/repositories" -ItemType Directory; New-Item -Path "C:/base/src/application/use-cases" -ItemType Directory; New-Item -Path "C:/base/src/infrastructure/repositories" -ItemType Directory; New-Item -Path "C:/base/src/interfaces/http/dto" -ItemType Directory
```

## Directory Deletion

### Remove a directory and all contents
```powershell
Remove-Item -Path "C:/path/to/remove" -Recurse -Force 2>$null
```

### Remove multiple directories
```powershell
Remove-Item -Path "C:/path/a", "C:/path/b", "C:/path/c" -Recurse -Force 2>$null
```

## File Operations

### Move a file or directory
```powershell
Move-Item -Path "C:/old/location/file.txt" -Destination "C:/new/location/file.txt"
```

### Copy a file
```powershell
Copy-Item -Path "C:/source/file.txt" -Destination "C:/dest/file.txt"
```

### Delete a file
```powershell
Remove-Item -Path "C:/path/to/file.txt" -Force
```

### List files recursively
```powershell
Get-ChildItem -Path "C:/path" -Recurse -File | Select-Object FullName
```

### List directories recursively
```powershell
Get-ChildItem -Path "C:/path" -Recurse -Directory | Select-Object FullName
```

## Clean Architecture Module Creation Pattern

When creating a new Clean Architecture module, use this exact pattern:

```powershell
# 1. Remove old module files (if they exist)
$basePath = "C:/Users/ZIRO/Documents/Dev/iot-analytics-platform/backend/src/module_name";
Remove-Item -Path "$basePath/service.ts" -Force 2>$null;
Remove-Item -Path "$basePath/controller.ts" -Force 2>$null;
Remove-Item -Path "$basePath/entities" -Recurse -Force 2>$null;
Remove-Item -Path "$basePath/dto" -Recurse -Force 2>$null;

# 2. Create new Clean Architecture structure
New-Item -ItemType Directory -Force -Path "$basePath/domain/entities", "$basePath/domain/repositories", "$basePath/application/use-cases", "$basePath/infrastructure/repositories", "$basePath/interfaces/http/dto"
```

## Common Mistakes to Avoid

### WRONG: Unix-style commands
```bash
mkdir -p src/devices/domain/entities src/devices/domain/repositories
rm -rf src/devices/entities
mv old new
```

### CORRECT: PowerShell equivalents
```powershell
New-Item -ItemType Directory -Force -Path "C:/path/src/devices/domain/entities", "C:/path/src/devices/domain/repositories"
Remove-Item -Path "C:/path/src/devices/entities" -Recurse -Force
Move-Item -Path "C:/path/old" -Destination "C:/path/new"
```

## Path Reference

| Component | Path |
|-----------|------|
| Backend root | `C:/Users/ZIRO/Documents/Dev/iot-analytics-platform/backend` |
| Source code | `C:/Users/ZIRO/Documents/Dev/iot-analytics-platform/backend/src` |
| Prisma schema | `C:/Users/ZIRO/Documents/Dev/iot-analytics-platform/backend/prisma/schema.prisma` |
| Skills directory | `C:/Users/ZIRO/Documents/Dev/iot-analytics-platform/backend/.agents/skills` |

## Build Commands

```powershell
# Build
npm run build

# Run linting (if available)
npm run lint

# Run tests
npm run test
```

## Important Notes

- PowerShell 5.1 runs in the working directory: `C:\Users\ZIRO\Documents\Dev\iot-analytics-platform\backend`
- All `Remove-Item` commands should include `2>$null` to suppress errors if files don't exist
- Always verify directory creation with `Get-ChildItem -Recurse -File | Select-Object FullName`
- If using the `bash` tool, it wraps PowerShell commands — the same PowerShell rules apply