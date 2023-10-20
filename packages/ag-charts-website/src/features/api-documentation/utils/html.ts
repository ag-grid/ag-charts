export function createLink(url: string, content: string) {
    const target = url.startsWith('http') ? '_blank' : '_self';
    return `<a href="${url}" target="${target}" rel="noreferrer">${content}</a>`;
}
