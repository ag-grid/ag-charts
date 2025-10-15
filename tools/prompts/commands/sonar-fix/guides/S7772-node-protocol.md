# Node.js built-in modules should be imported using the "node:" protocol

Rule ID: typescript:S7772

Rule URL: https://sonarcloud.io/api/rules/show?key=typescript%3AS7772&organization=ag-grid

When importing Node.js built-in modules, using the `node:` protocol makes it explicitly clear that you're importing a core Node.js module rather than a third-party package from npm.

**Key Benefits:**

-   **Clarity:** Immediately distinguishes built-in modules from npm packages
-   **Security:** Prevents potential supply chain attacks via npm package name squatting
-   **Future-proofing:** Aligns with Node.js best practices (introduced in v12.20.0)
-   **Consistency:** Creates uniform module referencing across the codebase

**Clean Code Attributes:**

-   Tags: convention, import, nodejs
-   Severity: Minor
-   Type: Code Smell

## Example Violations

```typescript
// Noncompliant: importing without node: protocol
import fs from 'fs';
import { createServer } from 'http';
import path from 'path';
```

```typescript
// Noncompliant: require syntax without node: protocol
const util = require('util');
const crypto = require('crypto');
```

```typescript
// Noncompliant: mixed built-in and npm imports
import fs from 'fs';
// Built-in
import lodash from 'lodash';

// npm package
```

## Example Fixes

```typescript
// Compliant: using node: protocol
import fs from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
```

```typescript
// Compliant: require syntax with node: protocol
const util = require('node:util');
const crypto = require('node:crypto');
```

```typescript
// Compliant: clearly distinguishing built-in from npm
// Built-in
import lodash from 'lodash';
import fs from 'node:fs';

// npm package
```

## AG Charts Context

### Common Patterns in AG Charts

In AG Charts, built-in Node.js modules are primarily used in:

1. **Build scripts and tooling:**

    ```typescript
    // Before
    import { readFileSync, writeFileSync } from 'fs';
    import { join, resolve } from 'path';

    // After
    import { readFileSync, writeFileSync } from 'node:fs';
    import { join, resolve } from 'node:path';
    ```

2. **Test utilities:**

    ```typescript
    // Before
    import { promisify } from 'util';

    // After
    import { promisify } from 'node:util';
    ```

3. **Development tools:**
    ```typescript
    // Before
    import crypto from 'crypto';
    // After
    import crypto from 'node:crypto';
    ```

### Special Considerations

-   **Runtime packages:** AG Charts' runtime packages (community/enterprise) should have ZERO dependencies, including Node.js built-ins, as they run in browsers
-   **Build/test only:** Node.js imports should only appear in:
    -   Build scripts (`tools/`, `scripts/`)
    -   Test files (`*.test.ts`, `*.spec.ts`)
    -   Development utilities
    -   Nx plugins and generators

### Where to Apply

-   ✅ **Apply in:** Build scripts, test files, development tools, Nx plugins
-   ❌ **Should not appear in:** `packages/ag-charts-core/src/`, `packages/ag-charts-community/src/`, `packages/ag-charts-enterprise/src/` (runtime code)

### Migration Strategy

1. Search for all Node.js built-in imports:
    - Common modules: `fs`, `path`, `util`, `crypto`, `http`, `https`, `stream`, `events`, `os`, `url`, `process`
2. Add `node:` prefix to each
3. Verify no runtime code uses Node.js modules
4. Run tests to ensure compatibility

### References

-   [Node.js Documentation: node: protocol](https://nodejs.org/api/esm.html#node-imports)
-   Node.js support: v12.20.0+ (well within AG Charts' requirements)
