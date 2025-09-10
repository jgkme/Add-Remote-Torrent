document.addEventListener('DOMContentLoaded', () => {
    const serverStatusContainer = document.getElementById('serverStatusContainer');
    const actionHistoryList = document.getElementById('actionHistoryList');

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
            const card = `
                <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border-l-4 ${isOnline ? 'border-green-500' : 'border-red-500'}">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-lg font-semibold text-gray-800 dark:text-white truncate">${server.name}</h3>
                        <span class="px-2 py-1 text-xs font-semibold text-white ${isOnline ? 'bg-green-500' : 'bg-red-500'} rounded-full">${isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400"><strong>Client:</strong> ${server.clientType || 'N/A'} ${server.version ? `(v${server.version})` : ''}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400"><strong>URL:</strong> <span class="break-all">${server.url}</span></p>
                    ${(typeof server.freeSpace === 'number' && server.freeSpace >= 0) ? `<p class="text-sm text-gray-600 dark:text-gray-400"><strong>Free Space:</strong> ${formatBytes(server.freeSpace)}</p>` : ''}
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">Last checked: ${server.lastChecked ? new Date(server.lastChecked).toLocaleString() : 'Never'}</p>
                </div>
            `;
            serverStatusContainer.innerHTML += card;
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
});
