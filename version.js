// Version configuration for base version
const APP_VERSION = {
    major: 1,
    minor: 1,
    patch: 1,
    buildDate: "2025-04-12"
};

// GitHub repository information
const GITHUB_REPO = {
    owner: "kaizenapps",
    repo: "Drone-Sentinel-Web",
    branch: "main" // or your default branch
};

// Function to fetch the latest commit from GitHub API
async function fetchLatestCommit() {
    try {
        const versionElement = document.getElementById('app-version');
        
        // Show loading state
        if (versionElement) {
            versionElement.innerHTML = `v${APP_VERSION.major}.${APP_VERSION.minor}.${APP_VERSION.patch} <span style="color: #666;">loading commit...</span>`;
        }
        
        // Fetch latest commit from GitHub API
        const apiUrl = `https://api.github.com/repos/${GITHUB_REPO.owner}/${GITHUB_REPO.repo}/commits/${GITHUB_REPO.branch}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract commit information
        const commitHash = data.sha.substring(0, 7); // Short hash
        const commitUrl = `https://github.com/${GITHUB_REPO.owner}/${GITHUB_REPO.repo}/commit/${data.sha}`;
        const commitDate = new Date(data.commit.author.date).toISOString().split('T')[0];
        const commitMessage = data.commit.message.split('\n')[0]; // First line of commit message
        
        // Update version display
        if (versionElement) {
            versionElement.innerHTML = `
                v${APP_VERSION.major}.${APP_VERSION.minor}.${APP_VERSION.patch} 
                <a href="${commitUrl}" title="${commitMessage}" target="_blank" 
                   style="color: #777; text-decoration: underline; font-family: monospace;">${commitHash}</a>
            `;
        }
        
        // Save to sessionStorage to avoid repeated API calls
        sessionStorage.setItem('commitInfo', JSON.stringify({
            hash: commitHash,
            url: commitUrl,
            date: commitDate,
            message: commitMessage
        }));
        
        return { commitHash, commitUrl, commitDate, commitMessage };
    } catch (error) {
        console.error('Failed to fetch commit info:', error);
        displayFallbackVersion();
        return null;
    }
}

// Function to display fallback version if API fetch fails
function displayFallbackVersion() {
    const versionElement = document.getElementById('app-version');
    if (versionElement) {
        versionElement.innerHTML = `v${APP_VERSION.major}.${APP_VERSION.minor}.${APP_VERSION.patch}`;
    }
}

// Function to initialize version display
function initVersionDisplay() {
    // Check if we have cached commit info
    const cachedCommitInfo = sessionStorage.getItem('commitInfo');
    
    if (cachedCommitInfo) {
        // Use cached data to avoid API rate limits
        const { hash, url, message } = JSON.parse(cachedCommitInfo);
        const versionElement = document.getElementById('app-version');
        
        if (versionElement) {
            versionElement.innerHTML = `
                v${APP_VERSION.major}.${APP_VERSION.minor}.${APP_VERSION.patch} 
                <a href="${url}" title="${message}" target="_blank" 
                   style="color: #777; text-decoration: underline; font-family: monospace;">${hash}</a>
            `;
        }
    } else {
        // Fetch from GitHub API
        fetchLatestCommit();
    }
}

// Add event listener to update version when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initVersionDisplay();
});
