import type { JsObjectSelection } from '../types';

const CHARS_TO_REPLACE = [' ', "'", '"', ',', '=', '[', ']'];
const CHAR_TO_REPLACE_WITH = '-';

function cleanString(str: string) {
    let output: string = str;
    CHARS_TO_REPLACE.forEach((char) => {
        output = output.replaceAll(char, CHAR_TO_REPLACE_WITH);
    });
    return output;
}

export function getSelectionReferenceId(selection: JsObjectSelection) {
    const { type, path } = selection;

    if (type === 'property') {
        const { propName } = selection;
        return cleanString(`reference-${path}-${propName}`);
    } else if (type === 'unionNestedObject') {
        const { index } = selection;
        return cleanString(`reference-${path}-${index}`);
    }
}
