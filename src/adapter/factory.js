const availablePlatforms = [
    'fission',
    'gcf',
    'aws'
];
const getPlatformAdapters = (platform) => {
    if (! platform) {
        platform = process.env.DEPLOYER_PLATFORM;
    }

    if (! availablePlatforms.includes(platform)) {
        throw new Error('Platform adapters not found.');
    }

    return require(__dirname + `/platforms/${platform}`);
}

module.exports = {
    getPlatformAdapters
}
