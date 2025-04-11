// Version configuration
const APP_VERSION = {
    major: 1,
    minor: 0,
    patch: 0,
    // This can be updated with the GitHub commit hash
    commit: "3f7c2a9",
    // This should be the GitHub short URL to the commit
    commitUrl: "https://github.com/kaizenapps/Drone-Sentinel-Web/commit/3f7c2a9",
    buildDate: "2025-04-12"
};

// Function to display version in the footer
function displayVersion() {
    const versionElement = document.getElementById('app-version');
    if (versionElement) {
        versionElement.innerHTML = `v${APP_VERSION.major}.${APP_VERSION.minor}.${APP_VERSION.patch} <a href="${APP_VERSION.commitUrl}" target="_blank" style="color: #777; text-decoration: underline;">${APP_VERSION.commit}</a>`;
    }
}

// Add event listener to update version when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    displayVersion();
});
