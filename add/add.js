document.addEventListener('DOMContentLoaded', () => {
    const torrentUrlInput = document.getElementById('torrentUrl');
    const addButton = document.getElementById('addButton');

    addButton.addEventListener('click', () => {
        const url = torrentUrlInput.value.trim();
        if (url) {
            chrome.runtime.sendMessage({ action: 'addTorrentManually', url: url }, () => {
                window.close();
            });
        }
    });
});
