document.addEventListener('DOMContentLoaded', () => {
    const serverStatusContainer = document.getElementById('serverStatusContainer');
    const actionHistoryList = document.getElementById('actionHistoryList');
    const refreshAllButton = document.getElementById('refreshAllButton');
    const clearHistoryButton = document.getElementById('clearHistoryButton');

    function formatBytes(bytes, decimals = 2) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function renderServerStatus(servers) {
        serverStatusContainer.innerHTML = '';
        if (!servers || servers.length === 0) {
            serverStatusContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 col-span-full">No servers configured. Please add a server in the options page.</p>';
            return;
        }

        servers.forEach(server => {
            const isOnline = server.status === 'online';
            const cardElement = document.createElement('div');
            cardElement.className = `bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border-l-4 ${isOnline ? 'border-green-500' : 'border-red-500'}`;

            const freeSpace = (typeof server.freeSpace === 'number' && server.freeSpace >= 0) ? formatBytes(server.freeSpace) : 'N/A';
            const totalTorrents = (typeof server.total_torrents === 'number') ? server.total_torrents : 'N/A';
            const dlSpeed = (typeof server.dl_info_speed === 'number') ? `${formatBytes(server.dl_info_speed)}/s` : 'N/A';
            const ulSpeed = (typeof server.up_info_speed === 'number') ? `${formatBytes(server.up_info_speed)}/s` : 'N/A';

            cardElement.innerHTML = `
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white truncate">${server.name}</h3>
                    <span class="px-2 py-1 text-xs font-semibold text-white ${isOnline ? 'bg-green-500' : 'bg-red-500'} rounded-full">${isOnline ? 'Online' : 'Offline'}</span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400"><strong>Client:</strong> ${server.clientType || 'N/A'} ${server.version ? `(v${server.version})` : ''}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400"><strong>URL:</strong> <span class="break-all">${server.url}</span></p>
                <p class="text-sm text-gray-600 dark:text-gray-400"><strong>Free Space:</strong> ${freeSpace}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400"><strong>Torrents:</strong> ${totalTorrents}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400"><strong>DL Speed:</strong> ${dlSpeed}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400"><strong>UL Speed:</strong> ${ulSpeed}</p>
                <div class="mt-4">
                    <button class="text-blue-500 hover:underline text-sm show-more-btn">Show More</button>
                    <div class="raw-data hidden mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                        <pre class="text-xs whitespace-pre-wrap break-all">${JSON.stringify(server, null, 2)}</pre>
                    </div>
                </div>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">Last checked: ${server.lastChecked ? new Date(server.lastChecked).toLocaleString() : 'Never'}</p>
            `;
            serverStatusContainer.appendChild(cardElement);
        });

        document.querySelectorAll('.show-more-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const rawData = e.target.nextElementSibling;
                const isHidden = rawData.classList.contains('hidden');
                if (isHidden) {
                    rawData.classList.remove('hidden');
                    e.target.textContent = 'Show Less';
                } else {
                    rawData.classList.add('hidden');
                    e.target.textContent = 'Show More';
                }
            });
        });
    }

    function renderActionHistory(history) {
        actionHistoryList.innerHTML = '';
        if (!history || history.length === 0) {
            actionHistoryList.innerHTML = '<p class="text-gray-500 dark:text-gray-400">No recent activity to display.</p>';
            return;
        }

        history.forEach(action => {
            const isError = action.message.toLowerCase().includes('error') || action.message.toLowerCase().includes('failed');
            const item = `
                <li class="border-b border-gray-200 dark:border-gray-700 pb-3">
                    <p class="text-sm ${isError ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}">${action.message}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${new Date(action.timestamp).toLocaleString()}</p>
                </li>
            `;
            actionHistoryList.innerHTML += item;
        });
    }

    function loadDashboardData() {
        chrome.storage.local.get(['servers', 'actionHistory'], (result) => {
            renderServerStatus(result.servers || []);
            renderActionHistory(result.actionHistory || []);
        });
    }

    // Listen for storage changes to update the dashboard dynamically
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            if (changes.servers) {
                renderServerStatus(changes.servers.newValue || []);
            }
            if (changes.actionHistory) {
                renderActionHistory(changes.actionHistory.newValue || []);
            }
        }
    });

    // Initial load
    loadDashboardData();

    refreshAllButton.addEventListener('click', () => {
        refreshAllButton.disabled = true;
        refreshAllButton.textContent = 'Refreshing...';
        chrome.runtime.sendMessage({ action: 'triggerServerStatusCheck' }, () => {
            // The storage listener will automatically update the UI.
            // We can re-enable the button after a short delay.
            setTimeout(() => {
                refreshAllButton.disabled = false;
                refreshAllButton.textContent = 'Refresh All';
            }, 2000);
        });
    });

    clearHistoryButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all recent activity?')) {
            chrome.storage.local.set({ actionHistory: [] }, () => {
                renderActionHistory([]);
            });
        }
    });
});
