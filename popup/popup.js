import { debug } from '../debug';
import '../js/torrent-ui.js';
import '../js/torrent-list.js';

const { decodeDataAttr, encodeDataAttr, renderTorrentCardHtml, deleteTorrentConfirmMessage } = globalThis.TorrentUI;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { debugEnabled } = await chrome.storage.local.get('bgDebugEnabled');
        debug.setEnabled(debugEnabled);
    } catch (error) {
        debug.setEnabled(true);
    }

    const activeServerSelect = document.getElementById('activeServerSelect');
    const lastActionStatusSpan = document.getElementById('lastActionStatus');
    const clearLastActionStatusButton = document.getElementById('clearLastActionStatusButton');
    const manualUrlInput = document.getElementById('manualUrlInput');
    const manualAddButton = document.getElementById('manualAddButton');
    const openDashboardButton = document.getElementById('openDashboardButton');
    const openRssReaderButton = document.getElementById('openRssReaderButton');
    const openOptionsButton = document.getElementById('openOptionsButton');
    const reportIssueButton = document.getElementById('reportIssueButton');
    const reviewPromptRow = document.getElementById('reviewPromptRow');
    const reviewPromptLink = document.getElementById('reviewPromptLink');
    const reviewPromptNotNowButton = document.getElementById('reviewPromptNotNowButton');
    const reviewPromptNeverButton = document.getElementById('reviewPromptNeverButton');
    const reviewsPageUrl = `https://chromewebstore.google.com/detail/${chrome.runtime.id}/reviews`;

    // Active server details display elements
    const activeServerDetailsDiv = document.getElementById('activeServerDetails');
    const activeServerClientTypeSpan = document.getElementById('activeServerClientType');
    const activeServerUrlSpan = document.getElementById('activeServerUrl');
    const activeServerTagsSpan = document.getElementById('activeServerTags');
    const activeServerCategorySpan = document.getElementById('activeServerCategory');
    const activeServerPausedSpan = document.getElementById('activeServerPaused');
    const activeServerDlSpeedSpan = document.getElementById('activeServerDlSpeed');
    const activeServerUlSpeedSpan = document.getElementById('activeServerUlSpeed');
    const refreshTorrentsButton = document.getElementById('refreshTorrentsButton');
    const torrentListContainer = document.getElementById('torrentListContainer');
    const torrentListModeSelect = document.getElementById('torrentListModeSelect');
    const torrentListSummary = document.getElementById('torrentListSummary');
    let torrentListMode = 'recent';
    const torrentDropZone = document.getElementById('torrentDropZone');
    const torrentFileInput = document.getElementById('torrentFileInput');
    const clipboardStatusText = document.getElementById('clipboardStatusText');
    const addClipboardButton = document.getElementById('addClipboardButton');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    const searchSectionLabel = document.getElementById('searchSectionLabel');
    const qbitSearchPluginSelect = document.getElementById('qbitSearchPluginSelect');
    const popupOnboardingHint = document.getElementById('popupOnboardingHint');

    let servers = [];
    let currentActiveServerId = null;
    let latestClipboardValue = '';

    function formatBytes(bytes, decimals = 1) {
        const value = Number(bytes || 0);
        if (!value) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(value) / Math.log(k));
        return `${parseFloat((value / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
    }

    function escapeHtml(unsafe) {
        if (unsafe === null || typeof unsafe === 'undefined') return '';
        const div = document.createElement('div');
        div.textContent = String(unsafe);
        return div.innerHTML;
    }

    function displayActiveServerDetails(serverId) {
        const server = servers.find(s => s.id === serverId);
        if (server) {
            activeServerClientTypeSpan.textContent = server.clientType || 'qbittorrent';
            activeServerUrlSpan.textContent = server.url;
            activeServerTagsSpan.textContent = server.tags || 'Not set';
            activeServerCategorySpan.textContent = server.category || 'Not set';
            activeServerPausedSpan.textContent = server.addPaused ? 'Yes' : 'No';
            activeServerDlSpeedSpan.textContent = `${formatBytes(server.downloadSpeed)}/s`;
            activeServerUlSpeedSpan.textContent = `${formatBytes(server.uploadSpeed)}/s`;
            const limitsRow = document.getElementById('activeServerGlobalLimitsRow');
            const limitsSpan = document.getElementById('activeServerGlobalLimits');
            if (
                limitsRow &&
                limitsSpan &&
                server.clientType === 'qbittorrent' &&
                server.globalSpeedLimits
            ) {
                const gl = server.globalSpeedLimits;
                const fmt = (n) => (n <= 0 ? '∞' : `${formatBytes(n)}/s`);
                limitsSpan.textContent = `DL ${fmt(gl.dlLimit)}, UL ${fmt(gl.upLimit)}`;
                limitsRow.style.display = 'block';
            } else if (limitsRow) {
                limitsRow.style.display = 'none';
            }
            activeServerDetailsDiv.style.display = 'block';
        } else {
            activeServerClientTypeSpan.textContent = 'N/A';
            activeServerUrlSpan.textContent = 'N/A';
            activeServerTagsSpan.textContent = 'N/A';
            activeServerCategorySpan.textContent = 'N/A';
            activeServerPausedSpan.textContent = 'N/A';
            activeServerDlSpeedSpan.textContent = 'N/A';
            activeServerUlSpeedSpan.textContent = 'N/A';
            activeServerDetailsDiv.style.display = 'none';
        }
    }

    function populateServerSelect() {
        activeServerSelect.innerHTML = ''; // Clear existing options

        if (servers.length === 0) {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "No servers configured";
            activeServerSelect.appendChild(option);
            activeServerSelect.disabled = true;
            displayActiveServerDetails(null); // Clear details
            popupOnboardingHint.classList.remove('hidden');
            return;
        }
        activeServerSelect.disabled = false;
        popupOnboardingHint.classList.add('hidden');

        servers.forEach(server => {
            const option = document.createElement('option');
            option.value = server.id;
            option.textContent = server.name;
            if (server.id === currentActiveServerId) {
                option.selected = true;
            }
            activeServerSelect.appendChild(option);
        });
        displayActiveServerDetails(currentActiveServerId);
    }


    function updateReviewPromptVisibility(show) {
        if (!reviewPromptRow) return;
        if (show) {
            reviewPromptRow.classList.remove('hidden');
        } else {
            reviewPromptRow.classList.add('hidden');
        }
    }

    function loadReviewPromptState() {
        chrome.storage.local.get(['showReviewPromptInPopup'], (result) => {
            updateReviewPromptVisibility(!!result.showReviewPromptInPopup);
        });
    }

    if (reviewPromptLink) {
        reviewPromptLink.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.storage.local.set({ reviewPromptOpenedReview: true, showReviewPromptInPopup: false }, () => {
                updateReviewPromptVisibility(false);
                chrome.tabs.create({ url: reviewsPageUrl });
            });
        });
    }
    if (reviewPromptNotNowButton) {
        reviewPromptNotNowButton.addEventListener('click', () => {
            chrome.storage.local.set({ reviewPromptLastShownAt: Date.now(), showReviewPromptInPopup: false }, () => {
                updateReviewPromptVisibility(false);
            });
        });
    }
    if (reviewPromptNeverButton) {
        reviewPromptNeverButton.addEventListener('click', () => {
            chrome.storage.local.set({ reviewPromptDismissedPermanent: true, showReviewPromptInPopup: false }, () => {
                updateReviewPromptVisibility(false);
            });
        });
    }

    function loadPopupData() {
        chrome.storage.local.get(['servers', 'activeServerId', 'lastActionStatus', 'torrentListMode'], (result) => {
            torrentListMode = result.torrentListMode || 'recent';
            if (torrentListModeSelect) {
                torrentListModeSelect.value = torrentListMode;
            }
            servers = (result.servers || []).map(s => ({
                ...s,
                clientType: s.clientType || 'qbittorrent',
                url: s.url || s.qbUrl 
            }));
            currentActiveServerId = result.activeServerId;

            if (!currentActiveServerId && servers.length > 0) {
                // If no active server is set but servers exist, default to the first one
                currentActiveServerId = servers[0].id;
                chrome.storage.local.set({ activeServerId: currentActiveServerId }); // Save this default
            } else if (currentActiveServerId && !servers.find(s => s.id === currentActiveServerId)) {
                // If activeServerId points to a non-existent server (e.g., deleted)
                currentActiveServerId = servers.length > 0 ? servers[0].id : null;
                chrome.storage.local.set({ activeServerId: currentActiveServerId });
            }
            
            populateServerSelect();

            if (result.lastActionStatus) {
                lastActionStatusSpan.textContent = result.lastActionStatus;
            } else {
                lastActionStatusSpan.textContent = 'N/A';
            }
            refreshPopupServerStats();
            refreshTorrentList();
            loadReviewPromptState();
            loadQbitSearchPlugins();
        });
    }

    // Event listener for server selection change
    activeServerSelect.addEventListener('change', (event) => {
        const newActiveServerId = event.target.value;
        if (newActiveServerId) {
            currentActiveServerId = newActiveServerId;
            chrome.storage.local.set({ activeServerId: newActiveServerId }, () => {
                displayActiveServerDetails(newActiveServerId);
                loadQbitSearchPlugins();
            });
        }
    });
    
    // Listener for storage changes to update the popup dynamically
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            let needsUIRefresh = false;
            if (changes.servers) {
                servers = changes.servers.newValue || [];
                needsUIRefresh = true;
            }
            if (changes.activeServerId) {
                currentActiveServerId = changes.activeServerId.newValue;
                 // If activeServerId changed, ensure it's valid against the current (possibly changed) server list
                if (currentActiveServerId && !servers.find(s => s.id === currentActiveServerId)) {
                    currentActiveServerId = servers.length > 0 ? servers[0].id : null;
                }
                needsUIRefresh = true;
            }
            if (changes.lastActionStatus) {
                lastActionStatusSpan.textContent = changes.lastActionStatus.newValue || 'N/A';
            }
            if (changes.showReviewPromptInPopup) {
                updateReviewPromptVisibility(!!changes.showReviewPromptInPopup.newValue);
            }

            if(needsUIRefresh) {
                populateServerSelect();
            }
        }
    });

    // Open options page
    openOptionsButton.addEventListener('click', () => {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options/options.html'));
        }
    });

    // Open dashboard page
    openDashboardButton.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
    });

    openRssReaderButton?.addEventListener('click', () => {
        const serverId = currentActiveServerId || '';
        const qs = serverId ? `?serverId=${encodeURIComponent(serverId)}` : '';
        chrome.tabs.create({ url: chrome.runtime.getURL(`rss/rss.html${qs}`) });
    });

    async function refreshPopupServerStats() {
        chrome.runtime.sendMessage({ action: 'getPopupServerStats' }, (response) => {
            if (chrome.runtime.lastError || !response?.server) return;
            const server = response.server;
            servers = servers.map(s => (s.id === server.id ? server : s));
            displayActiveServerDetails(currentActiveServerId);
        });
    }

    function updateTorrentListSummary(shown, total, mode) {
        if (!torrentListSummary) return;
        if (!total && shown === 0) {
            torrentListSummary.classList.add('hidden');
            return;
        }
        const labels = { recent: 'recently added', active: 'active', all: 'total' };
        const label = labels[mode] || mode;
        torrentListSummary.textContent =
            total > shown
                ? `Showing ${shown} of ${total} ${label} torrents (newest first).`
                : `Showing ${shown} ${label} torrent(s), newest first.`;
        torrentListSummary.classList.remove('hidden');
    }

    function renderTorrentList(torrents, errorMessage = '', meta = {}) {
        if (errorMessage) {
            torrentListContainer.innerHTML = `<p class="text-red-500 dark:text-red-300">${escapeHtml(errorMessage)}</p>`;
            torrentListSummary?.classList.add('hidden');
            return;
        }
        if (!Array.isArray(torrents) || torrents.length === 0) {
            const emptyByMode = {
                recent: 'No recently added torrents on this server.',
                active: 'No active transfers right now.',
                all: 'No torrents on this server.',
            };
            torrentListContainer.innerHTML = `<p class="text-gray-500 dark:text-gray-300">${escapeHtml(emptyByMode[meta.listMode] || emptyByMode.recent)}</p>`;
            torrentListSummary?.classList.add('hidden');
            return;
        }
        torrentListContainer.innerHTML = torrents
            .map((torrent) =>
                renderTorrentCardHtml(torrent, {
                    formatBytes,
                    escapeHtml,
                })
            )
            .join('');
        updateTorrentListSummary(torrents.length, meta.total ?? torrents.length, meta.listMode || torrentListMode);
    }

    function refreshTorrentList() {
        chrome.runtime.sendMessage(
            { action: 'getPopupTorrents', listMode: torrentListMode },
            (response) => {
            if (chrome.runtime.lastError) {
                renderTorrentList([], chrome.runtime.lastError.message);
                return;
            }
            renderTorrentList(response?.torrents || [], response?.error || '', {
                total: response?.total,
                listMode: response?.listMode || torrentListMode,
            });
        });
    }

    async function readClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            latestClipboardValue = String(text || '').trim();
            if (latestClipboardValue.startsWith('magnet:') || /^https?:\/\//i.test(latestClipboardValue)) {
                clipboardStatusText.textContent = `${latestClipboardValue.substring(0, 60)}${latestClipboardValue.length > 60 ? '...' : ''}`;
                chrome.storage.local.get(['autoAddClipboardOnOpen'], ({ autoAddClipboardOnOpen }) => {
                    if (autoAddClipboardOnOpen) {
                        chrome.runtime.sendMessage({ action: 'addTorrentManually', url: latestClipboardValue });
                    }
                });
            } else {
                clipboardStatusText.textContent = 'Clipboard has no supported torrent URL.';
            }
        } catch (error) {
            clipboardStatusText.textContent = 'Clipboard permission denied.';
        }
    }

    async function addLocalTorrentFile(file) {
        if (!file) return;
        const activeServer = servers.find((s) => s.id === currentActiveServerId);
        if (!activeServer) {
            lastActionStatusSpan.textContent = 'Error: No active server selected.';
            return;
        }
        const dataUrl = await fileToDataUrl(file);
        const contentBase64 = dataUrl.split(',')[1] || '';
        chrome.runtime.sendMessage({
            action: 'addTorrentWithContent',
            payload: {
                serverId: activeServer.id,
                fileName: file.name,
                contentBase64
            }
        }, () => {
            manualUrlInput.value = '';
        });
    }

    function fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function updateSearchUi() {
        const { searchProvider = 'none' } = await chrome.storage.local.get('searchProvider');
        const labels = {
            none: 'Search (disabled in Options)',
            jackett: 'Search (Jackett)',
            prowlarr: 'Search (Prowlarr)',
            qbittorrent: 'Search (qBittorrent)',
        };
        if (searchSectionLabel) {
            searchSectionLabel.textContent = labels[searchProvider] || 'Search';
        }
        if (qbitSearchPluginSelect) {
            qbitSearchPluginSelect.style.display = searchProvider === 'qbittorrent' ? 'block' : 'none';
        }
    }

    async function loadQbitSearchPlugins() {
        const { searchProvider, activeServerId } = await chrome.storage.local.get([
            'searchProvider',
            'activeServerId',
        ]);
        if (searchProvider !== 'qbittorrent' || !qbitSearchPluginSelect || !activeServerId) return;
        chrome.runtime.sendMessage(
            { action: 'getQbitSearchPlugins', serverId: activeServerId },
            (response) => {
                if (!response?.success || !response.plugins?.length) return;
                qbitSearchPluginSelect.innerHTML =
                    '<option value="enabled">All enabled plugins</option>' +
                    response.plugins
                        .filter((p) => p.enabled)
                        .map((p) => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.fullName || p.name)}</option>`)
                        .join('');
            }
        );
    }

    function triggerSearch() {
        const query = searchInput.value.trim();
        if (!query) return;
        searchResultsContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-300">Searching...</p>';
        chrome.storage.local.get(['searchProvider', 'activeServerId'], ({ searchProvider, activeServerId }) => {
            const payload = {
                action: 'searchTorrents',
                query,
                limit: 20,
                serverId: searchProvider === 'qbittorrent' ? activeServerId : undefined,
                plugins:
                    searchProvider === 'qbittorrent' && qbitSearchPluginSelect
                        ? qbitSearchPluginSelect.value
                        : undefined,
            };
            chrome.runtime.sendMessage(payload, (response) => {
            if (chrome.runtime.lastError) {
                searchResultsContainer.innerHTML = `<p class="text-red-500 dark:text-red-300">${escapeHtml(chrome.runtime.lastError.message)}</p>`;
                return;
            }
            const errMsg =
                typeof response?.error === 'string'
                    ? response.error
                    : response?.error?.userMessage || response?.error || 'Search failed';
            if (!response?.success) {
                searchResultsContainer.innerHTML = `<p class="text-red-500 dark:text-red-300">${escapeHtml(errMsg)}</p>`;
                return;
            }
            const items = response.results || [];
            if (!items.length) {
                searchResultsContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-300">No results this time. Try broader terms or a different indexer filter.</p>';
                return;
            }
            const partialNote = response.timedOut
                ? '<p class="text-[10px] text-amber-600 dark:text-amber-300 mb-2">Search timed out; showing partial results.</p>'
                : '';
            searchResultsContainer.innerHTML = partialNote + items.map((item) => `
                <div class="border border-gray-200 dark:border-gray-600 rounded p-2">
                    <p class="font-medium truncate" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</p>
                    <p class="text-[10px] text-gray-600 dark:text-gray-300">Seeders: ${item.seeders ?? 'N/A'} | Size: ${item.size ? formatBytes(item.size) : 'N/A'}</p>
                    <button class="search-add-btn mt-1 px-2.5 py-1 text-xs bg-blue-600 text-white rounded" style="min-height:44px" data-link="${encodeDataAttr(item.link)}">Add</button>
                </div>
            `).join('');
            });
        });
    }

    // Initial load
    updateSearchUi();
    loadPopupData();
    loadReviewPromptState();
    readClipboard();

    reportIssueButton.addEventListener('click', () => {
        chrome.storage.local.get(['lastActionStatus', 'servers', 'activeServerId'], (result) => {
            const lastError = result.lastActionStatus;
            if (!lastError || !lastError.toLowerCase().startsWith('error:')) {
                lastActionStatusSpan.textContent = "No recent error found to report.";
                return;
            }

            const server = result.servers.find(s => s.id === result.activeServerId);
            const clientType = server ? server.clientType : 'N/A';
            const extensionVersion = chrome.runtime.getManifest().version;

            // Sanitize the error to remove potentially sensitive URLs
            const sanitizedError = lastError.replace(/https?:\/\/[^\s/$.?#].[^\s]*/gi, '[URL REDACTED]');

            const issueTitle = `Bug Report: Error with ${clientType} client`;
            const issueBody = `
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Error Message (from extension)**
\`\`\`
${sanitizedError}
\`\`\`

**Environment:**
- Extension Version: ${extensionVersion}
- Torrent Client: ${clientType}
- Client Version: [Please fill in]

**Additional context**
Add any other context about the problem here. Please double-check that you have removed any sensitive information like passwords or IP addresses from this report.
`;

            const githubUrl = `https://github.com/jgkme/Add-Remote-Torrent/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}`;
            chrome.tabs.create({ url: githubUrl });
        });
    });

    activeServerDetailsDiv.addEventListener('click', () => {
        const server = servers.find(s => s.id === currentActiveServerId);
        if (server && server.url) {
            let webUiUrl = server.url.replace(/\/$/, '');
            // Correctly construct the URL for uTorrent with a relative path
            if (server.clientType === 'utorrent' && server.utorrentrelativepath) {
                const relpath = server.utorrentrelativepath.replace(/^\/|\/$/g, '');
                if (relpath) {
                    webUiUrl += `/${relpath}/`;
                }
            }
            chrome.tabs.create({ url: webUiUrl });
        }
    });
    activeServerDetailsDiv.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            activeServerDetailsDiv.click();
        }
    });

    // Event listener for Clear Last Action Status button
    clearLastActionStatusButton.addEventListener('click', () => {
        chrome.storage.local.set({ lastActionStatus: 'N/A' }, () => {
            lastActionStatusSpan.textContent = 'N/A';
            // debug.log('Last action status cleared.');
        });
    });

    if (torrentListModeSelect) {
        torrentListModeSelect.addEventListener('change', () => {
            torrentListMode = torrentListModeSelect.value || 'recent';
            chrome.storage.local.set({ torrentListMode });
            refreshTorrentList();
        });
    }

    refreshTorrentsButton.addEventListener('click', () => {
        refreshPopupServerStats();
        refreshTorrentList();
    });
    torrentListContainer.addEventListener('click', (event) => {
        const button = event.target.closest('.torrent-action-btn');
        if (!button) return;
        if (button.dataset.action === 'delete') {
            const server = servers.find((s) => s.id === currentActiveServerId);
            if (!confirm(deleteTorrentConfirmMessage(server))) return;
        }
        const payload = { actionType: button.dataset.action, hash: decodeDataAttr(button.dataset.hash) };
        chrome.runtime.sendMessage({ action: 'torrentAction', payload }, (response) => {
            if (response?.success) {
                refreshTorrentList();
            } else {
                lastActionStatusSpan.textContent = `Error: ${response?.error || 'Action failed.'}`;
            }
        });
    });

    addClipboardButton.addEventListener('click', () => {
        if (latestClipboardValue.startsWith('magnet:') || /^https?:\/\//i.test(latestClipboardValue)) {
            chrome.runtime.sendMessage({ action: 'addTorrentManually', url: latestClipboardValue });
        } else {
            lastActionStatusSpan.textContent = 'Error: Clipboard does not have a valid torrent link.';
        }
    });

    torrentDropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        torrentDropZone.classList.add('border-blue-500');
    });
    torrentDropZone.addEventListener('dragleave', () => {
        torrentDropZone.classList.remove('border-blue-500');
    });
    torrentDropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        torrentDropZone.classList.remove('border-blue-500');
        const file = event.dataTransfer?.files?.[0];
        addLocalTorrentFile(file);
    });
    torrentFileInput.addEventListener('change', () => {
        addLocalTorrentFile(torrentFileInput.files?.[0]);
        torrentFileInput.value = '';
    });

    searchButton.addEventListener('click', triggerSearch);
    searchResultsContainer.addEventListener('click', (event) => {
        const button = event.target.closest('.search-add-btn');
        if (!button) return;
        chrome.runtime.sendMessage({ action: 'addTorrentManually', url: decodeDataAttr(button.dataset.link) });
    });
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') triggerSearch();
    });

    // Event listener for Manual Add button
    manualAddButton.addEventListener('click', () => {
        const urlToAdd = manualUrlInput.value.trim();
        if (urlToAdd) {
            const lines = urlToAdd.split('\n').map((line) => line.trim()).filter(Boolean);
            if (lines.length > 1) {
                chrome.runtime.sendMessage({ action: 'addTorrentBatch', urls: lines }, (response) => {
                    if (chrome.runtime.lastError) {
                        lastActionStatusSpan.textContent = `Error: ${chrome.runtime.lastError.message}`;
                    } else if (response?.status) {
                        lastActionStatusSpan.textContent = response.status;
                    }
                    manualUrlInput.value = '';
                });
            } else {
                chrome.runtime.sendMessage(
                    { action: 'addTorrentManually', url: urlToAdd },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            lastActionStatusSpan.textContent = `Error: ${chrome.runtime.lastError.message}`;
                        } else if (response && response.status) {
                            lastActionStatusSpan.textContent = response.status;
                        }
                        manualUrlInput.value = '';
                    }
                );
            }
        } else {
            lastActionStatusSpan.textContent = "Please enter at least one URL.";
        }
    });
});
