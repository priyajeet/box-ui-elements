module.exports = {
    branches: ['master', { name: 'beta', prerelease: true }],
    plugins: [
        '@semantic-release/commit-analyzer',
        '@semantic-release/release-notes-generator',
        [
            '@semantic-release/npm',
            {
                npmPublish: false,
            },
        ],
        '@semantic-release/github',
    ],
};
