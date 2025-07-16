# When invoked with no arguments

-   Look at `${REPO_ROOT}/todo.md` and pick the next work item for the current branch.
-   Plan and execute the work item.
-   When the work item is completed, mark it as completed.

# When invoked with arguments

-   Update `${REPO_ROOT}/todo.md`:
    -   Add a new section for the current branch if it doesn't exist.
    -   Add a todo of '${ARGUMENTS}' to the current branch section.
-   DO NOT work on the item until it is picked.

# ${REPO_ROOT}/todo.md format

-   Each section has a git branch name
-   Each section has a list of TODO items.

## ag-15298/add-item-styler-highlight-state

-   [x] improve example by fixing radial bar example (renders no series at present).
-   [ ] investigate why OHLC example it broken.
-   [ ] investigate why `radialColumn1-label` is failing in the `item-styler-test`.