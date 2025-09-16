# prettier-plugin-partial-js-markdown

A Prettier plugin that formats partial JavaScript/TypeScript code blocks in Markdown files. By default, Prettier skips incomplete code blocks that don't parse as valid JavaScript. This plugin intelligently wraps partial code to make it parseable, formats it, and then unwraps it to preserve the original intent.

## Features

- Formats partial JavaScript/TypeScript code blocks in Markdown
- Supports various code patterns:
  - Object properties/methods
  - Array elements
  - Function bodies
  - JSX fragments
  - TypeScript types and interfaces
  - Interface properties
- Preserves original code structure and intent
- Integrates seamlessly with existing Prettier configuration
- Handles both `.md` and `.mdoc` files

## Installation

This plugin is included as a local dependency in the AG Charts monorepo.

```bash
# From the repository root
yarn install
```

## Configuration

The plugin is automatically configured in the root `.prettierrc`:

```json
{
    "plugins": ["prettier-plugin-partial-js-markdown"],
    "overrides": [
        {
            "files": ["*.md", "*.mdoc"],
            "options": {
                "parser": "partial-js-markdown"
            }
        }
    ]
}
```

## How It Works

1. **Detection**: The plugin identifies JavaScript/TypeScript code blocks in Markdown files
2. **Analysis**: For partial code that fails to parse, it analyzes the code structure
3. **Wrapping**: Applies an appropriate wrapping strategy based on the code pattern:
   - Function body → Wrapped in a function declaration
   - Object properties → Wrapped in an object literal
   - Array elements → Wrapped in an array literal
   - JSX → Wrapped in a parenthesized expression
   - TypeScript types → Wrapped in a type declaration
   - Interface properties → Wrapped in an interface declaration
4. **Formatting**: Uses Prettier's standard JavaScript/TypeScript formatter
5. **Unwrapping**: Removes the wrapper and preserves the formatted partial code

## Examples

### Before

```markdown
\`\`\`js
series: [
    {
        type: 'line',
        marker: {
                itemStyler: ({ datum: { coal, nuclear }, fill, size }) => {
                    return coal > nuclear ? { fill: '#f44', size: 15 } : { fill, size };
                },
            },
    },
]
\`\`\`
```

### After

```markdown
\`\`\`js
series: [
    {
        type: 'line',
        marker: {
            itemStyler: ({ datum: { coal, nuclear }, fill, size }) => {
                return coal > nuclear ? { fill: '#f44', size: 15 } : { fill, size };
            },
        },
    },
]
\`\`\`
```

## Development

```bash
# Build the plugin
cd plugins/prettier-plugin-partial-js-markdown
yarn build

# Run tests
yarn test

# Format a specific file
prettier --write path/to/file.md
```

## Limitations

- Only formats JavaScript, TypeScript, JSX, and TSX code blocks
- Requires code blocks to be marked with appropriate language identifiers (js, javascript, ts, typescript, jsx, tsx)
- Some extremely malformed code may not be formattable

## License

MIT