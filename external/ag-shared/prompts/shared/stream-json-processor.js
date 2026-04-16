/**
 * Stream JSON Processor for Claude Code CLI output
 *
 * Processes stream-json format messages from Claude Code CLI based on @anthropic-ai/sdk Message types.
 * This module provides utilities for parsing and displaying progress from Claude's streaming JSON output.
 *
 * Message structure from SDK:
 * - Messages have role: 'user' | 'assistant'
 * - Content is an array of blocks: TextBlock, ToolUseBlock, ToolResultBlock
 * - TextBlock: { type: 'text', text: string }
 * - ToolUseBlock: { type: 'tool_use', id: string, name: string, input: object }
 * - ToolResultBlock: { type: 'tool_result', tool_use_id: string, content: string|null, is_error: boolean }
 */

class StreamJsonProcessor {
    constructor(options = {}) {
        this.options = {
            showDebug: false,
            showToolIds: true,
            maxPreviewLength: 100,
            maxParamsLength: 100,
            indentPrefix: '   ',
            ...options,
        };

        this.stats = {
            messagesProcessed: 0,
            toolsInvoked: 0,
            errors: 0,
        };
    }

    /**
     * Process a single JSON line from the stream
     * @param {string} line - JSON line to process
     * @returns {Object|null} Processed message info or null if parse failed
     */
    processLine(line) {
        if (!line.trim()) return null;

        try {
            const json = JSON.parse(line);
            this.stats.messagesProcessed++;
            return this.processMessage(json);
        } catch (e) {
            if (this.options.showDebug) {
                console.log(`${this.options.indentPrefix}[DEBUG] Failed to parse JSON: ${line.substring(0, 50)}...`);
                console.log(`${this.options.indentPrefix}[DEBUG] Error: ${e.message}`);
            }
            this.stats.errors++;
            return null;
        }
    }

    /**
     * Process a parsed JSON message
     * @param {Object} json - Parsed JSON message
     * @returns {Object} Message info with type, content, and formatted output
     */
    processMessage(json) {
        const result = {
            type: json.type,
            raw: json,
            output: [],
            messageCategory: 'unknown', // 'tool', 'content', 'system', 'result'
        };

        // Handle different message types based on the stream-json format
        switch (json.type) {
            case 'system':
                // System initialization message
                result.messageCategory = 'system';
                result.output.push(this.formatLine('📋 System: Conversation initialized'));
                break;

            case 'user':
                // User messages (including tool results)
                if (json.message?.content || json.content) {
                    const content = json.message?.content || json.content;
                    // Check if this contains tool results
                    const hasToolResult = this.containsToolResult(content);
                    result.messageCategory = hasToolResult ? 'tool' : 'content';
                    result.output.push(...this.processContentBlocks(content, 'user'));
                }
                break;

            case 'assistant':
                // Assistant messages with potential tool uses
                if (json.message?.content || json.content) {
                    const content = json.message?.content || json.content;
                    // Check if this contains tool uses
                    const hasToolUse = this.containsToolUse(content);
                    result.messageCategory = hasToolUse ? 'tool' : 'content';
                    result.output.push(...this.processContentBlocks(content, 'assistant'));
                }
                break;

            case 'result':
                // Final result message with stats
                result.messageCategory = 'result';
                if (json.subtype === 'success') {
                    result.output.push(this.formatLine('✨ Completed successfully!'));
                    if (json.total_cost_usd) {
                        result.output.push(this.formatLine(`   └─ Cost: $${json.total_cost_usd.toFixed(4)}`));
                    }
                    if (json.duration_ms) {
                        result.output.push(this.formatLine(`   └─ Duration: ${(json.duration_ms / 1000).toFixed(1)}s`));
                    }
                    result.stats = {
                        success: true,
                        cost: json.total_cost_usd,
                        duration: json.duration_ms,
                    };
                } else if (json.subtype === 'error') {
                    result.output.push(this.formatLine(`❌ Error: ${json.error || 'Unknown error'}`));
                    result.stats = {
                        success: false,
                        error: json.error,
                    };
                    this.stats.errors++;
                }
                break;

            // Legacy/alternative event types (kept for compatibility)
            case 'tool_use':
                this.stats.toolsInvoked++;
                result.messageCategory = 'tool';
                result.output.push(this.formatLine(`🔧 Tool: ${json.name || 'unknown'}`));
                if (json.input) {
                    const params = JSON.stringify(json.input);
                    result.output.push(
                        this.formatLine(
                            `   └─ ${params.length <= this.options.maxParamsLength ? params : params.substring(0, this.options.maxParamsLength - 3) + '...'}`
                        )
                    );
                }
                break;

            case 'tool_result':
                result.messageCategory = 'tool';
                result.output.push(this.formatLine('✅ Tool result'));
                if (json.content) {
                    const preview = this.formatContentPreview(json.content, 80);
                    result.output.push(this.formatLine(`   └─ ${preview}`));
                }
                break;

            default:
                if (this.options.showDebug) {
                    result.output.push(this.formatLine(`[DEBUG] Unknown event type: ${json.type}`));
                }
                break;
        }

        return result;
    }

