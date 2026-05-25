document.addEventListener('DOMContentLoaded', () => {
    const serverStatusContainer = document.getElementById('serverStatusContainer');
    const actionHistoryList = document.getElementById('actionHistoryList');
    const refreshAllButton = document.getElementById('refreshAllButton');
    const clearHistoryButton = document.getElementById('clearHistoryButton');
    const TorrentUI = globalThis.TorrentUI;
    const TorrentList = globalThis.TorrentList;
    let clearHistoryConfirmUntil = 0;
    let clearHistoryResetTimer = null;
    const expandedTorrentPanels = new Set();
    let torrentListMode = 'recent';

    function escapeHtml(unsafe) {
        if (unsafe === null || typeof unsafe === 'undefined') return '';
        const div = document.createElement('div');
        div.textContent = unsafe;
        return div.innerHTML;
    }

    function formatBytes(bytes, decimals = 2) {
        const value = Number(bytes || 0);
        if (!value) return '0 B';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(value) / Math.log(k));
        return `${parseFloat((value / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    function supportsTorrentPanel(server) {
        return server?.status === 'online';
    }

    function loadServerTorrents(serverId, panelEl) {
        if (!TorrentUI || !panelEl) return;
        panelEl.innerHTML = '<p class="text-xs text-gray-500 dark:text-gray-400">Loading torrents…</p>';
        chrome.runtime.sendMessage(
            { action: 'getServerTorrents', serverId, listMode: torrentListMode, limit: 30 },
            (response) => {
                if (chrome.runtime.lastError) {
                    panelEl.innerHTML = `<p class="text-xs text-red-600 dark:text-red-400">${escapeHtml(chrome.runtime.lastError.message)}</p>`;
                    return;
                }
                if (response?.error) {
                    panelEl.innerHTML = `<p class="text-xs text-red-600 dark:text-red-400">${escapeHtml(response.error)}</p>`;
                    return;
                }
                const torrents = response?.torrents || [];
                const summaryEl = panelEl.parentElement?.querySelector('.torrent-list-summary');
                if (summaryEl && response.total != null) {
                    const labels = { recent: 'recently added', active: 'active', all: 'total' };
                    const label = labels[response.listMode] || response.listMode;
                    summaryEl.textContent =
                        torrents.length < response.total
                            ? `Showing ${torrents.length} of ${response.total} ${label} (newest first).`
                            : `Showing ${torrents.length} ${label} torrent(s), newest first.`;
                    summaryEl.classList.remove('hidden');
                }

                if (!torrents.length) {
                    const emptyByMode = {
                        recent: 'No recently added torrents.',
                        active: 'No active transfers.',
                        all: 'No torrents on this server.',
                    };
                    panelEl.innerHTML = `<p class="text-xs text-gray-500 dark:text-gray-400">${escapeHtml(emptyByMode[torrentListMode] || emptyByMode.recent)}</p>`;
                    return;
                }
                if (!response.supportsActions) {
                    panelEl.innerHTML =
                        '<p class="text-xs text-amber-600 dark:text-amber-300 mb-2">Listing only — pause/resume/delete not supported for this client.</p>' +
                        torrents
                            .map((t) =>
                                TorrentUI.renderTorrentCardHtml(t, {
                                    formatBytes,
                                    escapeHtml,
                                    serverId,
                                })
                            )
                            .join('');
                    panelEl.querySelectorAll('.torrent-action-btn').forEach((btn) => {
                        btn.remove();
                    });
                    return;
                }
                panelEl.innerHTML = torrents
                    .map((t) =>
                        TorrentUI.renderTorrentCardHtml(t, {
                            formatBytes,
                            escapeHtml,
                            serverId,
                        })
                    )
                    .join('');
            }
        );
    }

    function setServerCardExpanded(cardElement, serverId, expanded) {
        cardElement.classList.toggle('server-card--expanded', expanded);
        if (expanded) {
            expandedTorrentPanels.add(serverId);
        } else {
            expandedTorrentPanels.delete(serverId);
        }
    }

    function bindTorrentPanel(serverId, cardElement) {
        const toggleBtn = cardElement.querySelector('.manage-torrents-btn');
        const toolsWrap = cardElement.querySelector('.server-torrent-tools');
        const listPanel = cardElement.querySelector('.server-torrent-panel');
        if (!toggleBtn || !toolsWrap || !listPanel) return;

        if (expandedTorrentPanels.has(serverId)) {
            setServerCardExpanded(cardElement, serverId, true);
        }

        toggleBtn.addEventListener('click', () => {
            const isHidden = toolsWrap.classList.contains('hidden');
            if (isHidden) {
                toolsWrap.classList.remove('hidden');
                toggleBtn.setAttribute('aria-expanded', 'true');
                toggleBtn.textContent = 'Hide torrents';
                setServerCardExpanded(cardElement, serverId, true);
                loadServerTorrents(serverId, listPanel);
            } else {
                toolsWrap.classList.add('hidden');
                toggleBtn.setAttribute('aria-expanded', 'false');
                toggleBtn.textContent = 'Manage torrents';
                setServerCardExpanded(cardElement, serverId, false);
            }
        });

        const refreshBtn = cardElement.querySelector('.refresh-server-torrents-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tools = cardElement.querySelector('.server-torrent-tools');
                const listPanel = cardElement.querySelector('.server-torrent-panel');
                if (tools && !tools.classList.contains('hidden') && listPanel) {
                    loadServerTorrents(serverId, listPanel);
                }
            });
        }

        const modeSelect = cardElement.querySelector('.torrent-list-mode-select');
        if (modeSelect) {
            modeSelect.value = torrentListMode;
            modeSelect.addEventListener('change', (e) => {
                e.stopPropagation();
                torrentListMode = modeSelect.value || 'recent';
                chrome.storage.local.set({ torrentListMode });
                const tools = cardElement.querySelector('.server-torrent-tools');
                const listPanel = cardElement.querySelector('.server-torrent-panel');
                if (tools && !tools.classList.contains('hidden') && listPanel) {
                    loadServerTorrents(serverId, listPanel);
                }
            });
        }
    }

    function buildServerStatusCard(server) {
            const isOnline = server.status === 'online';
            const torrentPanelExpanded = expandedTorrentPanels.has(server.id);
            const cardElement = document.createElement('div');
            cardElement.className = `server-card bg-white dark:bg-gray-800 shadow-lg rounded-lg p-5 md:p-6 border-l-4 min-w-0 w-full ${isOnline ? 'border-green-500' : 'border-red-500'}${torrentPanelExpanded ? ' server-card--expanded' : ''}`;

            const freeSpace = (typeof server.freeSpace === 'number' && server.freeSpace >= 0) ? formatBytes(server.freeSpace) : 'N/A';
            const torrentCountDisplay = (typeof server.torrents === 'number') ? server.torrents : 'N/A';
            const dlSpeed = (typeof server.downloadSpeed === 'number') ? `${formatBytes(server.downloadSpeed)}/s` : 'N/A';
            const ulSpeed = (typeof server.uploadSpeed === 'number') ? `${formatBytes(server.uploadSpeed)}/s` : 'N/A';
            const activeTorrents = TorrentList
                ? TorrentList.applyTorrentListMode(server.activeTorrents || [], 'recent', 5).torrents
                : (Array.isArray(server.activeTorrents) ? server.activeTorrents.slice(0, 5) : []);
            const canManageTorrents = supportsTorrentPanel(server);
            const escapedServerId = escapeHtml(server.id || '');

            const detailsStatus = isOnline ? 'Online' : 'Offline';
            const detailsVersion = server.version ? escapeHtml(server.version.startsWith('v') ? server.version : `v${server.version}`) : 'N/A';
            const detailsActiveCount = Array.isArray(server.activeTorrents) ? server.activeTorrents.length : 0;
            const detailsServerId = escapeHtml(server.id || 'N/A');
            const detailsLastErrorUser = server.lastError?.userMessage ? escapeHtml(server.lastError.userMessage) : '';
            const detailsLastErrorTech = server.lastError?.technicalDetail ? escapeHtml(server.lastError.technicalDetail) : '';
            const detailsLastErrorCode = server.lastError?.errorCode ? escapeHtml(server.lastError.errorCode) : '';
            const detailsLastErrorAt = server.lastError?.at ? escapeHtml(new Date(server.lastError.at).toLocaleString()) : '';

            cardElement.innerHTML = `
                <div class="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white min-w-0 flex-1">${escapeHtml(server.name)}</h3>
                    <span class="shrink-0 px-2 py-1 text-xs font-semibold text-white ${isOnline ? 'bg-green-500' : 'bg-red-500'} rounded-full">${isOnline ? 'Online' : 'Offline'}</span>
                </div>
                <div class="server-stats-grid text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <p class="min-w-0 col-span-full"><strong>Client:</strong> ${escapeHtml(server.clientType || 'N/A')} ${server.version ? `(${escapeHtml(server.version.startsWith('v') ? server.version : 'v' + server.version)})` : ''}${server.clientType === 'qbittorrent' && server.webApiVersion ? ` · Web API ${escapeHtml(server.webApiVersion)}` : ''}</p>
                    <p class="min-w-0 col-span-full"><strong>URL:</strong> <span class="break-all">${escapeHtml(server.url)}</span></p>
                    <p class="min-w-0"><strong>Free space:</strong> ${escapeHtml(freeSpace)}</p>
                    <p class="min-w-0"><strong>Torrents:</strong> ${escapeHtml(torrentCountDisplay)}</p>
                    <p class="min-w-0"><strong>DL:</strong> ${escapeHtml(dlSpeed)}</p>
                    <p class="min-w-0"><strong>UL:</strong> ${escapeHtml(ulSpeed)}</p>
                </div>
                <div class="mt-2 min-w-0">
                    <p class="text-sm text-gray-600 dark:text-gray-400"><strong>Active Progress:</strong></p>
                    ${
                        activeTorrents.length > 0
                            ? activeTorrents.map((torrent) => {
                                const progressPct = Math.round((torrent.progress || 0) * 100);
                                const statusLabel = TorrentUI
                                    ? TorrentUI.humanizeTorrentState(torrent.state, torrent.progress)
                                    : `${progressPct}%`;
                                const badgeClass = TorrentUI
                                    ? TorrentUI.statusBadgeClasses(torrent.state, torrent.progress)
                                    : 'bg-gray-500 text-white';
                                return `
                                  <div class="mt-2">
                                    <div class="flex items-center justify-between gap-1 mb-0.5">
                                      <p class="text-xs text-gray-500 dark:text-gray-300 truncate flex-1" title="${escapeHtml(torrent.name)}">${escapeHtml(torrent.name)}</p>
                                      <span class="shrink-0 px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${badgeClass}">${escapeHtml(statusLabel)}</span>
                                    </div>
                                    <div class="w-full bg-gray-200 dark:bg-gray-600 rounded h-1.5">
                                      <div class="bg-blue-500 h-1.5 rounded" style="width:${progressPct}%"></div>
                                    </div>
                                  </div>
                                `;
                            }).join('')
                            : '<p class="text-xs text-gray-500 dark:text-gray-400">No active transfer details.</p>'
                    }
                </div>
                <div class="mt-4 flex flex-wrap gap-x-4 gap-y-2 items-center border-t border-gray-200 dark:border-gray-600 pt-3">
                    ${
                        canManageTorrents
                            ? `<button type="button" class="manage-torrents-btn text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline" aria-expanded="${torrentPanelExpanded ? 'true' : 'false'}">${torrentPanelExpanded ? 'Hide torrents' : 'Manage torrents'}</button>
                               <button type="button" class="refresh-server-torrents-btn text-sm text-gray-500 dark:text-gray-400 hover:underline">Refresh list</button>`
                            : '<span class="text-xs text-gray-500 dark:text-gray-400">Torrent controls available when server is online.</span>'
                    }
                    <button type="button" class="text-blue-500 hover:underline text-sm show-more-btn ml-auto" aria-expanded="false">Show details</button>
                    <div class="raw-data hidden w-full mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-md" aria-hidden="true">
                        <div class="text-xs text-gray-700 dark:text-gray-200 space-y-1">
                            <p><strong>Status:</strong> ${detailsStatus}</p>
                            <p><strong>Client Version:</strong> ${detailsVersion}</p>
                            <p><strong>Server ID:</strong> <span class="break-all">${detailsServerId}</span></p>
                            <p><strong>Tracked Active Torrents:</strong> ${detailsActiveCount}</p>
                            ${
                                !isOnline && (detailsLastErrorUser || detailsLastErrorTech || detailsLastErrorCode)
                                    ? `
                                      <div class="pt-2 mt-2 border-t border-gray-200 dark:border-gray-600">
                                        <p><strong>Last Error:</strong> <span class="wrap-break-word">${detailsLastErrorUser || 'N/A'}</span></p>
                                        ${detailsLastErrorCode ? `<p><strong>Error Code:</strong> ${detailsLastErrorCode}</p>` : ''}
                                        ${detailsLastErrorAt ? `<p><strong>When:</strong> ${detailsLastErrorAt}</p>` : ''}
                                        ${detailsLastErrorTech ? `<p><strong>Technical:</strong> <span class="break-all">${detailsLastErrorTech}</span></p>` : ''}
                                      </div>
                                    `
                                    : ''
                            }
                        </div>
                    </div>
                </div>
                ${
                    canManageTorrents
                        ? `<div class="server-torrent-tools mt-4 w-full min-w-0 border-t border-gray-200 dark:border-gray-600 pt-4 ${torrentPanelExpanded ? '' : 'hidden'}">
                             <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
                               <p class="text-sm font-medium text-gray-700 dark:text-gray-200">Torrents on this server</p>
                               <div class="flex flex-wrap items-center gap-2">
                                 <label class="text-xs text-gray-600 dark:text-gray-400">Show</label>
                                 <select class="torrent-list-mode-select text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 min-w-[9rem] dark:bg-gray-700 dark:text-white" data-server-id="${escapedServerId}" aria-label="Torrent list filter">
                                   <option value="recent">Recently added</option>
                                   <option value="active">Active now</option>
                                   <option value="all">All</option>
                                 </select>
                               </div>
                             </div>
                             <p class="torrent-list-summary text-xs text-gray-500 dark:text-gray-400 mb-2 hidden"></p>
                             <div class="server-torrent-panel space-y-3" data-server-id="${escapedServerId}" aria-live="polite"></div>
                           </div>`
                        : ''
                }
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">Last checked: ${server.lastChecked ? escapeHtml(new Date(server.lastChecked).toLocaleString()) : 'Never'}</p>
            `;
            if (canManageTorrents) {
                bindTorrentPanel(server.id, cardElement);
                if (torrentPanelExpanded) {
                    const listPanel = cardElement.querySelector('.server-torrent-panel');
                    if (listPanel) loadServerTorrents(server.id, listPanel);
                }
            }
            return cardElement;
    }

    function renderServerStatus(servers) {
        serverStatusContainer.innerHTML = '';
        if (!servers || servers.length === 0) {
            serverStatusContainer.innerHTML = `
                <div class="col-span-full rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-5">
                    <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">No servers configured yet.</p>
                    <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">Open Options, add your first torrent client profile, then return here to monitor status and transfer progress.</p>
                    <a href="../options/options.html" class="inline-block mt-3 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md">Open Options</a>
                </div>
            `;
            return;
        }

        servers.forEach((server) => {
            serverStatusContainer.appendChild(buildServerStatusCard(server));
        });

        document.querySelectorAll('.show-more-btn').forEach((button) => {
            button.addEventListener('click', (e) => {
                const card = e.target.closest('.server-card');
                const rawData = card?.querySelector('.raw-data');
                if (!rawData) return;
                const isHidden = rawData.classList.contains('hidden');
                if (isHidden) {
                    rawData.classList.remove('hidden');
                    e.target.textContent = 'Hide details';
                    e.target.setAttribute('aria-expanded', 'true');
                    rawData.setAttribute('aria-hidden', 'false');
                } else {
                    rawData.classList.add('hidden');
                    e.target.textContent = 'Show details';
                    e.target.setAttribute('aria-expanded', 'false');
                    rawData.setAttribute('aria-hidden', 'true');
                }
            });
        });
    }

    function renderActionHistory(history) {
        actionHistoryList.innerHTML = '';
        if (!history || history.length === 0) {
            actionHistoryList.innerHTML = '<li class="text-gray-500 dark:text-gray-400">No recent activity yet. Actions from popup/context menu will appear here.</li>';
            return;
        }
        const items = history.map((action) => {
            const isError = action.message.toLowerCase().includes('error') || action.message.toLowerCase().includes('failed');
            return `
                <li class="border-b border-gray-200 dark:border-gray-700 pb-3">
                    <p class="text-sm ${isError ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}">${escapeHtml(action.message)}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${escapeHtml(new Date(action.timestamp).toLocaleString())}</p>
                </li>
            `;
        });
        actionHistoryList.innerHTML = items.join('');
    }

    function loadDashboardData() {
        chrome.storage.local.get(['servers', 'actionHistory', 'torrentListMode'], (result) => {
            torrentListMode = result.torrentListMode || 'recent';
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

    serverStatusContainer.addEventListener('click', (event) => {
        const button = event.target.closest('.torrent-action-btn');
        if (!button) return;
        if (button.dataset.action === 'delete' && !confirm('Delete this torrent from the client?')) {
            return;
        }
        const serverId = button.dataset.serverId;
        const hash = TorrentUI.decodeDataAttr(button.dataset.hash);
        chrome.runtime.sendMessage(
            {
                action: 'torrentAction',
                payload: {
                    actionType: button.dataset.action,
                    hash,
                    serverId,
                },
            },
            (response) => {
                if (response?.success) {
                    const panel = button.closest('.server-torrent-panel');
                    if (panel && serverId) {
                        loadServerTorrents(serverId, panel);
                    }
                } else {
                    alert(response?.error || 'Action failed.');
                }
            }
        );
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
        const now = Date.now();
        if (now > clearHistoryConfirmUntil) {
            clearHistoryConfirmUntil = now + 5000;
            clearHistoryButton.textContent = 'Confirm Clear';
            if (clearHistoryResetTimer) {
                clearTimeout(clearHistoryResetTimer);
            }
            clearHistoryResetTimer = setTimeout(() => {
                clearHistoryButton.textContent = 'Clear History';
                clearHistoryConfirmUntil = 0;
            }, 5000);
            return;
        }
        clearHistoryConfirmUntil = 0;
        clearHistoryButton.textContent = 'Clear History';
        if (clearHistoryResetTimer) {
            clearTimeout(clearHistoryResetTimer);
            clearHistoryResetTimer = null;
        }
        chrome.storage.local.set({ actionHistory: [] }, () => {
            renderActionHistory([]);
        });
    });
});
