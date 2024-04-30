// Generates sequential numeric IDs, resetting to 0 when the maximum safe integer is reached.
export class IdGenerator {
    private currentId: number = 0;

    /**
     * Generates the next ID, resetting to 0 if the maximum safe integer value is reached.
     * @returns {number} The next ID.
     */
    generateId(): number {
        if (this.currentId === Number.MAX_SAFE_INTEGER) {
            this.currentId = 0;
        }
        return this.currentId++;
    }

    // Resets the current ID counter to zero.
    reset() {
        this.currentId = 0;
    }
}
