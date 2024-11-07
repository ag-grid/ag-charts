interface Props {
    text: string;
    searchTerm: string;
}

function escapeRegExpChars(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function HighlightText({ text, searchTerm }: Props) {
    const escapedSearchTerm = escapeRegExpChars(searchTerm);
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, index) =>
                part.toLowerCase() === searchTerm.toLowerCase() ? <strong key={index}>{part}</strong> : part
            )}
        </>
    );
}
