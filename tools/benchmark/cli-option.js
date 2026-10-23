/** The value following `name` in `argv` (`--flag value`), or undefined when the flag is absent. */
function option(argv, name) {
    const index = argv.indexOf(name);
    return index === -1 ? undefined : argv[index + 1];
}

module.exports = { option };