    /**
     * Process content blocks based on SDK types
     * @param {string|Array} content - Content to process
     * @param {string} role - 'user' or 'assistant'
     * @returns {Array<string>} Formatted output lines
     */
    processContentBlocks(content, role) {
        const output = [];

        // Handle string content
        if (typeof content === 'string') {
            const preview = content.substring(0, this.options.maxPreviewLength).replace(/\n/g, ' ');
            if (preview.trim()) {
                const icon = role === 'user' ? '👤' : '💭';
                const label = role === 'user' ? 'User' : 'Claude';
                output.push(
                    this.formatLine(
                        `${icon} ${label}: ${preview}${content.length > this.options.maxPreviewLength ? '...' : ''}`
                    )
                );
            }
            return output;
        }

        // Handle array of content blocks
        if (Array.isArray(content)) {
            content.forEach((block) => {
                switch (block.type) {
                    case 'text':
                        // TextBlock
                        if (block.text && block.text.trim()) {
                            const preview = block.text.substring(0, this.options.maxPreviewLength).replace(/\n/g, ' ');
                            const icon = role === 'user' ? '👤' : '💭';
                            const label = role === 'user' ? 'User' : 'Claude';
                            output.push(
                                this.formatLine(
                                    `${icon} ${label}: ${preview}${block.text.length > this.options.maxPreviewLength ? '...' : ''}`
                                )
                            );
                        }
                        break;

                    case 'tool_use':
                        // ToolUseBlock
                        this.stats.toolsInvoked++;
                        output.push(this.formatLine(`🔧 Tool: ${block.name || 'unknown'}`));
                        if (this.options.showToolIds && block.id) {
                            output.push(this.formatLine(`   ├─ ID: ${block.id}`));
                        }
                        if (block.input) {
                            const params = JSON.stringify(block.input);
                            output.push(
                                this.formatLine(
                                    `   └─ Input: ${params.length <= this.options.maxParamsLength ? params : params.substring(0, this.options.maxParamsLength - 3) + '...'}`
                                )
                            );
                        }
                        break;

                    case 'tool_result':
                        // ToolResultBlock
                        output.push(this.formatLine(`✅ Tool result${block.is_error ? ' (error)' : ''}`));
                        if (block.is_error) {
                            this.stats.errors++;
                        }
                        if (this.options.showToolIds && block.tool_use_id) {
                            output.push(this.formatLine(`   ├─ Tool ID: ${block.tool_use_id}`));
                        }
                        if (block.content) {
                            const preview = this.formatContentPreview(block.content, 80);
                            output.push(this.formatLine(`   └─ ${block.is_error ? 'Error' : 'Result'}: ${preview}`));
                        }
                        break;

                    default:
                        if (this.options.showDebug) {
                            output.push(this.formatLine(`[DEBUG] Unknown block type: ${block.type}`));
                        }
                        break;
                }
            });
        }

        return output;
    }

    /**
     * Check if content contains tool use blocks
     * @param {string|Array} content - Content to check
     * @returns {boolean} True if contains tool use
     */
    containsToolUse(content) {
        if (Array.isArray(content)) {
            return content.some((block) => block.type === 'tool_use');
        }
        return false;
    }

    /**
     * Check if content contains tool result blocks
     * @param {string|Array} content - Content to check
     * @returns {boolean} True if contains tool result
     */
    containsToolResult(content) {
        if (Array.isArray(content)) {
            return content.some((block) => block.type === 'tool_result');
        }
        return false;
    }

    /**
     * Format content for preview
     * @param {any} content - Content to format
     * @param {number} maxLength - Maximum length
     * @returns {string} Formatted preview
     */
    formatContentPreview(content, maxLength) {
        let preview;
        if (typeof content === 'string') {
            preview = content.replace(/\n/g, ' ');
        } else if (Array.isArray(content) && content[0]?.text) {
            preview = content[0].text.replace(/\n/g, ' ');
        } else {
            preview = JSON.stringify(content);
        }
        return preview.length > maxLength ? preview.substring(0, maxLength - 3) + '...' : preview;
    }

    /**
     * Format a line with the configured indent prefix
     * @param {string} text - Text to format
     * @returns {string} Formatted line
     */
    formatLine(text) {
        return `${this.options.indentPrefix}${text}`;
    }

    /**
     * Process a stream of JSON lines
     * @param {string} data - Data containing multiple JSON lines
     * @param {Function} onMessage - Callback for each processed message
     * @returns {Array<Object>} All processed messages
     */
    processStream(data, onMessage) {
        const lines = data.split('\n');
        const messages = [];

        for (const line of lines) {
            const message = this.processLine(line);
            if (message) {
                messages.push(message);
                if (onMessage) {
                    onMessage(message);
                }
            }
        }

        return messages;
    }

    /**
     * Get current processing statistics
     * @returns {Object} Current stats
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            messagesProcessed: 0,
            toolsInvoked: 0,
            errors: 0,
        };
    }

    /**
     * Create a stream processor that handles incomplete JSON lines
     * @returns {Object} Stream processor with write and end methods
     */
    createStreamHandler() {
        let buffer = '';

        return {
            /**
             * Write data to the stream
             * @param {string} data - Data to write
             * @param {Function} onMessage - Callback for each processed message
             */
            write: (data, onMessage) => {
                buffer += data;
                const lines = buffer.split('\n');

                // Keep the last incomplete line in the buffer
                buffer = lines.pop() || '';

                // Process complete lines
                for (const line of lines) {
                    const message = this.processLine(line);
                    if (message && onMessage) {
                        onMessage(message);
                    }
                }
            },

            /**
             * End the stream and process any remaining data
             * @param {Function} onMessage - Callback for each processed message
             */
            end: (onMessage) => {
                if (buffer.trim()) {
                    const message = this.processLine(buffer);
                    if (message && onMessage) {
                        onMessage(message);
                    }
                }
                buffer = '';
            },
        };
    }
}

module.exports = StreamJsonProcessor;
