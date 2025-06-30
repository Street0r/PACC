document.addEventListener('DOMContentLoaded', function () {
    const highlight = document.getElementById('settings-higlight');
    const meta = document.getElementById('settings-meta');
    const threshold = document.getElementById('settings-threshold');
    const hint = document.getElementById('reload-hint');
    let fadeTimeout, hideTimeout;

    // Load saved settings
    chrome.storage.sync.get(['highlight', 'meta', 'metaThreshold'], function (data) {
        highlight.checked = data.highlight !== false; // default true
        meta.checked = data.meta !== false; // default true
        threshold.value = data.metaThreshold || 'LEVEL_BALL'; // default to LEVEL_BALL
    });

    function showHint() {
        clearTimeout(fadeTimeout);
        clearTimeout(hideTimeout);
        hint.style.display = 'block';
        hint.style.opacity = '1';
        // Start fading after 1s
        fadeTimeout = setTimeout(() => {
            hint.style.opacity = '0';
        }, 1500);
        // Hide after fade (5s fade)
        hideTimeout = setTimeout(() => {
            hint.style.display = 'none';
        }, 2000);
    }

    highlight.addEventListener('change', function () {
        chrome.storage.sync.set({ highlight: highlight.checked });
        showHint();
    });
    meta.addEventListener('change', function () {
        chrome.storage.sync.set({ meta: meta.checked });
        showHint();
    });
    threshold.addEventListener('change', function() {
        chrome.storage.sync.set({ metaThreshold: threshold.value });
        showHint();
    });
});