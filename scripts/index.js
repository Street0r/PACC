document.addEventListener('DOMContentLoaded', function () {
    const highlight = document.getElementById('settings-higlight');
    const meta = document.getElementById('settings-meta');
    const threshold = document.getElementById('settings-threshold');

    // Load saved settings
    chrome.storage.sync.get(['highlight', 'meta', 'metaThreshold'], function (data) {
        highlight.checked = data.highlight !== false; // default true
        meta.checked = data.meta !== false; // default true
        threshold.value = data.metaThreshold || 'LEVEL_BALL'; // default to LEVEL_BALL
    });

    highlight.addEventListener('change', function () {
        chrome.storage.sync.set({ highlight: highlight.checked });
    });
    meta.addEventListener('change', function () {
        chrome.storage.sync.set({ meta: meta.checked });
    });
    threshold.addEventListener('change', function () {
        chrome.storage.sync.set({ metaThreshold: threshold.value });
    });

    const manifest = chrome.runtime.getManifest();
    document.getElementById('version').textContent = 'v' + manifest.version;
});