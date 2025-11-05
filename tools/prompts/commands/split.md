# Split File with Git History Preservation

## 📋 Overview

Split large files into multiple files while preserving complete git history (blame, log) using the branch-merge technique.

**Usage**: `/split <source-file> [target-files...]`

**Examples**:

```bash
# Let AI analyze and propose split
/split packages/ag-charts-community/src/chart/data/dataModel.ts

# Specify target files explicitly
/split src/chart/dataModel.ts dataModelTypes.ts dataModelUtils.ts dataModelConstants.ts
```

⚠️ IMPORTANT: This command uses git branching and merging. Ensure working directory is clean before starting.

## ⚠️ MANDATORY WORKFLOW - COMPLETE IN ORDER

### STEP 0: Prerequisites Check

**Verify BEFORE proceeding:**

-   [ ] Git working directory is clean (`git status` shows no uncommitted changes)
-   [ ] Current branch is appropriate for this refactoring work
-   [ ] Source file exists and is tracked by git
-   [ ] You understand the source file's purpose and structure

**STOP if prerequisites not met - do not proceed**

### STEP 1: Analysis Phase

**Complete ALL before proposing plan:**

1. **Read and analyze source file:**

    - [ ] Count total lines
    - [ ] Identify all exported interfaces, types, classes, functions
    - [ ] Identify internal types, constants, and utilities
    - [ ] Map dependencies between different sections
    - [ ] Check for circular dependency risks

2. **If target files not specified, propose logical groupings:**

    - [ ] Types and interfaces → `${baseName}Types.ts`
    - [ ] Utility functions → `${baseName}Utils.ts`
    - [ ] Constants and symbols → `${baseName}Constants.ts`
    - [ ] Main implementation → Keep in original file or `${baseName}.ts`

3. **Generate split plan:**

    ```
    Source: path/to/sourceFile.ts (2700 lines)

    Target Files:
    1. path/to/sourceFileTypes.ts (~200 lines)
       - Exported: Interface A, Type B, Interface C
       - Internal: Type X, Type Y

    2. path/to/sourceFileUtils.ts (~150 lines)
       - Exported: function foo(), function bar()
       - Internal: helper1(), helper2()

    3. path/to/sourceFileConstants.ts (~10 lines)
       - Exported: CONST_A, CONST_B
       - Internal: Symbol definitions

    4. path/to/sourceFile.ts (~2300 lines)
       - Main class implementation
       - Updated imports from new files
    ```

4. **Analyze import impact:**
    - [ ] List all files that import from source file
    - [ ] Determine which imports need updating
    - [ ] Check for re-exports that might be affected

**Present plan to user and WAIT for approval before proceeding to Step 2**

### STEP 2: Preparation Phase

**Before any git operations:**

1. **Save current branch state:**

    ```bash
    ORIGINAL_BRANCH=$(git branch --show-current)
    STARTING_COMMIT=$(git rev-parse HEAD)
    echo "Starting from branch: $ORIGINAL_BRANCH at commit: $STARTING_COMMIT"
    ```

2. **Create working branches:**

    ```bash
    # Create a base branch for the refactor
    git checkout -b refactor/split-${baseName}-base
    ```

3. **Prepare split content:**
    - [ ] Read full source file
    - [ ] Extract content for each target file
    - [ ] Prepare import statements for each file
    - [ ] Prepare updated source file with imports

### STEP 3: Git History Preservation (Branch-Merge Technique)

For EACH target file (except the one that keeps original name):

**Substep A: Create Split Branch**

1. Return to base branch:

    ```bash
    git checkout refactor/split-${baseName}-base
    ```

2. Create branch for this split:

    ```bash
    git checkout -b refactor/split-${baseName}-${targetName}
    ```

3. **Rename source to target:**

    ```bash
    git mv ${sourcePath} ${targetPath}
    ```

4. **Modify target file to keep only relevant content:**

    - Remove all content that doesn't belong in this file
    - Add necessary imports
    - Ensure file is self-contained

5. **Commit the split:**
    ```bash
    git add ${targetPath}
    git commit -m "refactor: extract ${targetName} from ${sourceName} (preserving history)"
    ```

**Substep B: Merge Back to Preserve Both Files**

1. Return to base branch:

    ```bash
    git checkout refactor/split-${baseName}-base
    ```

2. Merge the split branch:

    ```bash
    git merge --no-ff refactor/split-${baseName}-${targetName}
    ```

