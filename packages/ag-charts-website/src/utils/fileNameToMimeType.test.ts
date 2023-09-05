import { fileNameToMimeType } from './fileNameToMimeType';

describe.each([
    { fileName: 'styles.css', output: 'text/css' },
    { fileName: 'script.js', output: 'text/javascript' },
    { fileName: 'multi.word.script.js', output: 'text/javascript' },
    { fileName: 'something.someWeirdFileExt', output: 'text/plain' },
    { fileName: 'something', output: 'text/plain' },
])('addNonBreakingSpaceBetweenLastWords', ({ fileName, output }) => {
    it(`${fileName} outputs ${output}`, () => {
        expect(fileNameToMimeType(fileName)).toEqual(output);
    });
});
