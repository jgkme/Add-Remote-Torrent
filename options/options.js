import '../css/input.css';
import { debug } from '../debug';
import { generateLocalId } from '../utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { debugEnabled } = await chrome.storage.local.get('bgDebugEnabled');
        debug.setEnabled(debugEnabled);
    } catch (error) {
        debug.setEnabled(true);
    }

    document.getElementById('accordion-1').addEventListener('click', (e) => {
        const index = 1;
        const content = document.getElementById(`content-${index}`);
        const icon = document.getElementById(`icon-${index}`);

        // Toggle the content's max-height for smooth opening and closing
        if (content.style.maxHeight && content.style.maxHeight !== '0px') {
            content.style.maxHeight = '0';
            icon.classList.remove('rotate-180');
        } else {
            content.style.maxHeight = content.scrollHeight + 'px';
            icon.classList.add('rotate-180');
        }
    })

    // Form elements
    const serverFormSection = document.getElementById('serverFormSection');
    const serverFormTitle = document.getElementById('serverFormTitle');
    const serverIdInput = document.getElementById('serverId');
    const serverNameInput = document.getElementById('serverName');
    const clientTypeSelect = document.getElementById('clientType');
    const clientTypeHelpIcon = document.getElementById('client-type-help-icon');
    const serverUrlInput = document.getElementById('qbUrl'); 
    const serverUsernameInput = document.getElementById('qbUsername'); 
    const serverPasswordInput = document.getElementById('qbPassword');
    const useBasicAuthInput = document.getElementById('useBasicAuth');
    const basicAuthGroup = document.getElementById('basicAuthGroup');
    const basicAuthUsernameInput = document.getElementById('basicAuthUsername');
    const basicAuthPasswordInput = document.getElementById('basicAuthPassword');
    const rpcPathGroup = document.getElementById('rpcPathGroup');
    const rpcPathInput = document.getElementById('rpcPath');
    const scgiPathGroup = document.getElementById('scgiPathGroup');
    const scgiPathInput = document.getElementById('scgiPath');
    const qbittorrentSavePathGroup = document.getElementById('qbittorrentSavePathGroup');
    const qbittorrentSavePathInput = document.getElementById('qbittorrentSavePath');
    const qbittorrentAuthModeGroup = document.getElementById('qbittorrentAuthModeGroup');
    const qbittorrentAuthModeSelect = document.getElementById('qbittorrentAuthMode');
    const qbittorrentApiKeyGroup = document.getElementById('qbittorrentApiKeyGroup');
    const qbittorrentApiKeyInput = document.getElementById('qbittorrentApiKey');
    const qbittorrentApiKeyClearInput = document.getElementById('qbittorrentApiKeyClear');
    const qbitRotateApiKeyBtn = document.getElementById('qbitRotateApiKeyBtn');
    const qbitDeleteApiKeyOnServerBtn = document.getElementById('qbitDeleteApiKeyOnServerBtn');
    const qbittorrentToolsGroup = document.getElementById('qbittorrentToolsGroup');
    const syncQbitCategoriesBtn = document.getElementById('syncQbitCategoriesBtn');
    const importQbitCategoriesBtn = document.getElementById('importQbitCategoriesBtn');
    const syncQbitTagsBtn = document.getElementById('syncQbitTagsBtn');
    const syncQbitSavePathBtn = document.getElementById('syncQbitSavePathBtn');
    const syncQbitRssFeedsBtn = document.getElementById('syncQbitRssFeedsBtn');
    const syncQbitRssFromProfileBtn = document.getElementById('syncQbitRssFromProfileBtn');
    const qbitImportPushToServer = document.getElementById('qbitImportPushToServer');
    const qbitCategoriesPaste = document.getElementById('qbitCategoriesPaste');
    const qbitCategoriesFile = document.getElementById('qbitCategoriesFile');
    const refreshQbitSearchPluginsBtn = document.getElementById('refreshQbitSearchPluginsBtn');
    const qbitSearchPluginsList = document.getElementById('qbitSearchPluginsList');
    const qbitSearchHint = document.getElementById('qbitSearchHint');
    const searchApiUrlGroup = document.getElementById('searchApiUrlGroup');
    const searchApiKeyGroup = document.getElementById('searchApiKeyGroup');
    const synologyDownloadStationGroup = document.getElementById('synologyDownloadStationGroup');
    const synologyAuthApiVersionSelect = document.getElementById('synologyAuthApiVersion');
    const synologyTaskApiVersionSelect = document.getElementById('synologyTaskApiVersion');
    const synologyAutoResumeInput = document.getElementById('synologyAutoResume');
    const porlaOptionsGroup = document.getElementById('porlaOptionsGroup');
    const porlaPresetInput = document.getElementById('porlaPreset');
    const floodOptionsGroup = document.getElementById('floodOptionsGroup');
    const floodSequentialDownloadInput = document.getElementById('floodSequentialDownload');
    const transmissionDownloadDirGroup = document.getElementById('transmissionDownloadDirGroup');
    const transmissionDownloadDirInput = document.getElementById('transmissionDownloadDir');
    const transmissionSpeedLimitGroup = document.getElementById('transmissionSpeedLimitGroup');
    const transmissionDownloadSpeedLimitInput = document.getElementById('transmissionDownloadSpeedLimit');
    const transmissionUploadSpeedLimitInput = document.getElementById('transmissionUploadSpeedLimit');
    const transmissionSeedingLimitGroup = document.getElementById('transmissionSeedingLimitGroup');
    const transmissionSeedRatioLimitInput = document.getElementById('transmissionSeedRatioLimit');
    const transmissionSeedIdleLimitInput = document.getElementById('transmissionSeedIdleLimit');
    const transmissionPeerLimitGroup = document.getElementById('transmissionPeerLimitGroup');
    const transmissionPeerLimitInput = document.getElementById('transmissionPeerLimit');
    const transmissionSequentialDownloadGroup = document.getElementById('transmissionSequentialDownloadGroup');
    const transmissionSequentialDownloadInput = document.getElementById('transmissionSequentialDownload');
    const transmissionBandwidthPriorityGroup = document.getElementById('transmissionBandwidthPriorityGroup');
    const transmissionBandwidthPriorityInput = document.getElementById('transmissionBandwidthPriority');
    const delugeSpeedLimitGroup = document.getElementById('delugeSpeedLimitGroup');
    const delugeDownloadSpeedLimitInput = document.getElementById('delugeDownloadSpeedLimit');
    const delugeUploadSpeedLimitInput = document.getElementById('delugeUploadSpeedLimit');
    const delugeConnectionLimitGroup = document.getElementById('delugeConnectionLimitGroup');
    const delugeMaxConnectionsInput = document.getElementById('delugeMaxConnections');
    const delugeMaxUploadSlotsInput = document.getElementById('delugeMaxUploadSlots');
    const delugeSeedingGroup = document.getElementById('delugeSeedingGroup');
    const delugeStopRatioInput = document.getElementById('delugeStopRatio');
    const delugeRemoveAtRatioInput = document.getElementById('delugeRemoveAtRatio');
    const delugeMoveCompletedGroup = document.getElementById('delugeMoveCompletedGroup');
    const delugeMoveCompletedPathInput = document.getElementById('delugeMoveCompletedPath');
    const delugeMiscOptionsGroup = document.getElementById('delugeMiscOptionsGroup');
    const delugeSequentialDownloadInput = document.getElementById('delugeSequentialDownload');
    const delugePrioritizeFirstLastInput = document.getElementById('delugePrioritizeFirstLast');
    const delugePreAllocateInput = document.getElementById('delugePreAllocate');
    const rtorrentPriorityGroup = document.getElementById('rtorrentPriorityGroup');
    const rtorrentPriorityInput = document.getElementById('rtorrentPriority');
    const rtorrentThrottleGroup = document.getElementById('rtorrentThrottleGroup');
    const rtorrentThrottleInput = document.getElementById('rtorrentThrottle');
    const rtorrentPeerSettingsGroup = document.getElementById('rtorrentPeerSettingsGroup');
    const rtorrentPeersMaxInput = document.getElementById('rtorrentPeersMax');
    const rtorrentPeersMinInput = document.getElementById('rtorrentPeersMin');
    const rtorrentUploadsMaxInput = document.getElementById('rtorrentUploadsMax');
    const rtorrentUploadsMinInput = document.getElementById('rtorrentUploadsMin');
    const torrentfluxRelativePathGroup = document.getElementById('torrentfluxRelativePathGroup');
    const torrentfluxRelativePathInput = document.getElementById('torrentfluxRelativePath');
    const ruTorrentPathGroup = document.getElementById('ruTorrentPathGroup');
    const ruTorrentPathInput = document.getElementById('ruTorrentPath');
    const ruTorrentOptions = document.getElementById('ruTorrentOptions');
    const rutorrentdontaddnamepathInput = document.getElementById('rutorrentdontaddnamepath');
    const rutorrentalwaysurlInput = document.getElementById('rutorrentalwaysurl');
    const defaultTagsInput = document.getElementById('defaultTags');
    const defaultCategoryInput = document.getElementById('defaultCategory');
    const categoriesInput = document.getElementById('categories');
    const downloadDirectoriesInput = document.getElementById('downloadDirectories');
    const addPausedInput = document.getElementById('addPaused');
    const forceStartInput = document.getElementById('forceStart');
    const torrentActionsGroup = document.getElementById('torrentActionsGroup');
    const deleteTorrentWithFilesInput = document.getElementById('deleteTorrentWithFiles');
    const CLIENTS_WITH_TORRENT_ACTIONS = new Set(['qbittorrent', 'transmission', 'deluge', 'rtorrent']);
    const labelDirectoryMapInput = document.getElementById('labelDirectoryMap');
    const askForLabelDirOnPageInput = document.getElementById('askForLabelDirOnPage'); 
    const saveServerButton = document.getElementById('saveServerButton');
    const testConnectionButton = document.getElementById('testConnectionButton');
    const cancelEditButton = document.getElementById('cancelEditButton');
    const formStatusMessageDiv = document.getElementById('formStatusMessage');

    // Server list elements
    const serverListSection = document.getElementById('serverListSection');
    const serverListUl = document.getElementById('serverList');
    const showAddServerFormButton = document.getElementById('showAddServerFormButton');
    const importServerProfileFile = document.getElementById('importServerProfileFile');
    const importServerProfileButton = document.getElementById('importServerProfileButton');

    // Global settings elements
    const advancedAddDialogInput = document.getElementById('advancedAddDialogInput');
    const enableUrlBasedServerSelectionToggle = document.getElementById('enableUrlBasedServerSelectionToggle');
    const catchFromPageToggle = document.getElementById('catchFromPageToggle');
    const linksFoundIndicatorToggle = document.getElementById('linksFoundIndicatorToggle');
    const registerDelayInput = document.getElementById('registerDelayInput');
    const enableSoundNotificationsToggle = document.getElementById('enableSoundNotificationsToggle');
    const enableTextNotificationsToggle = document.getElementById('enableTextNotificationsToggle');
    const enableReviewPromptsToggle = document.getElementById('enableReviewPromptsToggle');
    const enableCompletionNotificationsToggle = document.getElementById('enableCompletionNotificationsToggle');
    const forceTorrentDownloadToggle = document.getElementById('forceTorrentDownloadToggle');
    const enableServerSpecificContextMenuToggle = document.getElementById('enableServerSpecificContextMenuToggle'); 
    const showDownloadDirInContextMenuToggle = document.getElementById('showDownloadDirInContextMenuToggle');
    const badgeModeInput = document.getElementById('badgeModeInput');
    const badgeShowServerHealthToggle = document.getElementById('badgeShowServerHealthToggle');
    const autoAddClipboardOnOpenToggle = document.getElementById('autoAddClipboardOnOpenToggle');
    const rssAutoAddEnabledToggle = document.getElementById('rssAutoAddEnabledToggle');
    const rssFeedsInput = document.getElementById('rssFeedsInput');
    const rssFeedsList = document.getElementById('rssFeedsList');
    const rssNewFeedUrl = document.getElementById('rssNewFeedUrl');
    const rssNewFeedPattern = document.getElementById('rssNewFeedPattern');
    const rssNewFeedServerSelect = document.getElementById('rssNewFeedServerSelect');
    const rssFeedServerSelect = rssNewFeedServerSelect;
    const addRssFeedButton = document.getElementById('addRssFeedButton');
    const rssFeedCount = document.getElementById('rssFeedCount');
    const searchProviderInput = document.getElementById('searchProviderInput');
    const searchApiUrlInput = document.getElementById('searchApiUrlInput');
    const searchApiKeyInput = document.getElementById('searchApiKeyInput');
    const testSearchProviderButton = document.getElementById('testSearchProviderButton');
    const testSearchProviderStatus = document.getElementById('testSearchProviderStatus');

    // URL Mapping elements
    const urlMappingSection = document.getElementById('urlMappingSection'); 
    const mappingsListContainer = document.getElementById('mappingsListContainer');
    const urlMappingsListUl = document.getElementById('urlMappingsList');
    const showAddMappingFormButton = document.getElementById('showAddMappingFormButton');
    const mappingFormSection = document.getElementById('mappingFormSection');
    const mappingFormTitle = document.getElementById('mappingFormTitle');
    const mappingIdInput = document.getElementById('mappingId');
    const websitePatternInput = document.getElementById('websitePatternInput');
    const mapToServerSelect = document.getElementById('mapToServerSelect');
    const saveMappingButton = document.getElementById('saveMappingButton');
    const cancelMappingEditButton = document.getElementById('cancelMappingEditButton');
    const mappingFormStatusMessageDiv = document.getElementById('mappingFormStatusMessage');

    // Tracker URL Rule elements
    const trackerUrlRulesSection = document.getElementById('trackerUrlRulesSection');
    const trackerRulesListContainer = document.getElementById('trackerRulesListContainer');
    const trackerUrlRulesListUl = document.getElementById('trackerUrlRulesList');
    const showAddTrackerRuleFormButton = document.getElementById('showAddTrackerRuleFormButton');
    const trackerRuleFormSection = document.getElementById('trackerRuleFormSection');
    const trackerRuleFormTitle = document.getElementById('trackerRuleFormTitle');
    const trackerRuleIdInput = document.getElementById('trackerRuleId');
    const trackerUrlPatternInput = document.getElementById('trackerUrlPatternInput');
    const trackerRuleLabelInput = document.getElementById('trackerRuleLabelInput');
    const trackerRuleDirectoryInput = document.getElementById('trackerRuleDirectoryInput');
    const saveTrackerRuleButton = document.getElementById('saveTrackerRuleButton');
    const cancelTrackerRuleEditButton = document.getElementById('cancelTrackerRuleEditButton');
    const trackerRuleFormStatusMessageDiv = document.getElementById('trackerRuleFormStatusMessage');

    // Link Catching Patterns elements
    const linkCatchingPatternsSection = document.getElementById('linkCatchingPatternsSection');
    const linkCatchingPatternsListContainer = document.getElementById('linkCatchingPatternsListContainer');
    const linkCatchingPatternsListUl = document.getElementById('linkCatchingPatternsList');
    const showAddLinkPatternFormButton = document.getElementById('showAddLinkPatternFormButton');
    const linkPatternFormSection = document.getElementById('linkPatternFormSection');
    const linkPatternFormTitle = document.getElementById('linkPatternFormTitle');
    const linkPatternIdInput = document.getElementById('linkPatternId');
    const linkPatternInput = document.getElementById('linkPatternInput');
    const saveLinkPatternButton = document.getElementById('saveLinkPatternButton');
    const cancelLinkPatternEditButton = document.getElementById('cancelLinkPatternEditButton');
    const linkPatternFormStatusMessageDiv = document.getElementById('linkPatternFormStatusMessage');

    // Backup/Restore elements
    const exportSettingsButton = document.getElementById('exportSettingsButton');
    const importSettingsFile = document.getElementById('importSettingsFile');
    const importSettingsButton = document.getElementById('importSettingsButton');
    const backupStatusMessageDiv = document.getElementById('backupStatusMessage');

    // Specific field groups for dynamic visibility (ensure these are defined if not already)
    const usernameGroup = document.getElementById('usernameGroup');
    const passwordGroup = document.getElementById('passwordGroup');
    const serverUrlLabel = document.querySelector('label[for="qbUrl"]'); // qbUrl is the ID of serverUrlInput

    // Debug & Log elements
    const contentDebugEnabled_log = document.getElementById('contentDebugEnabled_log');
    const contentDebugEnabled_warn = document.getElementById('contentDebugEnabled_warn');
    const contentDebugEnabled_error = document.getElementById('contentDebugEnabled_error');
    const contentDebugEnabled_default = document.getElementById('contentDebugEnabled_default');
    const bgDebugEnabled_log = document.getElementById('bgDebugEnabled_log');
    const bgDebugEnabled_warn = document.getElementById('bgDebugEnabled_warn');
    const bgDebugEnabled_error = document.getElementById('bgDebugEnabled_error');
    const bgDebugEnabled_default = document.getElementById('bgDebugEnabled_default');

    // Footer elements
    const extensionVersionSpan = document.getElementById('extensionVersion');
    const developerLink = document.getElementById('developerLink');

    let servers = [];
    let activeServerId = null;
    let lastConnectionTestFailed = false;
    let globalSettings = {
        advancedAddDialog: 'never',
        enableUrlBasedServerSelection: false,
        catchfrompage: false,
        linksfoundindicator: false,
        registerDelay: 0,
        enableSoundNotifications: false,
        enableTextNotifications: false,
        enableReviewPrompts: true,
        enableCompletionNotifications: true, // Default to true
        forceTorrentDownload: false,
        enableServerSpecificContextMenu: false,
        showDownloadDirInContextMenu: false,
        badgeMode: 'links',
        badgeShowServerHealth: true,
        autoAddClipboardOnOpen: false,
        rssAutoAddEnabled: false,
        rssFeeds: [],
        searchProvider: 'none',
        searchApiUrl: '',
        searchApiKey: '',
        qbitSearchPlugins: 'enabled',
        qbitSearchCategory: 'all',
        contentDebugEnabled: ['error'], // Default error logging enabled in content scripts
        bgDebugEnabled: ['log', 'warn', 'error'] // Default to all enabled in background
    };
    let urlToServerMappings = [];
    let trackerUrlRules = [];
    let linkCatchingPatterns = [];

    // --- Utility Functions ---
    const generateId = (prefix = 'server') => generateLocalId(prefix);

    function parseCredentialsFromUrl(urlString) {
        try {
            const url = new URL(urlString);
            if (url.username && url.password) {
                return {
                    username: decodeURIComponent(url.username),
                    password: decodeURIComponent(url.password),
                    cleanUrl: `${url.protocol}//${url.host}${url.pathname}${url.search}${url.hash}`
                };
            }
        } catch (e) {
            // Invalid URL, return original
        }
        return { cleanUrl: urlString };
    }

    function escapeHtml(unsafe) {
        if (unsafe === null || typeof unsafe === 'undefined') return '';
        const div = document.createElement('div');
        div.textContent = String(unsafe);
        return div.innerHTML;
    }

    function encodeDataAttr(value) {
        return encodeURIComponent(String(value ?? ''));
    }

    function decodeDataAttr(value) {
        try {
            return decodeURIComponent(String(value ?? ''));
        } catch {
            return String(value ?? '');
        }
    }

    function resetRssNewFeedForm() {
        if (rssNewFeedUrl) rssNewFeedUrl.value = '';
        if (rssNewFeedPattern) rssNewFeedPattern.value = '';
        if (rssNewFeedServerSelect) rssNewFeedServerSelect.value = '';
    }

    function highlightRssSaveFeedback(element) {
        const target = element || addRssFeedButton;
        if (!target) return;
        target.classList.add('ring-2', 'ring-green-400', 'dark:ring-green-500');
        setTimeout(() => {
            target.classList.remove('ring-2', 'ring-green-400', 'dark:ring-green-500');
        }, 850);
    }

    function rssFeedDisplayTitle(feed) {
        if (feed?.qbitItemPath) {
            return String(feed.qbitItemPath).replace(/\\/g, ' › ');
        }
        if (feed?.url) {
            try {
                return new URL(feed.url).hostname;
            } catch {
                /* fall through */
            }
        }
        return 'RSS feed';
    }

    function validateRssFeedFields(url, pattern) {
        if (!url) return 'Feed URL is required.';
        try {
            new URL(url);
        } catch {
            return 'RSS feed URL is invalid.';
        }
        if (pattern) {
            try {
                // eslint-disable-next-line no-new
                new RegExp(pattern, 'i');
            } catch {
                return 'Filter regex is invalid.';
            }
        }
        return null;
    }

    function readRssFieldsFromCard(card) {
        return {
            url: card.querySelector('.rss-feed-field-url')?.value.trim() || '',
            pattern: card.querySelector('.rss-feed-field-pattern')?.value.trim() || '',
            serverId: card.querySelector('.rss-feed-field-server')?.value.trim() || '',
        };
    }

    function buildRssServerSelect(selectedServerId) {
        const select = document.createElement('select');
        select.className =
            'rss-feed-field-server rss-feed-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white text-sm';
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = 'Use active server';
        select.appendChild(defaultOpt);
        servers.forEach((server) => {
            const opt = document.createElement('option');
            opt.value = server.id;
            opt.textContent = server.name;
            if (server.id === selectedServerId) opt.selected = true;
            select.appendChild(opt);
        });
        return select;
    }

    function persistRssFeeds(successMessage) {
        chrome.storage.local.set({ rssFeeds: globalSettings.rssFeeds }, () => {
            renderRssFeedsList();
            populateRssFeedServerSelect();
            if (successMessage) displayFormStatus(successMessage, 'success');
        });
    }

    function saveRssFeedFromCard(card, feedId) {
        const fields = readRssFieldsFromCard(card);
        const validationError = validateRssFeedFields(fields.url, fields.pattern);
        if (validationError) {
            displayFormStatus(validationError, 'error');
            return;
        }
        const feeds = globalSettings.rssFeeds || [];
        const index = feeds.findIndex((f) => f.id === feedId);
        if (index < 0) return;
        const existing = feeds[index];
        feeds[index] = {
            ...existing,
            url: fields.url,
            pattern: fields.pattern,
            serverId: fields.serverId || undefined,
        };
        globalSettings.rssFeeds = feeds;
        card.classList.remove('ring-2', 'ring-amber-400', 'dark:ring-amber-500');
        persistRssFeeds('RSS feed saved.');
        highlightRssSaveFeedback(card.querySelector('.rss-feed-save'));
    }

    function createRssFeedCardElement(feed) {
        const serverName = feed.serverId
            ? servers.find((s) => s.id === feed.serverId)?.name || 'Unknown server'
            : 'Active server';
        const article = document.createElement('article');
        article.className =
            'rss-feed-card rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/80 p-3 shadow-sm';
        article.dataset.feedId = feed.id;
        article.setAttribute('role', 'listitem');

        const header = document.createElement('div');
        header.className = 'flex flex-wrap items-start justify-between gap-2 mb-3';
        const titleWrap = document.createElement('div');
        titleWrap.className = 'min-w-0 flex-1';
        const title = document.createElement('h4');
        title.className = 'text-sm font-semibold text-gray-900 dark:text-gray-100 truncate';
        title.textContent = rssFeedDisplayTitle(feed);
        title.title = rssFeedDisplayTitle(feed);
        titleWrap.appendChild(title);
        if (feed.qbitItemPath && feed.url) {
            const subtitle = document.createElement('p');
            subtitle.className = 'mt-0.5 text-[11px] text-gray-500 dark:text-gray-400 truncate';
            try {
                subtitle.textContent = new URL(feed.url).hostname;
            } catch {
                subtitle.textContent = feed.url.slice(0, 64);
            }
            titleWrap.appendChild(subtitle);
        }
        header.appendChild(titleWrap);

        const badges = document.createElement('div');
        badges.className = 'flex flex-wrap gap-1 shrink-0';
        if (feed.qbitSourceServerId || feed.qbitItemPath) {
            const qbitBadge = document.createElement('span');
            qbitBadge.className =
                'inline-flex items-center rounded-full bg-teal-100 dark:bg-teal-900/40 px-2 py-0.5 text-[10px] font-medium text-teal-800 dark:text-teal-200';
            qbitBadge.textContent = 'qBittorrent';
            qbitBadge.title = feed.qbitItemPath || 'Imported from qBittorrent';
            badges.appendChild(qbitBadge);
        }
        const serverBadge = document.createElement('span');
        serverBadge.className =
            'inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 text-[10px] font-medium text-indigo-800 dark:text-indigo-200';
        serverBadge.textContent = serverName;
        badges.appendChild(serverBadge);
        header.appendChild(badges);
        article.appendChild(header);

        const fields = document.createElement('div');
        fields.className = 'space-y-2.5';

        const urlGroup = document.createElement('div');
        urlGroup.className = 'space-y-1';
        const urlLabel = document.createElement('label');
        urlLabel.className = 'block text-xs font-medium text-gray-700 dark:text-gray-300';
        urlLabel.textContent = 'Feed URL';
        const urlInput = document.createElement('input');
        urlInput.type = 'url';
        urlInput.inputMode = 'url';
        urlInput.autocomplete = 'off';
        urlInput.className =
            'rss-feed-field-url rss-feed-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white text-sm';
        urlInput.value = feed.url || '';
        urlGroup.appendChild(urlLabel);
        urlGroup.appendChild(urlInput);
        fields.appendChild(urlGroup);

        const patternGroup = document.createElement('div');
        patternGroup.className = 'space-y-1';
        const patternLabel = document.createElement('label');
        patternLabel.className = 'block text-xs font-medium text-gray-700 dark:text-gray-300';
        patternLabel.innerHTML =
            'Filter <span class="font-normal text-gray-500 dark:text-gray-400">(regex, optional)</span>';
        const patternInput = document.createElement('input');
        patternInput.type = 'text';
        patternInput.autocomplete = 'off';
        patternInput.placeholder = 'e.g. 1080p|2160p';
        patternInput.className =
            'rss-feed-field-pattern rss-feed-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white text-sm font-mono text-xs';
        patternInput.value = feed.pattern || '';
        patternGroup.appendChild(patternLabel);
        patternGroup.appendChild(patternInput);
        fields.appendChild(patternGroup);

        const serverGroup = document.createElement('div');
        serverGroup.className = 'space-y-1';
        const serverLabel = document.createElement('label');
        serverLabel.className = 'block text-xs font-medium text-gray-700 dark:text-gray-300';
        serverLabel.textContent = 'Target server';
        serverGroup.appendChild(serverLabel);
        serverGroup.appendChild(buildRssServerSelect(feed.serverId || ''));
        fields.appendChild(serverGroup);

        article.appendChild(fields);

        const actions = document.createElement('div');
        actions.className = 'mt-3 flex flex-wrap gap-2';
        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className =
            'rss-feed-save px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md';
        saveBtn.textContent = 'Save';
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className =
            'rss-feed-delete px-3 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-md';
        deleteBtn.textContent = 'Remove';
        const revertBtn = document.createElement('button');
        revertBtn.type = 'button';
        revertBtn.className =
            'rss-feed-revert px-3 py-1.5 text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-100 rounded-md';
        revertBtn.textContent = 'Revert';
        actions.appendChild(saveBtn);
        actions.appendChild(revertBtn);
        actions.appendChild(deleteBtn);
        article.appendChild(actions);

        const markDirty = () => {
            article.classList.add('ring-2', 'ring-amber-400', 'dark:ring-amber-500');
        };
        urlInput.addEventListener('input', markDirty);
        patternInput.addEventListener('input', markDirty);
        article.querySelector('.rss-feed-field-server')?.addEventListener('change', markDirty);

        return article;
    }

    function displayFormStatus(message, type) {
        formStatusMessageDiv.textContent = message;
        formStatusMessageDiv.className = 'mt-4 text-sm p-3 rounded-md border'; 
        if (type === 'success') {
            formStatusMessageDiv.classList.add('bg-green-100', 'dark:bg-green-800', 'border-green-500', 'dark:border-green-600', 'text-green-700', 'dark:text-green-200');
            // Success messages disappear after 3 seconds
            setTimeout(() => {
                formStatusMessageDiv.textContent = '';
                formStatusMessageDiv.className = 'mt-4 text-sm'; 
            }, 3000);
        } else if (type === 'error') {
            formStatusMessageDiv.classList.add('bg-red-100', 'dark:bg-red-800', 'border-red-500', 'dark:border-red-600', 'text-red-700', 'dark:text-red-200');
            // Error messages persist until the next action
        } else { 
            formStatusMessageDiv.classList.add('bg-blue-100', 'dark:bg-blue-800', 'border-blue-500', 'dark:border-blue-600', 'text-blue-700', 'dark:text-blue-200');
        }
        
        if (!message) {
             formStatusMessageDiv.className = 'mt-4 text-sm'; 
        }
    }
    
    function displayMappingFormStatus(message, type) {
        mappingFormStatusMessageDiv.textContent = message;
        mappingFormStatusMessageDiv.className = 'mt-3 text-sm p-3 rounded-md border'; 
        if (type === 'success') {
            mappingFormStatusMessageDiv.classList.add('bg-green-100', 'dark:bg-green-800', 'border-green-500', 'dark:border-green-600', 'text-green-700', 'dark:text-green-200');
        } else if (type === 'error') {
            mappingFormStatusMessageDiv.classList.add('bg-red-100', 'dark:bg-red-800', 'border-red-500', 'dark:border-red-600', 'text-red-700', 'dark:text-red-200');
        } else {
            mappingFormStatusMessageDiv.classList.add('bg-blue-100', 'dark:bg-blue-800', 'border-blue-500', 'dark:border-blue-600', 'text-blue-700', 'dark:text-blue-200');
        }
        if (message && (type === 'success' || type === 'error')) {
            setTimeout(() => {
                mappingFormStatusMessageDiv.textContent = '';
                mappingFormStatusMessageDiv.className = 'mt-3 text-sm';
            }, 5000);
        } else if (!message) {
            mappingFormStatusMessageDiv.className = 'mt-3 text-sm';
        }
    }

    function displayTrackerRuleFormStatus(message, type) {
        trackerRuleFormStatusMessageDiv.textContent = message;
        trackerRuleFormStatusMessageDiv.className = 'mt-3 text-sm p-3 rounded-md border'; 
        if (type === 'success') {
            trackerRuleFormStatusMessageDiv.classList.add('bg-green-100', 'dark:bg-green-800', 'border-green-500', 'dark:border-green-600', 'text-green-700', 'dark:text-green-200');
        } else if (type === 'error') {
            trackerRuleFormStatusMessageDiv.classList.add('bg-red-100', 'dark:bg-red-800', 'border-red-500', 'dark:border-red-600', 'text-red-700', 'dark:text-red-200');
        } else {
            trackerRuleFormStatusMessageDiv.classList.add('bg-blue-100', 'dark:bg-blue-800', 'border-blue-500', 'dark:border-blue-600', 'text-blue-700', 'dark:text-blue-200');
        }
        if (message && (type === 'success' || type === 'error')) {
            setTimeout(() => {
                trackerRuleFormStatusMessageDiv.textContent = '';
                trackerRuleFormStatusMessageDiv.className = 'mt-3 text-sm';
            }, 5000);
        } else if (!message) {
            trackerRuleFormStatusMessageDiv.className = 'mt-3 text-sm';
        }
    }

    function displayBackupStatus(message, type) {
        backupStatusMessageDiv.textContent = message;
        backupStatusMessageDiv.className = 'mt-4 text-sm p-3 rounded-md border'; 
        if (type === 'success') {
            backupStatusMessageDiv.classList.add('bg-green-100', 'dark:bg-green-800', 'border-green-500', 'dark:border-green-600', 'text-green-700', 'dark:text-green-200');
        } else if (type === 'error') {
            backupStatusMessageDiv.classList.add('bg-red-100', 'dark:bg-red-800', 'border-red-500', 'dark:border-red-600', 'text-red-700', 'dark:text-red-200');
        } else {
            backupStatusMessageDiv.classList.add('bg-blue-100', 'dark:bg-blue-800', 'border-blue-500', 'dark:border-blue-600', 'text-blue-700', 'dark:text-blue-200');
        }
        if (message && (type === 'success' || type === 'error')) {
            setTimeout(() => {
                backupStatusMessageDiv.textContent = '';
                backupStatusMessageDiv.className = 'mt-4 text-sm';
            }, 5000);
        } else if (!message) {
            backupStatusMessageDiv.className = 'mt-4 text-sm';
        }
    }

    const clientHints = {
        qbittorrent: 'For versions 4.3.0+, you may need to disable "CSRF Protection" in the Web UI. qBittorrent 5.2+ uses Web API 2.14+ (legacy and JSON add responses). Auth: cookie login (default), Web API Basic (2.15+), or optional API key (Bearer). Test connection stores Web API version for fetchMetadata file lists, free-space hints, and global speed limits (2.16+).',
        transmission: 'The default RPC path is usually <strong>/transmission/rpc</strong>. Ensure your server\'s URL is correct (e.g., http://localhost:9091).',
        deluge: 'The password for the Deluge WebUI is often separate from the daemon password and is managed in the WebUI plugin settings. It may be blank by default.',
        utorrent: 'This handler is for modern uTorrent WebUI versions. Ensure the "Relative Path" is correct (e.g., /gui/). The extension will try to auto-detect this.',
        utorrent_old: 'Use this for very old versions of uTorrent (e.g., v2.0.4) that do not use a CSRF token for authentication.',
        rtorrent: 'This requires a web server with an XML-RPC endpoint configured (like ruTorrent). For direct connection, provide the full SCGI/HTTPRPC URL.',
        rutorrent: 'Enter the full URL to your ruTorrent dashboard (e.g., https://server.com/rutorrent). The relative path for plugins is usually not needed.',
        synology_download_station: 'Use your Synology NAS login credentials. SID-only auth (legacy-safe). Adjust API versions only if Test connection reports mismatches. Optional experimental auto-resume after add.',
        qnap_download_station: 'Use your QNAP NAS login credentials. Ensure the Download Station application is installed and running.',
        kodi_elementum: 'No username or password is required. The default URL is typically http://localhost:65220.',
        flood: 'Flood is a modern WebUI for rTorrent. Use your Flood login credentials.',
        vuze_xmwebui: 'This requires the "Vuze Web Remote" plugin (xmwebui) to be installed in Vuze. It uses a Transmission-compatible API.',
        default: 'No specific hints for this client. Ensure URL, username, and password are correct.'
    };

    function toggleClientSpecificFields(clientType) {
        const clientHintDiv = document.getElementById('clientSpecificHint');
        const hintText = Object.prototype.hasOwnProperty.call(clientHints, clientType)
            ? clientHints[clientType]
            : clientHints.default;
        // Static hint copy only (not user/network input).
        clientHintDiv.innerHTML = hintText;
        clientHintDiv.style.display = 'none'; // Always hide hint on change, user must click icon to see it.

        // Ensure elements exist before trying to set style or textContent
        const rpcPathGrp = document.getElementById('rpcPathGroup');
        const scgiPathGrp = document.getElementById('scgiPathGroup');
        const userGroup = document.getElementById('usernameGroup');
        const passGroup = document.getElementById('passwordGroup');
        const urlLabel = document.querySelector('label[for="qbUrl"]');
        const userInput = document.getElementById('qbUsername'); // Assuming this is serverUsernameInput
        const userLabel = document.querySelector('label[for="qbUsername"]');

        // Default visibility and labels
        if(rpcPathGrp) rpcPathGrp.style.display = 'none';
        if(scgiPathGrp) scgiPathGrp.style.display = 'none';
        if(qbittorrentSavePathGroup) qbittorrentSavePathGroup.style.display = 'none';
        if(qbittorrentAuthModeGroup) qbittorrentAuthModeGroup.style.display = 'none';
        if(qbittorrentApiKeyGroup) qbittorrentApiKeyGroup.style.display = 'none';
        if(qbittorrentToolsGroup) qbittorrentToolsGroup.style.display = 'none';
        if(synologyDownloadStationGroup) synologyDownloadStationGroup.style.display = 'none';
        if(porlaOptionsGroup) porlaOptionsGroup.style.display = 'none';
        if(floodOptionsGroup) floodOptionsGroup.style.display = 'none';
        if(transmissionDownloadDirGroup) transmissionDownloadDirGroup.style.display = 'none';
        if(transmissionSpeedLimitGroup) transmissionSpeedLimitGroup.style.display = 'none';
        if(transmissionSeedingLimitGroup) transmissionSeedingLimitGroup.style.display = 'none';
        if(transmissionPeerLimitGroup) transmissionPeerLimitGroup.style.display = 'none';
        if(transmissionSequentialDownloadGroup) transmissionSequentialDownloadGroup.style.display = 'none';
        if(transmissionBandwidthPriorityGroup) transmissionBandwidthPriorityGroup.style.display = 'none';
        if(delugeSpeedLimitGroup) delugeSpeedLimitGroup.style.display = 'none';
        if(delugeConnectionLimitGroup) delugeConnectionLimitGroup.style.display = 'none';
        if(delugeSeedingGroup) delugeSeedingGroup.style.display = 'none';
        if(delugeMoveCompletedGroup) delugeMoveCompletedGroup.style.display = 'none';
        if(delugeMiscOptionsGroup) delugeMiscOptionsGroup.style.display = 'none';
        if(rtorrentPriorityGroup) rtorrentPriorityGroup.style.display = 'none';
        if(rtorrentThrottleGroup) rtorrentThrottleGroup.style.display = 'none';
        if(rtorrentPeerSettingsGroup) rtorrentPeerSettingsGroup.style.display = 'none';
        if(torrentfluxRelativePathGroup) torrentfluxRelativePathGroup.style.display = 'none';
        if(ruTorrentPathGroup) ruTorrentPathGroup.style.display = 'none';
        if(document.getElementById('utorrentRelativePathGroup')) document.getElementById('utorrentRelativePathGroup').style.display = 'none';
        if(ruTorrentOptions) ruTorrentOptions.style.display = 'none';
        if(torrentActionsGroup) {
            torrentActionsGroup.style.display = CLIENTS_WITH_TORRENT_ACTIONS.has(clientType) ? 'flex' : 'none';
        }
        if(userGroup) userGroup.style.display = 'block'; 
        if(passGroup) passGroup.style.display = 'block'; 
        
        serverUrlInput.placeholder = 'http://localhost:8080';
        if (urlLabel) urlLabel.textContent = 'Server URL:';
        
        if (userLabel) userLabel.textContent = 'Username:';
        if (userInput) userInput.placeholder = ''; // Reset placeholder

        switch (clientType) {
            case 'qbittorrent':
                if(qbittorrentSavePathGroup) qbittorrentSavePathGroup.style.display = 'block';
                if(qbittorrentAuthModeGroup) qbittorrentAuthModeGroup.style.display = 'block';
                if(qbittorrentApiKeyGroup) qbittorrentApiKeyGroup.style.display = 'block';
                if(qbittorrentToolsGroup) qbittorrentToolsGroup.style.display = 'block';
                break;
            case 'transmission':
                if(rpcPathGrp) rpcPathGrp.style.display = 'block';
                if(transmissionDownloadDirGroup) transmissionDownloadDirGroup.style.display = 'block';
                if(transmissionSpeedLimitGroup) transmissionSpeedLimitGroup.style.display = 'block';
                if(transmissionSeedingLimitGroup) transmissionSeedingLimitGroup.style.display = 'block';
                if(transmissionPeerLimitGroup) transmissionPeerLimitGroup.style.display = 'block';
                if(transmissionSequentialDownloadGroup) transmissionSequentialDownloadGroup.style.display = 'block';
                if(transmissionBandwidthPriorityGroup) transmissionBandwidthPriorityGroup.style.display = 'block';
                serverUrlInput.placeholder = 'http://localhost:9091';
                if (urlLabel) urlLabel.textContent = 'Server URL (e.g., http://localhost:9091):';
                break;
            case 'rtorrent':
                if(scgiPathGrp) scgiPathGrp.style.display = 'block';
                if(rtorrentPriorityGroup) rtorrentPriorityGroup.style.display = 'block';
                if(rtorrentThrottleGroup) rtorrentThrottleGroup.style.display = 'block';
                if(rtorrentPeerSettingsGroup) rtorrentPeerSettingsGroup.style.display = 'block';
                if (urlLabel) urlLabel.textContent = 'rTorrent Web UI URL (e.g., ruTorrent, optional if SCGI direct):';
                serverUrlInput.placeholder = 'http://localhost/rutorrent';
                break;
            case 'rutorrent':
                if(ruTorrentPathGroup) ruTorrentPathGroup.style.display = 'block';
                if(ruTorrentOptions) ruTorrentOptions.style.display = 'block';
                if (urlLabel) urlLabel.textContent = 'ruTorrent URL:';
                serverUrlInput.placeholder = 'http://localhost/rutorrent';
                break;
            case 'utorrent_old':
                break;
            case 'torrentflux':
                if(torrentfluxRelativePathGroup) torrentfluxRelativePathGroup.style.display = 'block';
                break;
            case 'deluge':
                if (userLabel) userLabel.textContent = 'Username (optional for WebUI):';
                if (userInput) userInput.placeholder = '(Usually not needed for WebUI)';
                serverUrlInput.placeholder = 'http://localhost:8112';
                if(delugeSpeedLimitGroup) delugeSpeedLimitGroup.style.display = 'block';
                if(delugeConnectionLimitGroup) delugeConnectionLimitGroup.style.display = 'block';
                if(delugeSeedingGroup) delugeSeedingGroup.style.display = 'block';
                if(delugeMoveCompletedGroup) delugeMoveCompletedGroup.style.display = 'block';
                if(delugeMiscOptionsGroup) delugeMiscOptionsGroup.style.display = 'block';
                break;
            case 'utorrent':
            case 'bittorrent':
                if(document.getElementById('utorrentRelativePathGroup')) document.getElementById('utorrentRelativePathGroup').style.display = 'block';
                serverUrlInput.placeholder = 'http://localhost:8080';
                break;
            case 'kodi_elementum':
                if (userGroup) userGroup.style.display = 'none';
                if (passGroup) passGroup.style.display = 'none';
                serverUrlInput.placeholder = 'http://localhost:65220';
                break;
            case 'synology_download_station':
                if (synologyDownloadStationGroup) synologyDownloadStationGroup.style.display = 'block';
                serverUrlInput.placeholder = 'http://<NAS_IP_OR_HOSTNAME>:<PORT>';
                break;
            case 'qnap_download_station':
                serverUrlInput.placeholder = 'http://<NAS_IP_OR_HOSTNAME>:<PORT>';
                break;
            case 'hadouken':
                serverUrlInput.placeholder = 'http://localhost:7070';
                break;
            case 'tixati':
                serverUrlInput.placeholder = 'http://localhost:8080';
                break;
            case 'flood':
                if (floodOptionsGroup) floodOptionsGroup.style.display = 'block';
                serverUrlInput.placeholder = 'http://localhost:3000';
                break;
            case 'vuze':
                serverUrlInput.placeholder = 'http://localhost:9091';
                break;
            case 'porla':
                if (porlaOptionsGroup) porlaOptionsGroup.style.display = 'block';
                serverUrlInput.placeholder = 'http://localhost:1337';
                break;
            default:
                // Defaults are already set above
                break;
        }
    }

    function showServerForm(isEditing = false, server = null) {
        lastConnectionTestFailed = false; // Reset on showing form
        serverListSection.style.display = 'none';
        serverFormSection.style.display = 'block';
        serverFormTitle.textContent = isEditing ? 'Edit Server Profile' : 'Add New Server Profile';
        let currentClientType = 'qbittorrent';
        if (isEditing && server) {
            serverIdInput.value = server.id;
            serverNameInput.value = server.name;
            clientTypeSelect.value = server.clientType || 'qbittorrent';
            currentClientType = clientTypeSelect.value;
            serverUrlInput.value = server.url;
            serverUsernameInput.value = server.username;
            serverPasswordInput.value = server.password;
            useBasicAuthInput.checked = server.useBasicAuth || false;
            basicAuthUsernameInput.value = server.basicAuthUsername || '';
            basicAuthPasswordInput.value = server.basicAuthPassword || '';
            rpcPathInput.value = server.rpcPath || '';
            scgiPathInput.value = server.scgiPath || '';
            qbittorrentSavePathInput.value = server.qbittorrentSavePath || '';
            if (qbittorrentAuthModeSelect) {
                qbittorrentAuthModeSelect.value =
                    server.qbittorrentAuthMode === 'basic' ? 'basic' : 'cookie';
            }
            if (qbittorrentApiKeyInput) qbittorrentApiKeyInput.value = '';
            if (qbittorrentApiKeyClearInput) qbittorrentApiKeyClearInput.checked = false;
            transmissionDownloadDirInput.value = server.transmissionDownloadDir || '';
            transmissionDownloadSpeedLimitInput.value = server.transmissionDownloadSpeedLimit || '';
            transmissionUploadSpeedLimitInput.value = server.transmissionUploadSpeedLimit || '';
            transmissionSeedRatioLimitInput.value = server.transmissionSeedRatioLimit || '';
            transmissionSeedIdleLimitInput.value = server.transmissionSeedIdleLimit || '';
            transmissionPeerLimitInput.value = server.transmissionPeerLimit || '';
            transmissionSequentialDownloadInput.checked = server.transmissionSequentialDownload || false;
            transmissionBandwidthPriorityInput.value = server.transmissionBandwidthPriority || 0;
            delugeDownloadSpeedLimitInput.value = server.delugeDownloadSpeedLimit || '';
            delugeUploadSpeedLimitInput.value = server.delugeUploadSpeedLimit || '';
            delugeMaxConnectionsInput.value = server.delugeMaxConnections || '';
            delugeMaxUploadSlotsInput.value = server.delugeMaxUploadSlots || '';
            delugeStopRatioInput.value = server.delugeStopRatio || '';
            delugeRemoveAtRatioInput.checked = server.delugeRemoveAtRatio || false;
            delugeMoveCompletedPathInput.value = server.delugeMoveCompletedPath || '';
            delugeSequentialDownloadInput.checked = server.delugeSequentialDownload || false;
            delugePrioritizeFirstLastInput.checked = server.delugePrioritizeFirstLast || false;
            delugePreAllocateInput.checked = server.delugePreAllocate || false;
            rtorrentPriorityInput.value = server.rtorrentPriority || 2;
            rtorrentThrottleInput.value = server.rtorrentThrottle || '';
            rtorrentPeersMaxInput.value = server.rtorrentPeersMax || '';
            rtorrentPeersMinInput.value = server.rtorrentPeersMin || '';
            rtorrentUploadsMaxInput.value = server.rtorrentUploadsMax || '';
            rtorrentUploadsMinInput.value = server.rtorrentUploadsMin || '';
            torrentfluxRelativePathInput.value = server.torrentfluxRelativePath || '';
            ruTorrentPathInput.value = server.ruTorrentrelativepath || '';
            if(document.getElementById('utorrentRelativePath')) document.getElementById('utorrentRelativePath').value = server.utorrentrelativepath || '';
            rutorrentdontaddnamepathInput.checked = server.rutorrentdontaddnamepath || false;
            rutorrentalwaysurlInput.checked = server.rutorrentalwaysurl || false;
            if (synologyAuthApiVersionSelect) {
                synologyAuthApiVersionSelect.value = server.authApiVersion || '6';
            }
            if (synologyTaskApiVersionSelect) {
                synologyTaskApiVersionSelect.value = server.taskApiVersion || '3';
            }
            if (synologyAutoResumeInput) {
                synologyAutoResumeInput.checked = !!server.synologyAutoResume;
            }
            if (porlaPresetInput) porlaPresetInput.value = server.porlaPreset || '';
            if (floodSequentialDownloadInput) {
                floodSequentialDownloadInput.checked = !!server.floodSequentialDownload;
            }
            defaultTagsInput.value = server.tags || '';
            defaultCategoryInput.value = server.category || '';
            categoriesInput.value = server.categories || '';
            downloadDirectoriesInput.value = server.downloadDirectories || '';
            addPausedInput.checked = server.addPaused || false;
            forceStartInput.checked = server.forceStart || false;
            if (deleteTorrentWithFilesInput) {
                deleteTorrentWithFilesInput.checked = !!server.deleteTorrentWithFiles;
            }
            labelDirectoryMapInput.value = server.labelDirectoryMap || '';
            askForLabelDirOnPageInput.checked = server.askForLabelDirOnPage || false;
        } else {
            serverIdInput.value = '';
            serverNameInput.value = '';
            clientTypeSelect.value = 'qbittorrent';
            currentClientType = clientTypeSelect.value;
            serverUrlInput.value = '';
            serverUsernameInput.value = '';
            serverPasswordInput.value = '';
            useBasicAuthInput.checked = false;
            basicAuthUsernameInput.value = '';
            basicAuthPasswordInput.value = '';
            rpcPathInput.value = '';
            scgiPathInput.value = '';
            qbittorrentSavePathInput.value = '';
            if (qbittorrentApiKeyInput) qbittorrentApiKeyInput.value = '';
            if (qbittorrentApiKeyClearInput) qbittorrentApiKeyClearInput.checked = false;
            transmissionDownloadDirInput.value = '';
            transmissionDownloadSpeedLimitInput.value = '';
            transmissionUploadSpeedLimitInput.value = '';
            transmissionSeedRatioLimitInput.value = '';
            transmissionSeedIdleLimitInput.value = '';
            transmissionPeerLimitInput.value = '';
            transmissionSequentialDownloadInput.checked = false;
            transmissionBandwidthPriorityInput.value = 0;
            delugeDownloadSpeedLimitInput.value = '';
            delugeUploadSpeedLimitInput.value = '';
            delugeMaxConnectionsInput.value = '';
            delugeMaxUploadSlotsInput.value = '';
            delugeStopRatioInput.value = '';
            delugeRemoveAtRatioInput.checked = false;
            delugeMoveCompletedPathInput.value = '';
            delugeSequentialDownloadInput.checked = false;
            delugePrioritizeFirstLastInput.checked = false;
            delugePreAllocateInput.checked = false;
            rtorrentPriorityInput.value = 2;
            rtorrentThrottleInput.value = '';
            rtorrentPeersMaxInput.value = '';
            rtorrentPeersMinInput.value = '';
            rtorrentUploadsMaxInput.value = '';
            rtorrentUploadsMinInput.value = '';
            torrentfluxRelativePathInput.value = '';
            ruTorrentPathInput.value = '';
            if(document.getElementById('utorrentRelativePath')) document.getElementById('utorrentRelativePath').value = '';
            rutorrentdontaddnamepathInput.checked = false;
            rutorrentalwaysurlInput.checked = false;
            defaultTagsInput.value = '';
            defaultCategoryInput.value = '';
            categoriesInput.value = '';
            downloadDirectoriesInput.value = '';
            addPausedInput.checked = false;
            forceStartInput.checked = false;
            if (deleteTorrentWithFilesInput) deleteTorrentWithFilesInput.checked = false;
            labelDirectoryMapInput.value = '';
            askForLabelDirOnPageInput.checked = false;
        }
        // Update basic auth visibility
        basicAuthGroup.style.display = useBasicAuthInput.checked ? 'block' : 'none';
        toggleClientSpecificFields(currentClientType);
        formStatusMessageDiv.textContent = '';
        formStatusMessageDiv.className = 'status-message';
    }

    function hideServerForm() {
        serverFormSection.style.display = 'none';
        serverListSection.style.display = 'block';
        serverIdInput.value = '';
        serverNameInput.value = '';
        clientTypeSelect.value = 'qbittorrent';
        serverUrlInput.value = '';
        serverUsernameInput.value = '';
        serverPasswordInput.value = '';
        rpcPathInput.value = ''; 
        scgiPathInput.value = ''; 
        qbittorrentSavePathInput.value = '';
        if (qbittorrentApiKeyInput) qbittorrentApiKeyInput.value = '';
        if (qbittorrentApiKeyClearInput) qbittorrentApiKeyClearInput.checked = false;
        transmissionDownloadDirInput.value = '';
        ruTorrentPathInput.value = '';
        rutorrentdontaddnamepathInput.checked = false;
        rutorrentalwaysurlInput.checked = false;
        defaultTagsInput.value = '';
        defaultCategoryInput.value = '';
        categoriesInput.value = '';
        downloadDirectoriesInput.value = '';
        addPausedInput.checked = false;
        forceStartInput.checked = false;
        labelDirectoryMapInput.value = '';
        askForLabelDirOnPageInput.checked = false; 
        formStatusMessageDiv.textContent = '';
        formStatusMessageDiv.className = 'status-message';
        toggleClientSpecificFields('qbittorrent'); 
    }

    function formatBytes(bytes, decimals = 2) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function renderServerList() {
        serverListUl.innerHTML = ''; 
        if (servers.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No server profiles configured yet.';
            li.className = 'text-gray-500 dark:text-gray-400 italic p-4 text-center'; 
            serverListUl.appendChild(li);
            return;
        }
        servers.forEach(server => {
            const li = document.createElement('li');
            li.className = `p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0 bg-white dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow`;
            if (server.id === activeServerId) {
                li.classList.add('active-server-item'); 
                li.classList.remove('bg-white', 'dark:bg-gray-700'); 
                li.classList.add('bg-blue-50', 'dark:bg-blue-900/30'); 
            }
            const serverInfoDiv = document.createElement('div');
            serverInfoDiv.className = 'grow';
            const nameSpan = document.createElement('span');
            nameSpan.className = 'font-semibold text-lg text-gray-800 dark:text-white';
            nameSpan.textContent = server.name;

            const statusIndicator = document.createElement('span');
            statusIndicator.className = `ml-2 inline-block h-3 w-3 rounded-full ${server.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`;
            statusIndicator.title = `Status: ${server.status || 'Unknown'}${server.lastChecked ? ' (Last checked: ' + new Date(server.lastChecked).toLocaleString() + ')' : ''}`;
            nameSpan.appendChild(statusIndicator);

            serverInfoDiv.appendChild(nameSpan);
            if (server.id === activeServerId) {
                const activeBadge = document.createElement('span');
                activeBadge.className = 'ml-2 px-2 py-0.5 text-xs font-semibold text-green-800 bg-green-200 dark:text-green-700 dark:bg-green-300 rounded-full';
                activeBadge.textContent = 'Active';
                nameSpan.appendChild(activeBadge);
            }
            const clientTypeSpan = document.createElement('p');
            clientTypeSpan.className = 'text-sm text-gray-500 dark:text-gray-400';
            clientTypeSpan.textContent = `Client: ${server.clientType || 'N/A'}`;
            if (server.version) {
                // Normalise version so we don't end up with "vv5.1.2" if the API already includes a leading "v"
                const rawVersion = String(server.version);
                const normalisedVersion = rawVersion.replace(/^v/i, '');
                clientTypeSpan.textContent += ` (v${normalisedVersion})`;
            }
            if (server.clientType === 'qbittorrent' && server.webApiVersion) {
                clientTypeSpan.textContent += ` · Web API ${server.webApiVersion}`;
            }
            serverInfoDiv.appendChild(clientTypeSpan);

            if (typeof server.freeSpace === 'number' && server.freeSpace >= 0) {
                const freeSpaceSpan = document.createElement('p');
                freeSpaceSpan.className = 'text-sm text-gray-500 dark:text-gray-400';
                freeSpaceSpan.textContent = `Free Space: ${formatBytes(server.freeSpace)}`;
                serverInfoDiv.appendChild(freeSpaceSpan);
            }

            const urlSpan = document.createElement('p');
            urlSpan.className = 'text-sm text-gray-500 dark:text-gray-400 break-all';
            urlSpan.textContent = `URL: ${server.url}`;
            serverInfoDiv.appendChild(urlSpan);
            li.appendChild(serverInfoDiv);
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'actions flex space-x-2 shrink-0 mt-2 md:mt-0';
            const editButton = document.createElement('button');
            editButton.className = 'edit-button px-3 py-1 text-sm bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 dark:bg-yellow-400 dark:hover:bg-yellow-500';
            editButton.dataset.id = server.id;
            editButton.textContent = 'Edit';
            actionsDiv.appendChild(editButton);
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-button px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700';
            deleteButton.dataset.id = server.id;
            deleteButton.textContent = 'Delete';
            actionsDiv.appendChild(deleteButton);

            const openWebUiButton = document.createElement('button');
            openWebUiButton.className = 'open-webui-button px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600';
            openWebUiButton.dataset.url = server.url;
            openWebUiButton.textContent = 'WebUI';
            actionsDiv.appendChild(openWebUiButton);

            const exportProfileButton = document.createElement('button');
            exportProfileButton.className = 'export-profile-button px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:bg-purple-500 dark:hover:bg-purple-600';
            exportProfileButton.dataset.id = server.id;
            exportProfileButton.textContent = 'Export';
            actionsDiv.appendChild(exportProfileButton);

            li.appendChild(actionsDiv);
            serverListUl.appendChild(li);
        });
        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', handleEditServer);
        });
        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', handleDeleteServer);
        });
        document.querySelectorAll('.open-webui-button').forEach(button => {
            button.addEventListener('click', handleOpenWebUi);
        });
        document.querySelectorAll('.export-profile-button').forEach(button => {
            button.addEventListener('click', handleExportServerProfile);
        });
        populateRssFeedServerSelect();
    }

    function populateRssFeedServerSelect() {
        if (!rssNewFeedServerSelect) return;
        const selected = rssNewFeedServerSelect.value;
        rssNewFeedServerSelect.innerHTML = '<option value="">Use active server</option>';
        servers.forEach((server) => {
            const option = document.createElement('option');
            option.value = server.id;
            option.textContent = server.name;
            rssNewFeedServerSelect.appendChild(option);
        });
        if (selected) rssNewFeedServerSelect.value = selected;
    }

    function renderRssFeedsList() {
        if (!rssFeedsList) return;
        const feeds = Array.isArray(globalSettings.rssFeeds) ? globalSettings.rssFeeds : [];
        if (rssFeedsInput) rssFeedsInput.value = JSON.stringify(feeds, null, 2);
        rssFeedsList.innerHTML = '';
        rssFeedCount.textContent = `${feeds.length} feed${feeds.length === 1 ? '' : 's'}`;
        if (feeds.length === 0) {
            const empty = document.createElement('div');
            empty.className =
                'rounded-md border border-dashed border-gray-300 dark:border-gray-600 p-4 text-xs';
            empty.innerHTML = `
                <p class="font-medium text-gray-700 dark:text-gray-200">No RSS feeds yet.</p>
                <p class="mt-1 text-gray-600 dark:text-gray-300">Add one below, or import from qBittorrent.</p>
                <button type="button" class="rss-feed-add-example mt-3 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm">Load example into Add feed</button>
            `;
            rssFeedsList.appendChild(empty);
            return;
        }
        feeds.forEach((feed) => {
            rssFeedsList.appendChild(createRssFeedCardElement(feed));
        });
    }

    if (rssFeedsList) {
        rssFeedsList.addEventListener('click', (event) => {
            const saveBtn = event.target.closest('.rss-feed-save');
            const deleteBtn = event.target.closest('.rss-feed-delete');
            const revertBtn = event.target.closest('.rss-feed-revert');
            const exampleBtn = event.target.closest('.rss-feed-add-example');
            if (exampleBtn) {
                if (rssNewFeedUrl) rssNewFeedUrl.value = 'https://nyaa.si/?page=rss';
                if (rssNewFeedPattern) rssNewFeedPattern.value = '1080p|2160p';
                if (rssNewFeedServerSelect) rssNewFeedServerSelect.value = '';
                document.getElementById('rssFeedNewCard')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                displayFormStatus('Example loaded into Add feed.', 'info');
                return;
            }
            const card = event.target.closest('.rss-feed-card');
            if (!card?.dataset.feedId) return;
            const feedId = card.dataset.feedId;
            if (saveBtn) {
                saveRssFeedFromCard(card, feedId);
                return;
            }
            if (revertBtn) {
                const feed = (globalSettings.rssFeeds || []).find((f) => f.id === feedId);
                if (!feed) return;
                const fresh = createRssFeedCardElement(feed);
                card.replaceWith(fresh);
                displayFormStatus('Changes reverted.', 'info');
                return;
            }
            if (deleteBtn) {
                const feed = (globalSettings.rssFeeds || []).find((f) => f.id === feedId);
                const title = feed ? rssFeedDisplayTitle(feed) : 'this feed';
                if (!confirm(`Remove RSS feed “${title}”?`)) return;
                globalSettings.rssFeeds = (globalSettings.rssFeeds || []).filter((f) => f.id !== feedId);
                persistRssFeeds('RSS feed removed.');
            }
        });
    }

    // --- Event Handlers ---
    const clientHintDiv = document.getElementById('clientSpecificHint');
    if (clientTypeHelpIcon && clientHintDiv) {
        clientTypeHelpIcon.setAttribute('aria-expanded', 'false');
        clientHintDiv.setAttribute('aria-hidden', 'true');
        clientTypeHelpIcon.addEventListener('click', () => {
            const isHidden = clientHintDiv.style.display === 'none';
            clientHintDiv.style.display = isHidden ? 'block' : 'none';
            clientTypeHelpIcon.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
            clientHintDiv.setAttribute('aria-hidden', isHidden ? 'false' : 'true');
        });
    }

    useBasicAuthInput.addEventListener('change', () => {
        basicAuthGroup.style.display = useBasicAuthInput.checked ? 'block' : 'none';
    });

    showAddServerFormButton.addEventListener('click', () => {
        showServerForm(false);
    });
    importServerProfileButton.addEventListener('click', () => {
        importServerProfileFile.click();
    });
    importServerProfileFile.addEventListener('change', () => {
        const file = importServerProfileFile.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                const importedServer = parsed.server || parsed;
                if (!importedServer || !importedServer.name || !importedServer.url) {
                    throw new Error('Invalid server profile file.');
                }
                importedServer.id = generateId();
                servers.push(importedServer);
                if (!activeServerId) activeServerId = importedServer.id;
                chrome.storage.local.set({ servers, activeServerId }, () => {
                    displayFormStatus(`Imported server profile "${importedServer.name}".`, 'success');
                    loadSettings();
                });
            } catch (error) {
                displayFormStatus(`Import failed: ${error.message}`, 'error');
            } finally {
                importServerProfileFile.value = '';
            }
        };
        reader.readAsText(file);
    });
    cancelEditButton.addEventListener('click', () => {
        hideServerForm();
    });
    saveServerButton.addEventListener('click', () => {
        if (lastConnectionTestFailed) {
            if (!confirm('The last connection test for this server failed. Are you sure you want to save these settings anyway?')) {
                return; // Abort save if user cancels
            }
        }

        const id = serverIdInput.value;
        const name = serverNameInput.value.trim();
        const clientType = clientTypeSelect.value;
        const url = serverUrlInput.value.trim();
        const username = serverUsernameInput.value.trim();
        const password = serverPasswordInput.value;
        const useBasicAuth = useBasicAuthInput.checked;
        const basicAuthUsername = basicAuthUsernameInput.value.trim();
        const basicAuthPassword = basicAuthPasswordInput.value;
        const rpcPath = rpcPathInput.value.trim();
        const scgiPath = scgiPathInput.value.trim();
        const qbittorrentSavePath = qbittorrentSavePathInput.value.trim();
        const transmissionDownloadDir = transmissionDownloadDirInput.value.trim();
        const transmissionDownloadSpeedLimit = transmissionDownloadSpeedLimitInput.value.trim();
        const transmissionUploadSpeedLimit = transmissionUploadSpeedLimitInput.value.trim();
        const transmissionSeedRatioLimit = transmissionSeedRatioLimitInput.value.trim();
        const transmissionSeedIdleLimit = transmissionSeedIdleLimitInput.value.trim();
        const transmissionPeerLimit = transmissionPeerLimitInput.value.trim();
        const transmissionSequentialDownload = transmissionSequentialDownloadInput.checked;
        const transmissionBandwidthPriority = transmissionBandwidthPriorityInput.value;
        const delugeDownloadSpeedLimit = delugeDownloadSpeedLimitInput.value.trim();
        const delugeUploadSpeedLimit = delugeUploadSpeedLimitInput.value.trim();
        const delugeMaxConnections = delugeMaxConnectionsInput.value.trim();
        const delugeMaxUploadSlots = delugeMaxUploadSlotsInput.value.trim();
        const delugeStopRatio = delugeStopRatioInput.value.trim();
        const delugeRemoveAtRatio = delugeRemoveAtRatioInput.checked;
        const delugeMoveCompletedPath = delugeMoveCompletedPathInput.value.trim();
        const delugeSequentialDownload = delugeSequentialDownloadInput.checked;
        const delugePrioritizeFirstLast = delugePrioritizeFirstLastInput.checked;
        const delugePreAllocate = delugePreAllocateInput.checked;
        const rtorrentPriority = rtorrentPriorityInput.value;
        const rtorrentThrottle = rtorrentThrottleInput.value.trim();
        const rtorrentPeersMax = rtorrentPeersMaxInput.value.trim();
        const rtorrentPeersMin = rtorrentPeersMinInput.value.trim();
        const rtorrentUploadsMax = rtorrentUploadsMaxInput.value.trim();
        const rtorrentUploadsMin = rtorrentUploadsMinInput.value.trim();
        const torrentfluxRelativePath = torrentfluxRelativePathInput.value.trim();
        const ruTorrentrelativepath = ruTorrentPathInput.value.trim();
        const utorrentrelativepath = document.getElementById('utorrentRelativePath') ? document.getElementById('utorrentRelativePath').value.trim() : '';
        const rutorrentdontaddnamepath = rutorrentdontaddnamepathInput.checked;
        const rutorrentalwaysurl = rutorrentalwaysurlInput.checked;
        const tags = defaultTagsInput.value.trim();
        const category = defaultCategoryInput.value.trim();
        const categories = document.getElementById('categories').value.trim();
        const downloadDirectories = downloadDirectoriesInput.value.trim();
        const addPaused = addPausedInput.checked;
        const forceStart = forceStartInput.checked;
        const labelDirectoryMap = labelDirectoryMapInput.value.trim();
        const askForLabelDirOnPage = askForLabelDirOnPageInput.checked; 
        
        if (!name || !url) {
            displayFormStatus('Server Name and URL are required.', 'error');
            return;
        }
        try { new URL(url); } catch (e) {
            displayFormStatus('Invalid Server URL format.', 'error');
            return;
        }
        if (clientType === 'rutorrent' && (!username || !password)) {
            if (!confirm('ruTorrent typically requires a username and password. Proceed without credentials?')) {
                return;
            }
        }
        
        const serverData = {
            name,
            clientType,
            url,
            username,
            password,
            useBasicAuth,
            basicAuthUsername,
            basicAuthPassword,
            tags,
            category,
            categories,
            downloadDirectories,
            addPaused,
            forceStart,
            deleteTorrentWithFiles: deleteTorrentWithFilesInput?.checked || false,
            labelDirectoryMap,
            askForLabelDirOnPage,
            ruTorrentrelativepath,
            utorrentrelativepath,
            rutorrentdontaddnamepath,
            rutorrentalwaysurl,
            transmissionDownloadDir,
            qbittorrentSavePath,
            transmissionDownloadSpeedLimit,
            transmissionUploadSpeedLimit,
            transmissionSeedRatioLimit,
            transmissionSeedIdleLimit,
            transmissionPeerLimit,
            transmissionSequentialDownload,
            transmissionBandwidthPriority,
            delugeDownloadSpeedLimit,
            delugeUploadSpeedLimit,
            delugeMaxConnections,
            delugeMaxUploadSlots,
            delugeStopRatio,
            delugeRemoveAtRatio,
            delugeMoveCompletedPath,
            delugeSequentialDownload,
            delugePrioritizeFirstLast,
            delugePreAllocate,
            rtorrentPriority,
            rtorrentThrottle,
            rtorrentPeersMax,
            rtorrentPeersMin,
            rtorrentUploadsMax,
            rtorrentUploadsMin,
            torrentfluxRelativePath
        };
        
        if (clientType === 'transmission') {
            serverData.rpcPath = rpcPath;
            serverData.transmissionDownloadDir = transmissionDownloadDir;
            serverData.transmissionDownloadSpeedLimit = transmissionDownloadSpeedLimit;
            serverData.transmissionUploadSpeedLimit = transmissionUploadSpeedLimit;
            serverData.transmissionSeedRatioLimit = transmissionSeedRatioLimit;
            serverData.transmissionSeedIdleLimit = transmissionSeedIdleLimit;
            serverData.transmissionPeerLimit = transmissionPeerLimit;
            serverData.transmissionSequentialDownload = transmissionSequentialDownload;
            serverData.transmissionBandwidthPriority = transmissionBandwidthPriority;
        } else if (clientType === 'deluge') {
            serverData.delugeDownloadSpeedLimit = delugeDownloadSpeedLimit;
            serverData.delugeUploadSpeedLimit = delugeUploadSpeedLimit;
            serverData.delugeMaxConnections = delugeMaxConnections;
            serverData.delugeMaxUploadSlots = delugeMaxUploadSlots;
            serverData.delugeStopRatio = delugeStopRatio;
            serverData.delugeRemoveAtRatio = delugeRemoveAtRatio;
            serverData.delugeMoveCompletedPath = delugeMoveCompletedPath;
            serverData.delugeSequentialDownload = delugeSequentialDownload;
            serverData.delugePrioritizeFirstLast = delugePrioritizeFirstLast;
            serverData.delugePreAllocate = delugePreAllocate;
        } else if (clientType === 'rtorrent') {
            serverData.scgiPath = scgiPath;
            serverData.rtorrentPriority = rtorrentPriority;
            serverData.rtorrentThrottle = rtorrentThrottle;
            serverData.rtorrentPeersMax = rtorrentPeersMax;
            serverData.rtorrentPeersMin = rtorrentPeersMin;
            serverData.rtorrentUploadsMax = rtorrentUploadsMax;
            serverData.rtorrentUploadsMin = rtorrentUploadsMin;
        } else if (clientType === 'torrentflux') {
            serverData.torrentfluxRelativePath = torrentfluxRelativePath;
        } else if (clientType === 'synology_download_station') {
            serverData.authApiVersion =
                synologyAuthApiVersionSelect?.value || '6';
            serverData.taskApiVersion =
                synologyTaskApiVersionSelect?.value || '3';
            serverData.synologyAutoResume = !!synologyAutoResumeInput?.checked;
        } else if (clientType === 'flood') {
            serverData.floodSequentialDownload = !!floodSequentialDownloadInput?.checked;
        } else if (clientType === 'porla') {
            serverData.porlaPreset = porlaPresetInput?.value?.trim() || '';
        } else if (clientType === 'qbittorrent') {
            serverData.qbittorrentSavePath = qbittorrentSavePath;
            serverData.qbittorrentAuthMode =
                qbittorrentAuthModeSelect && qbittorrentAuthModeSelect.value === 'basic'
                    ? 'basic'
                    : 'cookie';
            const apiKeyTrim = qbittorrentApiKeyInput ? qbittorrentApiKeyInput.value.trim() : '';
            const removeApiKey = qbittorrentApiKeyClearInput && qbittorrentApiKeyClearInput.checked;
            if (removeApiKey) {
                serverData.qbittorrentApiKey = '';
            } else if (apiKeyTrim) {
                serverData.qbittorrentApiKey = apiKeyTrim;
            } else if (id) {
                const existingSrv = servers.find((s) => s.id === id);
                serverData.qbittorrentApiKey = existingSrv?.qbittorrentApiKey || '';
            } else {
                serverData.qbittorrentApiKey = '';
            }
        }
        if (id) {
            const index = servers.findIndex(s => s.id === id);
            if (index > -1) {
                // Preserve existing status fields when editing
                const existingServer = servers[index];
                servers[index] = { 
                    ...existingServer, // Keep old status fields
                    ...serverData      // Overwrite with new form data
                };
            }
        } else { 
            serverData.id = generateId();
            servers.push(serverData);
            if (servers.length === 1 && !activeServerId) activeServerId = serverData.id;
        }
        chrome.permissions.request({ origins: [`${new URL(url).origin}/`] }, (granted) => {
            if (granted) {
                chrome.storage.local.set({ servers, activeServerId }, () => {
                    displayFormStatus(id ? 'Server updated successfully!' : 'Server added successfully!', 'success');
                    loadSettings(); 
                    setTimeout(hideServerForm, 1000); 
                });
            } else {
                displayFormStatus('Host permission denied. Cannot save server that requires new permissions.', 'error');
                if (!id) servers.pop(); 
            }
        });
    });
    function handleEditServer(event) {
        const serverIdToEdit = event.target.dataset.id;
        const serverToEdit = servers.find(s => s.id === serverIdToEdit);
        if (serverToEdit) showServerForm(true, serverToEdit);
    }
    function handleDeleteServer(event) {
        const serverIdToDelete = event.target.dataset.id;
        if (confirm(`Are you sure you want to delete server: ${servers.find(s=>s.id === serverIdToDelete)?.name}?`)) {
            servers = servers.filter(s => s.id !== serverIdToDelete);
            if (activeServerId === serverIdToDelete) activeServerId = servers.length > 0 ? servers[0].id : null; 
            chrome.storage.local.set({ servers, activeServerId }, () => {
                alert('Server deleted.'); 
                loadSettings();
            });
        }
    }

    function handleExportServerProfile(event) {
        const serverIdToExport = event.target.dataset.id;
        const server = servers.find((s) => s.id === serverIdToExport);
        if (!server) return;
        const payload = {
            exportedAt: new Date().toISOString(),
            server,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${server.name.replace(/[^a-z0-9-_]+/gi, '_')}_profile.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        displayFormStatus(`Exported profile for "${server.name}".`, 'success');
    }
    function qbitActionErrorMessage(response) {
        if (!response) return 'No response from extension.';
        const err = response.error;
        if (typeof err === 'string') return err;
        return err?.userMessage || 'Request failed.';
    }

    function applyQbitProfileFields(profileFields) {
        if (!profileFields) return;
        if (profileFields.categories !== undefined) categoriesInput.value = profileFields.categories;
        if (profileFields.labelDirectoryMap !== undefined) {
            labelDirectoryMapInput.value = profileFields.labelDirectoryMap;
        }
    }

    function updateSearchProviderUi() {
        const provider = searchProviderInput.value;
        const isQbit = provider === 'qbittorrent';
        const isExternal = provider === 'jackett' || provider === 'prowlarr';
        if (qbitSearchHint) qbitSearchHint.style.display = isQbit ? 'block' : 'none';
        if (searchApiUrlGroup) searchApiUrlGroup.style.display = isExternal ? 'block' : 'none';
        if (searchApiKeyGroup) searchApiKeyGroup.style.display = isExternal ? 'block' : 'none';
    }

    function requireSavedQbitServerId() {
        const id = serverIdInput.value.trim();
        if (!id) {
            displayFormStatus('Save this qBittorrent server profile first, then run sync/import.', 'error');
            return null;
        }
        if (clientTypeSelect.value !== 'qbittorrent') {
            displayFormStatus('Switch client type to qBittorrent.', 'error');
            return null;
        }
        return id;
    }

    function resolveQbitServerIdForRssImport(preferredServerId) {
        if (preferredServerId) {
            const server = servers.find((s) => s.id === preferredServerId);
            if (!server) {
                displayFormStatus('Selected server not found.', 'error');
                return null;
            }
            if (server.clientType !== 'qbittorrent') {
                displayFormStatus('RSS import requires a qBittorrent server profile.', 'error');
                return null;
            }
            return server.id;
        }
        const dropdownId = rssFeedServerSelect?.value?.trim();
        if (dropdownId) {
            const server = servers.find((s) => s.id === dropdownId);
            if (!server) {
                displayFormStatus('Selected server not found.', 'error');
                return null;
            }
            if (server.clientType !== 'qbittorrent') {
                displayFormStatus('Choose a qBittorrent server in the RSS target dropdown.', 'error');
                return null;
            }
            return server.id;
        }
        const firstQbit = servers.find((s) => s.clientType === 'qbittorrent');
        if (firstQbit) return firstQbit.id;
        displayFormStatus('Add a qBittorrent server profile or select one in the RSS target dropdown.', 'error');
        return null;
    }

    function runSyncQbitRssFeeds(serverId) {
        if (!serverId) return;
        displayFormStatus('Importing RSS feeds from qBittorrent…', '');
        chrome.runtime.sendMessage({ action: 'syncQbitRssFeeds', serverId, merge: true }, (response) => {
            if (chrome.runtime.lastError) {
                displayFormStatus(chrome.runtime.lastError.message, 'error');
                return;
            }
            if (!response?.success) {
                displayFormStatus(qbitActionErrorMessage(response), 'error');
                return;
            }
            globalSettings.rssFeeds = response.feeds || [];
            renderRssFeedsList();
            populateRssFeedServerSelect();
            const rulesNote = response.rulesAvailable === false
                ? ' (RSS rules unavailable — filters may be empty)'
                : '';
            displayFormStatus(
                `Imported ${response.importedFromQbit || 0} feed(s) from qBittorrent: ${response.added || 0} added, ${response.updated || 0} updated${rulesNote}.`,
                'success'
            );
        });
    }

    if (syncQbitRssFeedsBtn) {
        syncQbitRssFeedsBtn.addEventListener('click', () => {
            const serverId = resolveQbitServerIdForRssImport(null);
            runSyncQbitRssFeeds(serverId);
        });
    }

    if (syncQbitRssFromProfileBtn) {
        syncQbitRssFromProfileBtn.addEventListener('click', () => {
            const serverId = requireSavedQbitServerId();
            runSyncQbitRssFeeds(serverId);
        });
    }

    if (syncQbitCategoriesBtn) {
        syncQbitCategoriesBtn.addEventListener('click', () => {
            const serverId = requireSavedQbitServerId();
            if (!serverId) return;
            displayFormStatus('Syncing categories from qBittorrent…', '');
            chrome.runtime.sendMessage({ action: 'syncQbitCategories', serverId }, (response) => {
                if (chrome.runtime.lastError) {
                    displayFormStatus(chrome.runtime.lastError.message, 'error');
                    return;
                }
                if (!response?.success) {
                    displayFormStatus(qbitActionErrorMessage(response), 'error');
                    return;
                }
                applyQbitProfileFields(response.profileFields);
                displayFormStatus(
                    `Synced ${response.categories?.length || 0} categories. Click Save Server to keep changes.`,
                    'success'
                );
            });
        });
    }

    if (importQbitCategoriesBtn) {
        importQbitCategoriesBtn.addEventListener('click', () => {
            qbitCategoriesFile.click();
        });
        qbitCategoriesFile.addEventListener('change', () => {
            const file = qbitCategoriesFile.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => runQbitCategoriesImport(e.target.result);
            reader.readAsText(file);
            qbitCategoriesFile.value = '';
        });
    }

    function runQbitCategoriesImport(jsonText) {
        const serverId = requireSavedQbitServerId();
        if (!serverId || !jsonText?.trim()) return;
        displayFormStatus('Importing categories…', '');
        chrome.runtime.sendMessage(
            {
                action: 'importQbitCategories',
                serverId,
                jsonText,
                pushToServer: qbitImportPushToServer?.checked !== false,
                merge: true,
            },
            (response) => {
                if (chrome.runtime.lastError) {
                    displayFormStatus(chrome.runtime.lastError.message, 'error');
                    return;
                }
                if (!response?.success) {
                    displayFormStatus(qbitActionErrorMessage(response), 'error');
                    return;
                }
                applyQbitProfileFields(response.profileFields);
                const s = response.summary;
                displayFormStatus(
                    `Import done: ${s?.created || 0} created, ${s?.updated || 0} updated, ${s?.skipped || 0} skipped. Click Save Server to keep changes.`,
                    'success'
                );
            }
        );
    }

    if (qbitCategoriesPaste) {
        const pasteBtn = document.createElement('button');
        pasteBtn.type = 'button';
        pasteBtn.className = 'mt-1 px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded-md';
        pasteBtn.textContent = 'Import pasted JSON';
        pasteBtn.addEventListener('click', () => runQbitCategoriesImport(qbitCategoriesPaste.value));
        qbitCategoriesPaste.parentElement?.appendChild(pasteBtn);
    }

    if (syncQbitTagsBtn) {
        syncQbitTagsBtn.addEventListener('click', () => {
            const serverId = requireSavedQbitServerId();
            if (!serverId) return;
            displayFormStatus('Syncing tags…', '');
            chrome.runtime.sendMessage({ action: 'syncQbitTags', serverId }, (response) => {
                if (chrome.runtime.lastError) {
                    displayFormStatus(chrome.runtime.lastError.message, 'error');
                    return;
                }
                if (!response?.success) {
                    displayFormStatus(qbitActionErrorMessage(response), 'error');
                    return;
                }
                defaultTagsInput.value = response.defaultTags || '';
                displayFormStatus(
                    `Synced ${response.tags?.length || 0} tags. Click Save Server to keep changes.`,
                    'success'
                );
            });
        });
    }

    if (syncQbitSavePathBtn) {
        syncQbitSavePathBtn.addEventListener('click', () => {
            const serverId = requireSavedQbitServerId();
            if (!serverId) return;
            displayFormStatus('Syncing default save path…', '');
            chrome.runtime.sendMessage({ action: 'syncQbitDefaultSavePath', serverId }, (response) => {
                if (chrome.runtime.lastError) {
                    displayFormStatus(chrome.runtime.lastError.message, 'error');
                    return;
                }
                if (!response?.success) {
                    displayFormStatus(qbitActionErrorMessage(response), 'error');
                    return;
                }
                if (qbittorrentSavePathInput) qbittorrentSavePathInput.value = response.savePath || '';
                displayFormStatus(
                    `Default save path: ${response.savePath}. Click Save Server to keep changes.`,
                    'success'
                );
            });
        });
    }

    function getQbitServerIdForApiActions() {
        return requireSavedQbitServerId();
    }

    if (qbitRotateApiKeyBtn) {
        qbitRotateApiKeyBtn.addEventListener('click', () => {
            const serverId = getQbitServerIdForApiActions();
            if (!serverId) return;
            if (
                !confirm(
                    'Generate a new Web API key on qBittorrent? The old key will stop working. You must Save Server after this to store the new key.'
                )
            ) {
                return;
            }
            displayFormStatus('Rotating API key on server…', '');
            chrome.runtime.sendMessage({ action: 'qbitRotateApiKey', serverId }, (response) => {
                if (chrome.runtime.lastError) {
                    displayFormStatus(chrome.runtime.lastError.message, 'error');
                    return;
                }
                if (!response?.success) {
                    displayFormStatus(qbitActionErrorMessage(response), 'error');
                    return;
                }
                if (qbittorrentApiKeyInput) {
                    qbittorrentApiKeyInput.value = response.apiKey || '';
                }
                if (qbittorrentApiKeyClearInput) qbittorrentApiKeyClearInput.checked = false;
                displayFormStatus(
                    'New API key received. Click Save Server to store it in this profile.',
                    'success'
                );
            });
        });
    }

    if (qbitDeleteApiKeyOnServerBtn) {
        qbitDeleteApiKeyOnServerBtn.addEventListener('click', () => {
            const serverId = getQbitServerIdForApiActions();
            if (!serverId) return;
            if (
                !confirm(
                    'Delete the Web API key on qBittorrent? API access with the current key will stop until you generate a new one.'
                )
            ) {
                return;
            }
            displayFormStatus('Deleting API key on server…', '');
            chrome.runtime.sendMessage({ action: 'qbitDeleteApiKeyOnServer', serverId }, (response) => {
                if (chrome.runtime.lastError) {
                    displayFormStatus(chrome.runtime.lastError.message, 'error');
                    return;
                }
                if (!response?.success) {
                    displayFormStatus(qbitActionErrorMessage(response), 'error');
                    return;
                }
                if (qbittorrentApiKeyInput) qbittorrentApiKeyInput.value = '';
                displayFormStatus(
                    'API key deleted on server. Clear saved key on save or paste a new key.',
                    'success'
                );
            });
        });
    }

    if (refreshQbitSearchPluginsBtn) {
        refreshQbitSearchPluginsBtn.addEventListener('click', () => {
            const serverId = requireSavedQbitServerId();
            if (!serverId) return;
            qbitSearchPluginsList.innerHTML = '<li>Loading…</li>';
            chrome.runtime.sendMessage({ action: 'getQbitSearchPlugins', serverId }, (response) => {
                if (chrome.runtime.lastError) {
                    qbitSearchPluginsList.innerHTML = `<li>${escapeHtml(chrome.runtime.lastError.message)}</li>`;
                    return;
                }
                if (!response?.success) {
                    qbitSearchPluginsList.innerHTML = `<li>${escapeHtml(qbitActionErrorMessage(response))}</li>`;
                    return;
                }
                const plugins = response.plugins || [];
                if (plugins.length === 0) {
                    qbitSearchPluginsList.innerHTML =
                        '<li>No plugins — enable Search in qBittorrent and install plugins.</li>';
                    return;
                }
                qbitSearchPluginsList.innerHTML = plugins
                    .map((p) => {
                        const label = escapeHtml(p.fullName || p.name);
                        const id = escapeHtml(p.name);
                        return `<li>${p.enabled ? '✓' : '○'} ${label} (${id})</li>`;
                    })
                    .join('');
            });
        });
    }

    testConnectionButton.addEventListener('click', () => {
        const apiKeyForTest =
            clientTypeSelect.value === 'qbittorrent'
                ? qbittorrentApiKeyClearInput && qbittorrentApiKeyClearInput.checked
                    ? ''
                    : (qbittorrentApiKeyInput && qbittorrentApiKeyInput.value.trim()) ||
                      (serverIdInput.value &&
                          servers.find((s) => s.id === serverIdInput.value)?.qbittorrentApiKey) ||
                      ''
                : undefined;
        const serverConfig = {
            id: serverIdInput.value,
            name: serverNameInput.value.trim(),
            clientType: clientTypeSelect.value,
            url: serverUrlInput.value.trim(),
            username: serverUsernameInput.value.trim(),
            password: serverPasswordInput.value,
            useBasicAuth: useBasicAuthInput.checked,
            basicAuthUsername: basicAuthUsernameInput.value.trim(),
            basicAuthPassword: basicAuthPasswordInput.value,
            rpcPath: clientTypeSelect.value === 'transmission' ? rpcPathInput.value.trim() : undefined,
            scgiPath: clientTypeSelect.value === 'rtorrent' ? scgiPathInput.value.trim() : undefined,
            ruTorrentrelativepath: clientTypeSelect.value === 'rutorrent' ? ruTorrentPathInput.value.trim() : undefined,
            utorrentrelativepath: clientTypeSelect.value === 'utorrent' ? document.getElementById('utorrentRelativePath').value.trim() : undefined,
            qbittorrentSavePath:
                clientTypeSelect.value === 'qbittorrent'
                    ? qbittorrentSavePathInput.value.trim()
                    : undefined,
            qbittorrentApiKey: apiKeyForTest,
            qbittorrentAuthMode:
                clientTypeSelect.value === 'qbittorrent' && qbittorrentAuthModeSelect
                    ? qbittorrentAuthModeSelect.value
                    : 'cookie',
        };
        if (!serverConfig.url && clientTypeSelect.value !== 'rtorrent') { 
            displayFormStatus('Server URL is required to test connection.', 'error'); return;
        }
        if (clientTypeSelect.value === 'rtorrent' && !serverConfig.scgiPath && !serverConfig.url) {
            displayFormStatus('For rTorrent, either Server URL (for WebUI) or SCGI/HTTPRPC URL is required.', 'error'); return;
        }
        if (serverConfig.url) { try { new URL(serverConfig.url); } catch (e) { displayFormStatus('Invalid Server URL format.', 'error'); return; } }
        if (serverConfig.scgiPath) { try { new URL(serverConfig.scgiPath); } catch (e) { if (serverConfig.scgiPath.startsWith('http://') || serverConfig.scgiPath.startsWith('https://') || serverConfig.scgiPath.startsWith('scgi://')) { displayFormStatus('Invalid SCGI/HTTPRPC URL format.', 'error'); return; } } }
        if (!serverConfig.clientType) { displayFormStatus('Client Type is required to test connection.', 'error'); return; }
        displayFormStatus('Testing connection...', ''); 
        chrome.permissions.contains({ origins: [`${new URL(serverConfig.url).origin}/`] }, (granted) => {
            if (granted) {
                chrome.runtime.sendMessage({ action: 'testConnection', config: serverConfig }, (response) => {
                    lastConnectionTestFailed = !response?.success; // Track test result
                    if (chrome.runtime.lastError) {
                        displayFormStatus(`Error: ${chrome.runtime.lastError.message}`, 'error');
                    } else if (response) {
                        if (response.success) {
                            let successMessage = response.data.message || 'Connection successful!';
                            if (response.data.webApiVersion) {
                                successMessage += ` Web API ${response.data.webApiVersion}.`;
                            }
                            if (response.data.globalSpeedLimits) {
                                const gl = response.data.globalSpeedLimits;
                                const fmt = (n) =>
                                    n <= 0 ? 'unlimited' : `${Math.round(n / 1024)} KiB/s`;
                                successMessage += ` Global limits: DL ${fmt(gl.dlLimit)}, UL ${fmt(gl.upLimit)}.`;
                            }
                            displayFormStatus(successMessage, 'success');

                            // If we have an ID, it means we are editing an existing server.
                            // Let's save the advanced info.
                            if (serverConfig.id && response.data) {
                                const serverIndex = servers.findIndex(s => s.id === serverConfig.id);
                                if (serverIndex > -1) {
                                    servers[serverIndex].version = response.data.version;
                                    servers[serverIndex].webApiVersion = response.data.webApiVersion;
                                    servers[serverIndex].freeSpace = response.data.freeSpace;
                                    if (response.data.globalSpeedLimits) {
                                        servers[serverIndex].globalSpeedLimits =
                                            response.data.globalSpeedLimits;
                                    }
                                    if (clientTypeSelect.value === 'synology_download_station') {
                                        if (response.data.synologyAuthApiMaxVersion && synologyAuthApiVersionSelect) {
                                            const opt = synologyAuthApiVersionSelect.querySelector(
                                                `option[value="${response.data.synologyAuthApiMaxVersion}"]`
                                            );
                                            if (!opt) {
                                                const o = document.createElement('option');
                                                o.value = response.data.synologyAuthApiMaxVersion;
                                                o.textContent = `${response.data.synologyAuthApiMaxVersion} (detected)`;
                                                synologyAuthApiVersionSelect.appendChild(o);
                                            }
                                        }
                                        if (response.data.synologyTaskApiMaxVersion && synologyTaskApiVersionSelect) {
                                            const opt = synologyTaskApiVersionSelect.querySelector(
                                                `option[value="${response.data.synologyTaskApiMaxVersion}"]`
                                            );
                                            if (!opt) {
                                                const o = document.createElement('option');
                                                o.value = response.data.synologyTaskApiMaxVersion;
                                                o.textContent = `${response.data.synologyTaskApiMaxVersion} (detected)`;
                                                synologyTaskApiVersionSelect.appendChild(o);
                                            }
                                        }
                                    }
                                    // Persist the updated server info
                                    chrome.storage.local.set({ servers }, () => {
                                        renderServerList(); // Re-render to show new info
                                    });
                                }
                            }
                        } else {
                            let errorMessage = "Connection failed.";
                            if (response.error && response.error.userMessage) errorMessage = `Connection failed: ${response.error.userMessage}`;
                            else if (response.message) errorMessage = `Connection failed: ${response.message}`;
                            else if (response.error) errorMessage = `Connection failed: ${JSON.stringify(response.error)}`;
                            displayFormStatus(errorMessage, 'error');
                        }
                    } else {
                        displayFormStatus('No response from service worker.', 'error');
                    }
                });
            } else {
                displayFormStatus('Host permission not granted for this URL. Please save the server configuration first to request permission.', 'error');
            }
        });
    });

    // --- Event Handlers for Global Settings ---
    clientTypeSelect.addEventListener('change', (event) => { toggleClientSpecificFields(event.target.value); });
    advancedAddDialogInput.addEventListener('change', () => {
        globalSettings.advancedAddDialog = advancedAddDialogInput.value || 'never';
        chrome.storage.local.set({ advancedAddDialog: globalSettings.advancedAddDialog }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });
    catchFromPageToggle.addEventListener('change', () => {
        globalSettings.catchfrompage = catchFromPageToggle.checked;
        chrome.storage.local.set({ catchfrompage: globalSettings.catchfrompage }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });
    linksFoundIndicatorToggle.addEventListener('change', () => {
        globalSettings.linksfoundindicator = linksFoundIndicatorToggle.checked;
        chrome.storage.local.set({ linksfoundindicator: globalSettings.linksfoundindicator }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });
    registerDelayInput.addEventListener('change', () => { 
        globalSettings.registerDelay = parseInt(registerDelayInput.value, 10) || 0;
        chrome.storage.local.set({ registerDelay: globalSettings.registerDelay }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });
    enableSoundNotificationsToggle.addEventListener('change', () => {
        globalSettings.enableSoundNotifications = enableSoundNotificationsToggle.checked;
        chrome.storage.local.set({ enableSoundNotifications: globalSettings.enableSoundNotifications }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });
    enableTextNotificationsToggle.addEventListener('change', () => {
        globalSettings.enableTextNotifications = enableTextNotificationsToggle.checked;
        chrome.storage.local.set({ enableTextNotifications: globalSettings.enableTextNotifications }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });
    enableReviewPromptsToggle.addEventListener('change', () => {
        globalSettings.enableReviewPrompts = enableReviewPromptsToggle.checked;
        chrome.storage.local.set({ enableReviewPrompts: globalSettings.enableReviewPrompts }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });
    enableCompletionNotificationsToggle.addEventListener('change', () => {
        globalSettings.enableCompletionNotifications = enableCompletionNotificationsToggle.checked;
        chrome.storage.local.set({ enableCompletionNotifications: globalSettings.enableCompletionNotifications }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });
    enableServerSpecificContextMenuToggle.addEventListener('change', () => {
        globalSettings.enableServerSpecificContextMenu = enableServerSpecificContextMenuToggle.checked;
        chrome.storage.local.set({ enableServerSpecificContextMenu: globalSettings.enableServerSpecificContextMenu }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });

    showDownloadDirInContextMenuToggle.addEventListener('change', () => {
        globalSettings.showDownloadDirInContextMenu = showDownloadDirInContextMenuToggle.checked;
        chrome.storage.local.set({ showDownloadDirInContextMenu: globalSettings.showDownloadDirInContextMenu }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });
    forceTorrentDownloadToggle.addEventListener('change', () => {
        globalSettings.forceTorrentDownload = forceTorrentDownloadToggle.checked;
        chrome.storage.local.set({ forceTorrentDownload: globalSettings.forceTorrentDownload }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });
    badgeModeInput.addEventListener('change', () => {
        globalSettings.badgeMode = badgeModeInput.value || 'links';
        chrome.storage.local.set({ badgeMode: globalSettings.badgeMode }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });
    badgeShowServerHealthToggle.addEventListener('change', () => {
        globalSettings.badgeShowServerHealth = badgeShowServerHealthToggle.checked;
        chrome.storage.local.set({ badgeShowServerHealth: globalSettings.badgeShowServerHealth }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });
    autoAddClipboardOnOpenToggle.addEventListener('change', () => {
        globalSettings.autoAddClipboardOnOpen = autoAddClipboardOnOpenToggle.checked;
        chrome.storage.local.set({ autoAddClipboardOnOpen: globalSettings.autoAddClipboardOnOpen }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });
    rssAutoAddEnabledToggle.addEventListener('change', () => {
        globalSettings.rssAutoAddEnabled = rssAutoAddEnabledToggle.checked;
        chrome.storage.local.set({ rssAutoAddEnabled: globalSettings.rssAutoAddEnabled }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });
    rssFeedsInput.addEventListener('change', () => {
        try {
            const feeds = JSON.parse(rssFeedsInput.value || '[]');
            if (!Array.isArray(feeds)) throw new Error('RSS feeds must be a JSON array.');
            globalSettings.rssFeeds = feeds;
            chrome.storage.local.set({ rssFeeds: feeds }, () => { displayFormStatus('Global settings updated.', 'success'); });
            renderRssFeedsList();
        } catch (error) {
            displayFormStatus(`Invalid RSS feed JSON: ${error.message}`, 'error');
        }
    });
    searchProviderInput.addEventListener('change', () => {
        globalSettings.searchProvider = searchProviderInput.value || 'none';
        updateSearchProviderUi();
        chrome.storage.local.set({ searchProvider: globalSettings.searchProvider }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });
    searchApiUrlInput.addEventListener('change', () => {
        globalSettings.searchApiUrl = searchApiUrlInput.value.trim();
        chrome.storage.local.set({ searchApiUrl: globalSettings.searchApiUrl }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });
    searchApiKeyInput.addEventListener('change', () => {
        globalSettings.searchApiKey = searchApiKeyInput.value;
        chrome.storage.local.set({ searchApiKey: globalSettings.searchApiKey }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });
    addRssFeedButton.addEventListener('click', () => {
        const url = rssNewFeedUrl?.value.trim() || '';
        const pattern = rssNewFeedPattern?.value.trim() || '';
        const serverId = rssNewFeedServerSelect?.value.trim() || '';
        const validationError = validateRssFeedFields(url, pattern);
        if (validationError) {
            displayFormStatus(validationError, 'error');
            return;
        }
        const newFeed = {
            id: generateLocalId('feed'),
            url,
            pattern,
            serverId: serverId || undefined,
        };
        globalSettings.rssFeeds = [...(globalSettings.rssFeeds || []), newFeed];
        chrome.storage.local.set({ rssFeeds: globalSettings.rssFeeds }, () => {
            resetRssNewFeedForm();
            renderRssFeedsList();
            populateRssFeedServerSelect();
            highlightRssSaveFeedback(addRssFeedButton);
            displayFormStatus('RSS feed added.', 'success');
            const addedCard = rssFeedsList?.querySelector(`[data-feed-id="${newFeed.id}"]`);
            addedCard?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    });
    testSearchProviderButton.addEventListener('click', () => {
        const provider = searchProviderInput.value;
        if (provider === 'none') {
            testSearchProviderStatus.textContent = 'Provider disabled.';
            return;
        }
        if (provider === 'qbittorrent') {
            const serverId = requireSavedQbitServerId();
            if (!serverId) {
                testSearchProviderStatus.textContent = 'Save a qBittorrent profile first.';
                return;
            }
            testSearchProviderStatus.textContent = 'Testing...';
            chrome.runtime.sendMessage(
                { action: 'searchTorrents', query: 'ubuntu', limit: 3, serverId },
                (response) => {
                    if (chrome.runtime.lastError) {
                        testSearchProviderStatus.textContent = `Error: ${chrome.runtime.lastError.message}`;
                        return;
                    }
                    if (!response?.success) {
                        testSearchProviderStatus.textContent = `Failed: ${response?.error?.userMessage || response?.error || 'No response'}`;
                        return;
                    }
                    testSearchProviderStatus.textContent = `OK: ${response.results?.length || 0} results`;
                }
            );
            return;
        }
        testSearchProviderStatus.textContent = 'Testing...';
        chrome.runtime.sendMessage({ action: 'searchTorrents', query: 'ubuntu', limit: 3 }, (response) => {
            if (chrome.runtime.lastError) {
                testSearchProviderStatus.textContent = `Error: ${chrome.runtime.lastError.message}`;
                return;
            }
            if (!response?.success) {
                testSearchProviderStatus.textContent = `Failed: ${response?.error || 'No response'}`;
                return;
            }
            testSearchProviderStatus.textContent = `OK: ${response.results?.length || 0} results`;
        });
    });

    // --- Event Handlers for Backup/Restore ---
    exportSettingsButton.addEventListener('click', () => {
        const settingsToExport = {
            servers, activeServerId, ...globalSettings, urlToServerMappings, trackerUrlRules, linkCatchingPatterns
        };
        const jsonString = JSON.stringify(settingsToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Add Remote Torrent_settings.json'; 
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        displayBackupStatus('Settings exported successfully.', 'success');
    });
    importSettingsButton.addEventListener('click', () => {
        const file = importSettingsFile.files[0];
        if (!file) { displayBackupStatus('Please select a file to import.', 'error'); return; }
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedSettings = JSON.parse(event.target.result);
                if (!importedSettings || typeof importedSettings.servers === 'undefined') throw new Error('Invalid settings file structure.');
                if (confirm('This will overwrite your current settings. Are you sure you want to import?')) {
                    const newServers = (importedSettings.servers || []).map(s => ({ ...s, clientType: s.clientType || 'qbittorrent', askForLabelDirOnPage: s.askForLabelDirOnPage || false, forceStart: s.forceStart || false, labelDirectoryMap: s.labelDirectoryMap || '', qbittorrentApiKey: s.qbittorrentApiKey || '' }));
                    let newActiveServerId = importedSettings.activeServerId || null;
                    if (newActiveServerId && !newServers.find(s => s.id === newActiveServerId)) newActiveServerId = newServers.length > 0 ? newServers[0].id : null;
                    if (!newActiveServerId && newServers.length > 0) newActiveServerId = newServers[0].id;
                    const settingsToSave = {
                        servers: newServers, activeServerId: newActiveServerId,
                        advancedAddDialog: importedSettings.advancedAddDialog || importedSettings.showAdvancedAddDialog && 'manual' || 'never',  // Migrate showAdvancedAddDialog -> advancedAddDialog
                        enableUrlBasedServerSelection: importedSettings.enableUrlBasedServerSelection || false,
                        urlToServerMappings: importedSettings.urlToServerMappings || [],
                        catchfrompage: importedSettings.catchfrompage || false, 
                        linksfoundindicator: importedSettings.linksfoundindicator || false, 
                        linkmatches: importedSettings.linkmatches || '', 
                        registerDelay: importedSettings.registerDelay || 0,
                        enableSoundNotifications: importedSettings.enableSoundNotifications || false,
                        forceTorrentDownload: importedSettings.forceTorrentDownload || false,
                        enableServerSpecificContextMenu: importedSettings.enableServerSpecificContextMenu || false,
                        showDownloadDirInContextMenu: importedSettings.showDownloadDirInContextMenu || false,
                        badgeMode: importedSettings.badgeMode || 'links',
                        badgeShowServerHealth: importedSettings.badgeShowServerHealth !== false,
                        autoAddClipboardOnOpen: importedSettings.autoAddClipboardOnOpen || false,
                        rssAutoAddEnabled: importedSettings.rssAutoAddEnabled || false,
                        rssFeeds: Array.isArray(importedSettings.rssFeeds) ? importedSettings.rssFeeds : [],
                        searchProvider: importedSettings.searchProvider || 'none',
                        searchApiUrl: importedSettings.searchApiUrl || '',
                        searchApiKey: importedSettings.searchApiKey || '',
                        qbitSearchPlugins: importedSettings.qbitSearchPlugins || 'enabled',
                        qbitSearchCategory: importedSettings.qbitSearchCategory || 'all',
                        trackerUrlRules: importedSettings.trackerUrlRules || [],
                        linkCatchingPatterns: importedSettings.linkCatchingPatterns || [],
                        contentDebugEnabled: Array.isArray(importedSettings.contentDebugEnabled) && importedSettings.contentDebugEnabled || ['error'],
                        bgDebugEnabled: Array.isArray(importedSettings.bgDebugEnabled) && importedSettings.bgDebugEnabled || ['log', 'warn', 'error'],
                    };
                    chrome.storage.local.set(settingsToSave, () => {
                        displayBackupStatus('Settings imported successfully! Reloading...', 'success');
                        loadSettings(); 
                    });
                }
            } catch (e) { displayBackupStatus(`Error importing settings: ${e.message}`, 'error'); }
        };
        reader.readAsText(file);
        importSettingsFile.value = ''; 
    });

    // --- Event Handlers for Debug/Log ---
    const debugChangeHandlerFactory = (settingName, method) => (event) => {
        globalSettings[settingName] = Array.isArray(globalSettings[settingName]) && globalSettings[settingName] || [];
        const enable = event.target.checked;
        const alreadyEnabled = globalSettings[settingName].includes(method);
        if (enable && !alreadyEnabled) {
            globalSettings[settingName].push(method);
        } else if (!enable && alreadyEnabled) {
            globalSettings[settingName] = globalSettings[settingName].filter(m => m !== method);
        }
        chrome.storage.local.set({ [settingName]: globalSettings[settingName] }, () => { displayFormStatus('Global settings updated.', 'success'); });
    };

    contentDebugEnabled_log.addEventListener('change', debugChangeHandlerFactory('contentDebugEnabled', 'log'));
    contentDebugEnabled_warn.addEventListener('change', debugChangeHandlerFactory('contentDebugEnabled', 'warn'));
    contentDebugEnabled_error.addEventListener('change', debugChangeHandlerFactory('contentDebugEnabled', 'error'));
    contentDebugEnabled_default.addEventListener('click', (e) => {
        e.preventDefault();
        globalSettings.contentDebugEnabled = ['error'];
        chrome.storage.local.set({ contentDebugEnabled: globalSettings.contentDebugEnabled }, () => { displayFormStatus('Global settings updated.', 'success'); });
        renderDebugSettings();
    });

    bgDebugEnabled_log.addEventListener('change', debugChangeHandlerFactory('bgDebugEnabled', 'log'));
    bgDebugEnabled_warn.addEventListener('change', debugChangeHandlerFactory('bgDebugEnabled', 'warn'));
    bgDebugEnabled_error.addEventListener('change', debugChangeHandlerFactory('bgDebugEnabled', 'error'));
    bgDebugEnabled_default.addEventListener('click', (e) => {
        e.preventDefault();
        globalSettings.bgDebugEnabled = ['log', 'warn', 'error'];
        chrome.storage.local.set({ bgDebugEnabled: globalSettings.bgDebugEnabled }, () => { displayFormStatus('Global settings updated.', 'success'); });
        renderDebugSettings();
    });

    // --- Initialization ---
    function loadSettings() {
        if (extensionVersionSpan) {
            const manifest = chrome.runtime.getManifest();
            extensionVersionSpan.textContent = manifest.version;
        }
        chrome.storage.local.get([
            'servers', 'activeServerId', 'showAdvancedAddDialog', 'advancedAddDialog', 'enableUrlBasedServerSelection',
            'urlToServerMappings', 'catchfrompage', 'linksfoundindicator', 'linkCatchingPatterns',
            'registerDelay', 'enableSoundNotifications', 'enableTextNotifications', 'enableReviewPrompts', 'enableCompletionNotifications', 'forceTorrentDownload', 'enableServerSpecificContextMenu', 'showDownloadDirInContextMenu', 'trackerUrlRules', 'contentDebugEnabled', 'bgDebugEnabled',
            'badgeMode', 'badgeShowServerHealth', 'autoAddClipboardOnOpen', 'rssAutoAddEnabled', 'rssFeeds', 'searchProvider', 'searchApiUrl', 'searchApiKey'
        ], (result) => {
            servers = (result.servers || []).map(s => ({ ...s, clientType: s.clientType || 'qbittorrent', url: s.url || s.qbUrl, username: s.username || s.qbUsername, password: s.password || s.qbPassword, rpcPath: s.rpcPath || (s.clientType === 'transmission' ? '/transmission/rpc' : ''), scgiPath: s.scgiPath || '', askForLabelDirOnPage: s.askForLabelDirOnPage || false, qbittorrentSavePath: s.qbittorrentSavePath || '', qbittorrentAuthMode: s.qbittorrentAuthMode || 'cookie', qbittorrentApiKey: s.qbittorrentApiKey || '', forceStart: s.forceStart || false, labelDirectoryMap: s.labelDirectoryMap || '' }));
            activeServerId = result.activeServerId || (servers.length > 0 ? servers[0].id : null);
            globalSettings.advancedAddDialog = (result.advancedAddDialog || result.showAdvancedAddDialog && 'manual' || 'never'); // Migrate showAdvancedAddDialog -> advancedAddDialog
            advancedAddDialogInput.value = globalSettings.advancedAddDialog;
            globalSettings.enableUrlBasedServerSelection = result.enableUrlBasedServerSelection || false;
            enableUrlBasedServerSelectionToggle.checked = globalSettings.enableUrlBasedServerSelection; 
            urlToServerMappings = result.urlToServerMappings || [];
            toggleMappingListVisibility(); 
            globalSettings.catchfrompage = result.catchfrompage || false; 
            catchFromPageToggle.checked = globalSettings.catchfrompage;
            globalSettings.linksfoundindicator = result.linksfoundindicator || false;
            linksFoundIndicatorToggle.checked = globalSettings.linksfoundindicator;
            
            // Load link catching patterns, with migration from old format
            const defaultPatterns = [
                { id: 'default-1', pattern: '([\\\\\\]\\\\[]|\\b|\\.)\\.torrent\\b([^\\-]|$$)' },
                { id: 'default-2', pattern: 'torrents\\.php\\?action=download' },
                { id: 'default-3', pattern: 'download_torrent\\?id=\\d+' }
            ];

            if (result.linkCatchingPatterns && Array.isArray(result.linkCatchingPatterns)) {
                // New format already exists, use it
                linkCatchingPatterns = result.linkCatchingPatterns;
            } else if (result.linkmatches && typeof result.linkmatches === 'string' && result.linkmatches.trim() !== '') {
                // Old format exists, migrate it
                const oldPatterns = result.linkmatches.split('~').map(p => p.trim()).filter(p => p);
                const migratedPatterns = oldPatterns.map(p => ({
                    id: generateLinkPatternId(),
                    pattern: p
                }));
                // Combine defaults with migrated user patterns
                linkCatchingPatterns = [...defaultPatterns, ...migratedPatterns];
                
                // Save the migrated data and remove the old key
                chrome.storage.local.set({ linkCatchingPatterns: linkCatchingPatterns });
                chrome.storage.local.remove('linkmatches');
                displayFormStatus('Custom link patterns migrated to new format.', 'success');

            } else {
                // No patterns exist, start with defaults
                linkCatchingPatterns = defaultPatterns;
            }

            globalSettings.registerDelay = result.registerDelay || 0;
            registerDelayInput.value = globalSettings.registerDelay;
            globalSettings.enableSoundNotifications = result.enableSoundNotifications || false; 
            enableSoundNotificationsToggle.checked = globalSettings.enableSoundNotifications;
            globalSettings.enableTextNotifications = result.enableTextNotifications || false;
            enableTextNotificationsToggle.checked = globalSettings.enableTextNotifications;
            globalSettings.enableReviewPrompts = result.enableReviewPrompts !== false;
            enableReviewPromptsToggle.checked = globalSettings.enableReviewPrompts;
            globalSettings.enableCompletionNotifications = result.enableCompletionNotifications !== false; // Default to true if undefined
            enableCompletionNotificationsToggle.checked = globalSettings.enableCompletionNotifications;
            globalSettings.forceTorrentDownload = result.forceTorrentDownload || false;
            forceTorrentDownloadToggle.checked = globalSettings.forceTorrentDownload;
            globalSettings.enableServerSpecificContextMenu = result.enableServerSpecificContextMenu || false; 
            enableServerSpecificContextMenuToggle.checked = globalSettings.enableServerSpecificContextMenu;
            globalSettings.showDownloadDirInContextMenu = result.showDownloadDirInContextMenu || false;
            showDownloadDirInContextMenuToggle.checked = globalSettings.showDownloadDirInContextMenu;
            globalSettings.badgeMode = result.badgeMode || 'links';
            badgeModeInput.value = globalSettings.badgeMode;
            globalSettings.badgeShowServerHealth = result.badgeShowServerHealth !== false;
            badgeShowServerHealthToggle.checked = globalSettings.badgeShowServerHealth;
            globalSettings.autoAddClipboardOnOpen = result.autoAddClipboardOnOpen || false;
            autoAddClipboardOnOpenToggle.checked = globalSettings.autoAddClipboardOnOpen;
            globalSettings.rssAutoAddEnabled = result.rssAutoAddEnabled || false;
            rssAutoAddEnabledToggle.checked = globalSettings.rssAutoAddEnabled;
            globalSettings.rssFeeds = Array.isArray(result.rssFeeds) ? result.rssFeeds : [];
            renderRssFeedsList();
            globalSettings.searchProvider = result.searchProvider || 'none';
            searchProviderInput.value = globalSettings.searchProvider;
            globalSettings.searchApiUrl = result.searchApiUrl || '';
            searchApiUrlInput.value = globalSettings.searchApiUrl;
            globalSettings.searchApiKey = result.searchApiKey || '';
            searchApiKeyInput.value = globalSettings.searchApiKey;
            globalSettings.qbitSearchPlugins = result.qbitSearchPlugins || 'enabled';
            globalSettings.qbitSearchCategory = result.qbitSearchCategory || 'all';
            updateSearchProviderUi();
            trackerUrlRules = result.trackerUrlRules || [];
            if (activeServerId && !servers.find(s => s.id === activeServerId)) activeServerId = servers.length > 0 ? servers[0].id : null;
            if (!activeServerId && servers.length > 0) activeServerId = servers[0].id;
            globalSettings.contentDebugEnabled = (Array.isArray(result.contentDebugEnabled) ? result.contentDebugEnabled : ['error']);
            globalSettings.bgDebugEnabled = (Array.isArray(result.bgDebugEnabled) ? result.bgDebugEnabled : ['log', 'warn', 'error']);
            renderDebugSettings()
            renderServerList();
            renderUrlMappingsList();
            populateMapToServerSelect();
            renderTrackerUrlRulesList();
            renderLinkCatchingPatternsList();
            populateRssFeedServerSelect();
            renderRssFeedsList();
        });
    }
    
    // --- URL Mapping Functions ---
    function generateMappingId() { 
        return generateLocalId('map');
    }
    function toggleMappingListVisibility() {
        mappingsListContainer.style.display = globalSettings.enableUrlBasedServerSelection ? 'block' : 'none';
        if (!globalSettings.enableUrlBasedServerSelection) hideMappingForm(); 
    }
    function populateMapToServerSelect() {
        mapToServerSelect.innerHTML = '<option value="">-- Select Server --</option>';
        servers.forEach(server => {
            const option = document.createElement('option');
            option.value = server.id;
            option.textContent = server.name;
            mapToServerSelect.appendChild(option);
        });
    }
    function renderUrlMappingsList() {
        urlMappingsListUl.innerHTML = '';
        if (!globalSettings.enableUrlBasedServerSelection || urlToServerMappings.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No URL mapping rules configured (or feature disabled).';
            urlMappingsListUl.appendChild(li);
            return;
        }

        urlToServerMappings.forEach((mapping, index) => {
            const li = document.createElement('li');
            li.className = 'p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center';

            const serverName = servers.find(s => s.id === mapping.serverId)?.name || 'Unknown Server';

            // Info Span
            const infoSpan = document.createElement('span');
            infoSpan.textContent = `${index + 1}. Pattern: `;
            
            const patternSpan = document.createElement('span');
            patternSpan.className = 'pattern font-semibold text-indigo-600 dark:text-indigo-400';
            patternSpan.textContent = mapping.websitePattern;
            infoSpan.appendChild(patternSpan);

            infoSpan.append(' → ');

            const serverNameSpan = document.createElement('span');
            serverNameSpan.className = 'target-server-name font-semibold text-teal-600 dark:text-teal-400';
            serverNameSpan.textContent = serverName;
            infoSpan.appendChild(serverNameSpan);

            // Actions Span
            const actionsSpan = document.createElement('span');
            actionsSpan.className = 'actions flex space-x-2';

            const editButton = document.createElement('button');
            editButton.className = 'edit-mapping-button px-2 py-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-md';
            editButton.dataset.id = mapping.id;
            editButton.textContent = 'Edit';
            actionsSpan.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-mapping-button px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md';
            deleteButton.dataset.id = mapping.id;
            deleteButton.textContent = 'Delete';
            actionsSpan.appendChild(deleteButton);

            if (index > 0) {
                const upButton = document.createElement('button');
                upButton.className = 'move-mapping-up-button px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded-md';
                upButton.dataset.id = mapping.id;
                upButton.title = 'Move Up';
                upButton.innerHTML = '&uarr;';
                actionsSpan.appendChild(upButton);
            }

            if (index < urlToServerMappings.length - 1) {
                const downButton = document.createElement('button');
                downButton.className = 'move-mapping-down-button px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded-md';
                downButton.dataset.id = mapping.id;
                downButton.title = 'Move Down';
                downButton.innerHTML = '&darr;';
                actionsSpan.appendChild(downButton);
            }

            li.appendChild(infoSpan);
            li.appendChild(actionsSpan);
            urlMappingsListUl.appendChild(li);
        });

        document.querySelectorAll('.edit-mapping-button').forEach(b => b.addEventListener('click', handleEditMapping));
        document.querySelectorAll('.delete-mapping-button').forEach(b => b.addEventListener('click', handleDeleteMapping));
        document.querySelectorAll('.move-mapping-up-button').forEach(b => b.addEventListener('click', handleMoveMappingUp));
        document.querySelectorAll('.move-mapping-down-button').forEach(b => b.addEventListener('click', handleMoveMappingDown));
    }
    function showMappingForm(isEditing = false, mapping = null) {
        mappingFormSection.style.display = 'block';
        mappingFormTitle.textContent = isEditing ? 'Edit URL Rule' : 'Add New URL Rule';
        populateMapToServerSelect(); 
        if (isEditing && mapping) {
            mappingIdInput.value = mapping.id;
            websitePatternInput.value = mapping.websitePattern;
            mapToServerSelect.value = mapping.serverId;
        } else {
            mappingIdInput.value = '';
            websitePatternInput.value = '';
            mapToServerSelect.value = '';
        }
        displayMappingFormStatus('', '');
    }
    function hideMappingForm() {
        mappingFormSection.style.display = 'none';
        mappingIdInput.value = '';
        websitePatternInput.value = '';
        mapToServerSelect.value = '';
        displayMappingFormStatus('', '');
    }
    enableUrlBasedServerSelectionToggle.addEventListener('change', () => {
        globalSettings.enableUrlBasedServerSelection = enableUrlBasedServerSelectionToggle.checked;
        chrome.storage.local.set({ enableUrlBasedServerSelection: globalSettings.enableUrlBasedServerSelection }, () => {
            displayFormStatus('Global settings updated.', 'success');
            toggleMappingListVisibility();
            renderUrlMappingsList(); 
        });
    });
    showAddMappingFormButton.addEventListener('click', () => showMappingForm(false));
    cancelMappingEditButton.addEventListener('click', hideMappingForm);
    saveMappingButton.addEventListener('click', () => {
        const id = mappingIdInput.value;
        const websitePattern = websitePatternInput.value.trim();
        const serverId = mapToServerSelect.value;
        if (!websitePattern || !serverId) { displayMappingFormStatus('Website Pattern and Target Server are required.', 'error'); return; }
        
        if (id) { // Editing an existing mapping
            const index = urlToServerMappings.findIndex(m => m.id === id);
            if (index > -1) {
                urlToServerMappings[index].websitePattern = websitePattern;
                urlToServerMappings[index].serverId = serverId;
            }
        } else { // Adding a new mapping
            const mappingData = { 
                id: generateMappingId(),
                websitePattern, 
                serverId 
            };
            urlToServerMappings.push(mappingData);
        }

        chrome.storage.local.set({ urlToServerMappings }, () => {
            displayMappingFormStatus(id ? 'Rule updated!' : 'Rule added!', 'success');
            loadSettings(); 
            setTimeout(hideMappingForm, 1000);
        });
    });
    function handleEditMapping(event) {
        const idToEdit = event.target.dataset.id;
        const mappingToEdit = urlToServerMappings.find(m => m.id === idToEdit);
        if (mappingToEdit) showMappingForm(true, mappingToEdit);
    }
    function handleDeleteMapping(event) {
        const idToDelete = event.target.dataset.id;
        const mappingToDelete = urlToServerMappings.find(m => m.id === idToDelete);
        if (confirm(`Delete rule: "${mappingToDelete?.websitePattern}"?`)) {
            urlToServerMappings = urlToServerMappings.filter(m => m.id !== idToDelete);
            chrome.storage.local.set({ urlToServerMappings }, () => {
                displayMappingFormStatus('Rule deleted.', 'success'); 
                loadSettings();
            });
        }
    }
    function moveMapping(id, direction) { 
        const index = urlToServerMappings.findIndex(m => m.id === id);
        if (index === -1) return;
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= urlToServerMappings.length) return;
        const item = urlToServerMappings.splice(index, 1)[0];
        urlToServerMappings.splice(newIndex, 0, item);
        chrome.storage.local.set({ urlToServerMappings }, () => loadSettings());
    }
    function handleMoveMappingUp(event) { moveMapping(event.target.dataset.id, -1); }
    function handleMoveMappingDown(event) { moveMapping(event.target.dataset.id, 1); }

    function handleOpenWebUi(event) {
        const serverId = event.target.closest('li').querySelector('.edit-button').dataset.id;
        const server = servers.find(s => s.id === serverId);
        if (server && server.url) {
            let webUiUrl = server.url.replace(/\/$/, '');
            if (server.clientType === 'utorrent' && server.utorrentrelativepath) {
                const relpath = server.utorrentrelativepath.replace(/^\/|\/$/g, '');
                webUiUrl += `/${relpath}/`;
            }
            chrome.tabs.create({ url: webUiUrl });
        }
    }

    serverUrlInput.addEventListener('change', (event) => {
        const urlString = event.target.value.trim();
        if (urlString) {
            // Parse credentials from URL if present
            const parsed = parseCredentialsFromUrl(urlString);
            if (parsed.username && parsed.password) {
                serverUrlInput.value = parsed.cleanUrl;
                serverUsernameInput.value = parsed.username;
                serverPasswordInput.value = parsed.password;
                displayFormStatus('Credentials extracted from URL and moved to username/password fields.', 'info');
            }

            // Handle uTorrent/BitTorrent relative path detection
            const clientType = clientTypeSelect.value;
            if (clientType === 'utorrent' || clientType === 'bittorrent') {
                try {
                    const url = new URL(parsed.cleanUrl || urlString);
                    const path = url.pathname;
                    if (path && path !== '/' && path.length > 1) {
                        const relPathInput = document.getElementById('utorrentRelativePath');
                        if (relPathInput && !relPathInput.value) {
                            relPathInput.value = path;
                            serverUrlInput.value = url.origin;
                            displayFormStatus('Auto-detected relative path. Please verify.', 'info');
                        }
                    }
                } catch (e) {
                    // Ignore invalid URL formats during typing
                }
            }
        }
    });

    // --- Tracker URL Rule Functions ---
    function generateTrackerRuleId() {
        return generateLocalId('trackerRule');
    }

    function renderTrackerUrlRulesList() {
        trackerUrlRulesListUl.innerHTML = '';
        if (trackerUrlRules.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No tracker URL rules configured.';
            trackerUrlRulesListUl.appendChild(li);
            return;
        }

        trackerUrlRules.forEach((rule, index) => {
            const li = document.createElement('li');
            li.className = 'p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center';

            // Rule Info Div
            const infoDiv = document.createElement('div');
            
            const ruleSpan = document.createElement('span');
            ruleSpan.textContent = `${index + 1}. Tracker Pattern: `;
            
            const patternStrong = document.createElement('strong');
            patternStrong.className = 'text-indigo-600 dark:text-indigo-400';
            patternStrong.textContent = rule.trackerUrlPattern;
            ruleSpan.appendChild(patternStrong);

            if (rule.label) {
                ruleSpan.append(` → Label: `);
                const labelStrong = document.createElement('strong');
                labelStrong.className = 'text-purple-600 dark:text-purple-400';
                labelStrong.textContent = rule.label;
                ruleSpan.appendChild(labelStrong);
            }

            if (rule.directory) {
                ruleSpan.append(` → Dir: `);
                const dirStrong = document.createElement('strong');
                dirStrong.className = 'text-teal-600 dark:text-teal-400';
                dirStrong.textContent = rule.directory;
                ruleSpan.appendChild(dirStrong);
            }

            infoDiv.appendChild(ruleSpan);

            // Actions Div
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'actions flex space-x-2';

            const editButton = document.createElement('button');
            editButton.className = 'edit-tracker-rule-button px-2 py-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-md';
            editButton.dataset.id = rule.id;
            editButton.textContent = 'Edit';

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-tracker-rule-button px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md';
            deleteButton.dataset.id = rule.id;
            deleteButton.textContent = 'Delete';

            actionsDiv.appendChild(editButton);
actionsDiv.appendChild(deleteButton);

            li.appendChild(infoDiv);
            li.appendChild(actionsDiv);

            trackerUrlRulesListUl.appendChild(li);
        });

        document.querySelectorAll('.edit-tracker-rule-button').forEach(b => b.addEventListener('click', handleEditTrackerRule));
        document.querySelectorAll('.delete-tracker-rule-button').forEach(b => b.addEventListener('click', handleDeleteTrackerRule));
    }

    function showTrackerRuleForm(isEditing = false, rule = null) {
        trackerRuleFormSection.style.display = 'block';
        trackerRuleFormTitle.textContent = isEditing ? 'Edit Tracker Rule' : 'Add New Tracker Rule';
        if (isEditing && rule) {
            trackerRuleIdInput.value = rule.id;
            trackerUrlPatternInput.value = rule.trackerUrlPattern;
            trackerRuleLabelInput.value = rule.label || '';
            trackerRuleDirectoryInput.value = rule.directory || '';
        } else {
            trackerRuleIdInput.value = '';
            trackerUrlPatternInput.value = '';
            trackerRuleLabelInput.value = '';
            trackerRuleDirectoryInput.value = '';
        }
        displayTrackerRuleFormStatus('', '');
    }

    function hideTrackerRuleForm() {
        trackerRuleFormSection.style.display = 'none';
        trackerRuleIdInput.value = '';
        trackerUrlPatternInput.value = '';
        trackerRuleLabelInput.value = '';
        trackerRuleDirectoryInput.value = '';
        displayTrackerRuleFormStatus('', '');
    }

    showAddTrackerRuleFormButton.addEventListener('click', () => showTrackerRuleForm(false));
    cancelTrackerRuleEditButton.addEventListener('click', hideTrackerRuleForm);

    saveTrackerRuleButton.addEventListener('click', () => {
        const id = trackerRuleIdInput.value;
        const trackerUrlPattern = trackerUrlPatternInput.value.trim();
        const label = trackerRuleLabelInput.value.trim();
        const directory = trackerRuleDirectoryInput.value.trim();

        if (!trackerUrlPattern) {
            displayTrackerRuleFormStatus('Tracker URL Pattern is required.', 'error');
            return;
        }
        if (!label && !directory) {
            displayTrackerRuleFormStatus('Either a Label or a Directory (or both) must be specified.', 'error');
            return;
        }

        const ruleData = { 
            id: id || generateTrackerRuleId(),
            trackerUrlPattern,
            label,
            directory
        };

        if (id) {
            const index = trackerUrlRules.findIndex(r => r.id === id);
            if (index > -1) {
                trackerUrlRules[index] = ruleData;
            }
        } else {
            trackerUrlRules.push(ruleData);
        }
        chrome.storage.local.set({ trackerUrlRules }, () => {
            displayTrackerRuleFormStatus(id ? 'Tracker rule updated!' : 'Tracker rule added!', 'success');
            loadSettings(); 
            setTimeout(hideTrackerRuleForm, 1000);
        });
    });

    function handleEditTrackerRule(event) {
        const idToEdit = event.target.dataset.id;
        const ruleToEdit = trackerUrlRules.find(r => r.id === idToEdit);
        if (ruleToEdit) showTrackerRuleForm(true, ruleToEdit);
    }

    function handleDeleteTrackerRule(event) {
        const idToDelete = event.target.dataset.id;
        const ruleToDelete = trackerUrlRules.find(r => r.id === idToDelete);
        if (confirm(`Delete tracker rule for "${ruleToDelete?.trackerUrlPattern}"?`)) {
            trackerUrlRules = trackerUrlRules.filter(r => r.id !== idToDelete);
            chrome.storage.local.set({ trackerUrlRules }, () => {
                displayTrackerRuleFormStatus('Tracker rule deleted.', 'success');
                loadSettings();
            });
        }
    }

    // --- Link Catching Pattern Functions ---
    function generateLinkPatternId() {
        return generateLocalId('linkPattern');
    }

    function displayLinkPatternFormStatus(message, type) {
        linkPatternFormStatusMessageDiv.textContent = message;
        linkPatternFormStatusMessageDiv.className = 'mt-3 text-sm p-3 rounded-md border';
        if (type === 'success') {
            linkPatternFormStatusMessageDiv.classList.add('bg-green-100', 'dark:bg-green-800', 'border-green-500', 'dark:border-green-600', 'text-green-700', 'dark:text-green-200');
        } else if (type === 'error') {
            linkPatternFormStatusMessageDiv.classList.add('bg-red-100', 'dark:bg-red-800', 'border-red-500', 'dark:border-red-600', 'text-red-700', 'dark:text-red-200');
        }
        if (message && (type === 'success' || type === 'error')) {
            setTimeout(() => {
                linkPatternFormStatusMessageDiv.textContent = '';
                linkPatternFormStatusMessageDiv.className = 'mt-3 text-sm';
            }, 5000);
        } else if (!message) {
            linkPatternFormStatusMessageDiv.className = 'mt-3 text-sm';
        }
    }

    function renderLinkCatchingPatternsList() {
        linkCatchingPatternsListUl.innerHTML = '';
        if (linkCatchingPatterns.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No custom link catching patterns configured.';
            linkCatchingPatternsListUl.appendChild(li);
            return;
        }

        linkCatchingPatterns.forEach((pattern, index) => {
            const li = document.createElement('li');
            li.className = 'p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center';

            const infoDiv = document.createElement('div');
            infoDiv.className = 'flex-grow';
            const patternStrong = document.createElement('strong');
            patternStrong.className = 'text-indigo-600 dark:text-indigo-400 font-mono';
            patternStrong.textContent = pattern.pattern;
            infoDiv.appendChild(patternStrong);

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'actions flex space-x-2 flex-shrink-0';

            const editButton = document.createElement('button');
            editButton.className = 'edit-link-pattern-button px-2 py-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-md';
            editButton.dataset.id = pattern.id;
            editButton.textContent = 'Edit';
            actionsDiv.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-link-pattern-button px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md';
            deleteButton.dataset.id = pattern.id;
            deleteButton.textContent = 'Delete';
            actionsDiv.appendChild(deleteButton);

            li.appendChild(infoDiv);
            li.appendChild(actionsDiv);
            linkCatchingPatternsListUl.appendChild(li);
        });

        document.querySelectorAll('.edit-link-pattern-button').forEach(b => b.addEventListener('click', handleEditLinkPattern));
        document.querySelectorAll('.delete-link-pattern-button').forEach(b => b.addEventListener('click', handleDeleteLinkPattern));
    }

    function showLinkPatternForm(isEditing = false, pattern = null) {
        linkPatternFormSection.style.display = 'block';
        linkPatternFormTitle.textContent = isEditing ? 'Edit Pattern' : 'Add New Pattern';
        if (isEditing && pattern) {
            linkPatternIdInput.value = pattern.id;
            linkPatternInput.value = pattern.pattern;
            linkPatternInput.disabled = false;
        } else {
            linkPatternIdInput.value = '';
            linkPatternInput.value = '';
            linkPatternInput.disabled = false;
        }
        displayLinkPatternFormStatus('', '');
    }

    function hideLinkPatternForm() {
        linkPatternFormSection.style.display = 'none';
        linkPatternIdInput.value = '';
        linkPatternInput.value = '';
        displayLinkPatternFormStatus('', '');
    }

    function handleEditLinkPattern(event) {
        const idToEdit = event.target.dataset.id;
        const patternToEdit = linkCatchingPatterns.find(p => p.id === idToEdit);
        if (patternToEdit) showLinkPatternForm(true, patternToEdit);
    }

    function handleDeleteLinkPattern(event) {
        const idToDelete = event.target.dataset.id;
        const patternToDelete = linkCatchingPatterns.find(p => p.id === idToDelete);
        if (patternToDelete) {
            if (confirm(`Delete pattern: "${patternToDelete.pattern}"?`)) {
                linkCatchingPatterns = linkCatchingPatterns.filter(p => p.id !== idToDelete);
                chrome.storage.local.set({ linkCatchingPatterns }, () => {
                    displayLinkPatternFormStatus('Pattern deleted.', 'success');
                    loadSettings();
                });
            }
        }
    }

    showAddLinkPatternFormButton.addEventListener('click', () => showLinkPatternForm(false));
    cancelLinkPatternEditButton.addEventListener('click', hideLinkPatternForm);

    saveLinkPatternButton.addEventListener('click', () => {
        const id = linkPatternIdInput.value;
        const patternStr = linkPatternInput.value.trim();

        if (!patternStr) {
            displayLinkPatternFormStatus('Pattern cannot be empty.', 'error');
            return;
        }
        try {
            new RegExp(patternStr);
        } catch (e) {
            displayLinkPatternFormStatus(`Invalid Regex: ${e.message}`, 'error');
            return;
        }

        const patternData = {
            id: id || generateLinkPatternId(),
            pattern: patternStr
        };
        
        if (id) { // Editing an existing user pattern
            const index = linkCatchingPatterns.findIndex(p => p.id === id);
            if (index > -1) {
                linkCatchingPatterns[index] = patternData;
            }
        } else { // Adding a new pattern
            linkCatchingPatterns.push(patternData);
        }

        chrome.storage.local.set({ linkCatchingPatterns }, () => {
            displayLinkPatternFormStatus(id ? 'Pattern updated!' : 'Pattern added!', 'success');
            loadSettings();
            setTimeout(hideLinkPatternForm, 1000);
        });
    });

    function renderDebugSettings() {
        contentDebugEnabled_log.checked = globalSettings.contentDebugEnabled.includes('log');
        contentDebugEnabled_warn.checked = globalSettings.contentDebugEnabled.includes('warn');
        contentDebugEnabled_error.checked = globalSettings.contentDebugEnabled.includes('error');
        bgDebugEnabled_log.checked = globalSettings.bgDebugEnabled.includes('log');
        bgDebugEnabled_warn.checked = globalSettings.bgDebugEnabled.includes('warn');
        bgDebugEnabled_error.checked = globalSettings.bgDebugEnabled.includes('error');
    }

    loadSettings(); // Initial load
});
