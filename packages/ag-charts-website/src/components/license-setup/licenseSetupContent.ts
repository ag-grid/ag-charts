// Static copy for the licence setup tool, shared by the interactive page component and the
// markdown twin of /license-install (see utils/markdoc/renderLicenseSetup.ts) so the two
// cannot drift. Sentences carrying inline markup are stored as parts, and links as paths, so
// each renderer builds its own markup and resolves URLs for its own environment.

export const LICENSE_SETUP_HEADINGS = {
    validate: { id: 'validate-your-license', text: 'Validate Your Licence' },
    dependencies: { id: 'add-your-dependencies', text: 'Add Your Dependencies' },
    bootstrap: { id: 'set-up-your-application', text: 'Set Up Your Application' },
};

export const LICENSE_SETUP_COPY = {
    dependenciesLead: {
        before: 'Copy the following dependencies into your',
        code: 'package.json',
        after: ':',
    },
    npmLead: 'Or install using npm:',
    olderVersionNote: {
        before: 'If you are using an older version of AG Charts, before v11.0.0, please see the relevant',
        link: { text: 'documentation', url: '/documentation-archive/' },
        after: 'for help on installing your license key',
    },
    bootstrapLead: 'An example of how to set up your AG Charts Enterprise License Key:',
};