3. **Resolve merge conflict:**

    - Git will report conflict because source file was renamed
    - Keep BOTH files: the original source file AND the new target file

    ```bash
    git checkout $ORIGINAL_BRANCH -- ${sourcePath}
    git add ${sourcePath} ${targetPath}
    git commit -m "refactor: preserve both ${sourceName} and ${targetName}"
    ```

4. Delete the split branch:
    ```bash
    git branch -d refactor/split-${baseName}-${targetName}
    ```

**Repeat Substeps A & B for each target file**

### STEP 4: Update Source File and Imports

**Now update the original source file:**

1. **Modify source file:**

    - Add imports from new split files
    - Remove code that was extracted
    - Ensure all references still work

2. **Update dependent files:**

    - For each file that imports from source
    - Update import paths if needed
    - Add imports from new split files

3. **Commit changes:**
    ```bash
    git add .
    git commit -m "refactor: update imports after splitting ${sourceName}"
    ```

### STEP 5: Validation (MANDATORY)

**Run these commands IN ORDER:**

1. **Format code:**

    ```bash
    nx format
    ```

2. **Type check:**

    ```bash
    nx build:types ${packageName}
    ```

    **If this fails → INVESTIGATE AND FIX**

3. **Run tests:**

    ```bash
    nx test ${packageName} --testPathPattern="${baseName}"
    ```

    **If tests fail → INVESTIGATE AND FIX**

4. **Verify git history preservation:**

    ```bash
    # For each split file
    git log --follow ${targetPath}
    git blame ${targetPath}
    ```

    **Verify that original commit history is visible**

5. **Verify all imports resolve:**
    ```bash
    nx build ${packageName}
    ```

### STEP 6: Cleanup and Merge

**If all validations pass:**

1. **Merge refactor branch to original branch:**

    ```bash
    git checkout $ORIGINAL_BRANCH
    git merge --no-ff refactor/split-${baseName}-base
    ```

2. **Delete refactor base branch:**

    ```bash
    git branch -d refactor/split-${baseName}-base
    ```

3. **Final verification:**
    ```bash
    nx format
    nx build:types ${packageName}
    nx test ${packageName}
    ```

**If any validation fails:**

1. **Abort and cleanup:**

    ```bash
    git checkout $ORIGINAL_BRANCH
    git branch -D refactor/split-${baseName}-base
    # Delete any remaining split branches
    ```

2. **Report errors to user and STOP**

## ✅ Completion Checklist

**Cannot mark complete until ALL checked:**

-   [ ] All target files created with proper content
-   [ ] Original source file updated with imports
-   [ ] All dependent files updated
-   [ ] `yarn nx format` passed
-   [ ] `yarn nx build:types` passed
-   [ ] `yarn nx test` passed
-   [ ] Git history verified with `git log --follow` and `git blame -C -C -C`
-   [ ] Changes merged back to original branch
-   [ ] Working directory is clean

## 🚫 If Validation Fails

**Common issues and fixes:**

1. **TypeScript errors**:

    - Check import paths are correct
    - Verify no circular dependencies introduced
    - Ensure all types are properly exported

2. **Test failures**:

    - Update test imports if needed
    - Check for broken references

3. **Git merge conflicts**:

    - Carefully review conflict markers
    - Ensure both files are preserved during merge

4. **Git history not preserved**:
    - Verify you used `git mv` (not manual rename)
    - Check `git log --follow` shows original commits
    - Try `git blame` with higher similarity threshold

## 📚 Technical Background

This command uses the **branch-merge technique** for preserving git history:

1. **Why it works**: Git tracks content, not filenames. When you:

    - Rename a file in one branch (A → B)
    - Keep original file in another branch (A)
    - Merge the branches
    - Result: Both files (A and B) retain the original's history

2. **Git history detection**:

    - `git log --follow` tracks renames within a single file
    - `git blame` detects content moved between files
    - `-C` flag increases copy/move detection sensitivity

3. **Why not simple copy**:
    - Simple copy/paste creates "new" files with no history
    - Git's content-based detection helps but is less reliable
    - Branch-merge technique guarantees history preservation

## 🔗 References

-   [Split Preserve History](https://github.com/piRGoif/split_preserve_history)
-   [Git Split File Tool](https://github.com/potherca-bash/git-split-file)
-   Git documentation: `git log --follow`, `git blame`
