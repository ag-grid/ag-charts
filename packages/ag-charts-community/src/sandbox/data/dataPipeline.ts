import type { IDataProcessor } from './dataProcessor';

export class DataPipeline {
    private readonly processors = new Map<string, IDataProcessor>();
    private currentData: any[] | null = null;

    addProcessor(key: string, processor: IDataProcessor) {
        this.processors.set(key, processor);
        return this;
    }

    processData(data: any[]) {
        this.currentData = data;
        for (const [index, datum] of data.entries()) {
            for (const [key, processor] of this.processors) {
                processor.process(datum[key], index);
            }
        }
        return this;
    }

    getResults() {
        const results = new Map<string, any>();
        for (const [key, processor] of this.processors) {
            results.set(key, processor.getResult());
        }
        return results;
    }

    hasChanged(data: any[]) {
        return this.currentData === data;
    }

    clear() {
        this.currentData = null;
        this.processors.clear();
    }
}
