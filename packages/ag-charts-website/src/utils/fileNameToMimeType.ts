const MIME_MAPPING = {
    '.txt': 'text/plain',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.htm': 'text/html',
    '.html': 'text/html',
    '.png': 'image/png',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
};

const DEFAULT_MAPPING = MIME_MAPPING['.txt'];

type FileExt = keyof typeof MIME_MAPPING;

export function fileNameToMimeType(fileName: string): string {
    const [fileExtMatch] = /\.([^.]+)$/.exec(fileName) || [];
    return MIME_MAPPING[fileExtMatch as FileExt] ?? DEFAULT_MAPPING;
}
