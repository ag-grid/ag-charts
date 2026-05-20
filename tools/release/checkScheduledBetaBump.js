const { execFileSync } = require('child_process');
const fs = require('fs');

function git(args, options = {}) {
    const result = execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options });
    return result == null ? '' : result.trim();
}

function hasLocalRef(ref) {
    try {
        git(['show-ref', '--verify', '--quiet', ref], { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

function hasRemoteTag(tag) {
    if (hasLocalRef(`refs/tags/${tag}`)) {
        return true;
    }

    try {
        git(['ls-remote', '--exit-code', '--tags', 'origin', `refs/tags/${tag}`], { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

function ensureRemoteBranchFetched(branch) {
    if (hasLocalRef(`refs/remotes/origin/${branch}`)) {
        return;
    }

    git(['fetch', 'origin', '--depth', '1', `+refs/heads/${branch}:refs/remotes/origin/${branch}`], {
        stdio: ['ignore', 'inherit', 'inherit'],
    });
}

function getPackageVersion(ref = undefined) {
    const packageJson = ref == null ? fs.readFileSync('package.json', 'utf8') : git(['show', `${ref}:package.json`]);
    return JSON.parse(packageJson).version;
}

function getReleaseBranches() {
    const branchRefPrefix = 'refs/heads/';
    let refs;

    try {
        const output = git(['ls-remote', '--heads', 'origin']);
        refs = output.split('\n').map((line) => line.split(/\s+/)[1]);
    } catch {
        if (process.env.GITHUB_ACTIONS === 'true') {
            throw new Error('Unable to list remote release branches.');
        }

        const output = git(['for-each-ref', '--format=%(refname)', 'refs/remotes/origin']);
        refs = output.split('\n').map((ref) => ref.replace('refs/remotes/origin/', branchRefPrefix));
    }

    return refs
        .filter((ref) => ref?.startsWith(branchRefPrefix))
        .map((ref) => ref.slice(branchRefPrefix.length))
        .filter((branch) => /^b\d+\.\d+\.\d+$/.test(branch));
}

function getReleaseVersion(version) {
    return version.replace(/-.*/, '');
}

function parseVersion(version) {
    const parts = version.split('.');
    if (parts.length !== 3) {
        throw new Error(`Invalid release version: ${version}`);
    }

    return parts.map((part) => {
        const parsedPart = Number(part);
        if (!Number.isInteger(parsedPart) || parsedPart < 0) {
            throw new Error(`Invalid release version: ${version}`);
        }

        return parsedPart;
    });
}

function compareVersions(a, b) {
    const versionA = parseVersion(a);
    const versionB = parseVersion(b);

    for (let index = 0; index < Math.max(versionA.length, versionB.length); index += 1) {
        const partA = versionA[index] ?? 0;
        const partB = versionB[index] ?? 0;

        if (partA !== partB) {
            return partA - partB;
        }
    }

    return 0;
}

function setOutput(name, value) {
    const output = `${name}=${value}\n`;

    if (process.env.GITHUB_OUTPUT != null) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, output);
    } else {
        process.stdout.write(output);
    }
}

function allowBump(reason) {
    console.log(reason);
    setOutput('can_bump', 'true');
}

function skipBump(reason) {
    console.log(reason);
    setOutput('can_bump', 'false');
}

const currentVersion = getPackageVersion();
const currentReleaseVersion = getReleaseVersion(currentVersion);
parseVersion(currentReleaseVersion);
const isBetaVersion =
    currentVersion !== currentReleaseVersion && currentVersion.startsWith(`${currentReleaseVersion}-beta.`);

if (!isBetaVersion) {
    allowBump(`Current version ${currentVersion} is not a beta version.`);
    process.exit(0);
}

const blockingReleaseBranches = [];
for (const branch of getReleaseBranches()) {
    const releaseVersion = branch.slice(1);
    if (compareVersions(releaseVersion, currentReleaseVersion) < 0) {
        continue;
    }

    if (hasRemoteTag(`release-${releaseVersion}`)) {
        continue;
    }

    ensureRemoteBranchFetched(branch);

    const branchPackageReleaseVersion = getReleaseVersion(getPackageVersion(`origin/${branch}`));
    parseVersion(branchPackageReleaseVersion);

    if (branchPackageReleaseVersion === releaseVersion) {
        blockingReleaseBranches.push(branch);
    }
}

if (blockingReleaseBranches.length > 0) {
    const releaseBranches = blockingReleaseBranches.join(', ');
    setOutput('release_branch', releaseBranches);
    skipBump(
        [
            `Skipping scheduled beta bump for ${currentVersion}.`,
            `Release branch ${releaseBranches} exists without a matching release tag, which indicates a release is still in progress.`,
            'Publish the release before creating another scheduled beta version bump on latest.',
        ].join('\n')
    );
} else {
    allowBump(`No in-progress release branches found at or after ${currentReleaseVersion}.`);
}
