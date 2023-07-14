import type { FileContents } from '../features/examples-generator/types.d';

export const openPlunker = ({
    title,
    files,
    fileToOpen,
}: {
    title: string;
    files: FileContents;
    fileToOpen: string;
}) => {
    const form = document.createElement('form');
    form.method = 'post';
    form.style.display = 'none';
    form.action = `//plnkr.co/edit/?preview&open=${fileToOpen}`;
    form.target = '_blank';

    const addHiddenInput = (name, value) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;

        form.appendChild(input);
    };

    addHiddenInput('tags[0]', 'ag-grid');
    addHiddenInput('tags[1]', 'ag-charts');
    addHiddenInput('tags[2]', 'example');
    addHiddenInput('private', true);
    addHiddenInput('description', title);

    Object.keys(files).forEach((key) => {
        addHiddenInput(`files[${key}]`, files[key]);
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
};
