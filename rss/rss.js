/* global chrome */

(function () {
  const rssServerSelect = document.getElementById('rssServerSelect');
  const rssRefreshAllBtn = document.getElementById('rssRefreshAllBtn');
  const rssReloadBtn = document.getElementById('rssReloadBtn');
  const rssStatusBar = document.getElementById('rssStatusBar');
  const rssEmptyState = document.getElementById('rssEmptyState');
  const rssLayout = document.getElementById('rssLayout');
  const rssFeedTree = document.getElementById('rssFeedTree');
  const rssSelectAllFeeds = document.getElementById('rssSelectAllFeeds');
  const rssArticlesTitle = document.getElementById('rssArticlesTitle');
  const rssArticlesBody = document.getElementById('rssArticlesBody');
  const rssArticlesEmpty = document.getElementById('rssArticlesEmpty');
  const rssUnreadOnly = document.getElementById('rssUnreadOnly');
  const rssArticleFilter = document.getElementById('rssArticleFilter');
  const rssRulesList = document.getElementById('rssRulesList');
  const rssRuleForm = document.getElementById('rssRuleForm');
  const rssRuleOriginalName = document.getElementById('rssRuleOriginalName');
  const rssRuleName = document.getElementById('rssRuleName');
  const rssRuleEnabled = document.getElementById('rssRuleEnabled');
  const rssRuleMustContain = document.getElementById('rssRuleMustContain');
  const rssRuleMustNotContain = document.getElementById('rssRuleMustNotContain');
  const rssRuleUseRegex = document.getElementById('rssRuleUseRegex');
  const rssRuleEpisodeFilter = document.getElementById('rssRuleEpisodeFilter');
  const rssRuleSavePath = document.getElementById('rssRuleSavePath');
  const rssRuleCategory = document.getElementById('rssRuleCategory');
  const rssRuleAddPaused = document.getElementById('rssRuleAddPaused');
  const rssRuleFeedsBox = document.getElementById('rssRuleFeedsBox');
  const rssNewRuleBtn = document.getElementById('rssNewRuleBtn');
  const rssDeleteRuleBtn = document.getElementById('rssDeleteRuleBtn');

  let servers = [];
  let viewerData = null;
  /** @type {Set<string>} */
  let selectedFeedPaths = new Set();
  let activeRuleName = null;
  let loading = false;

  function setStatus(message, type = '') {
    rssStatusBar.textContent = message || '';
    rssStatusBar.className = `mb-3 text-sm min-h-[1.25rem] ${type === 'error' ? 'text-red-600 dark:text-red-400' : type === 'success' ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-300'}`;
  }

  function qbitServers() {
    return servers.filter((s) => s.clientType === 'qbittorrent');
  }

  function currentServerId() {
    return rssServerSelect?.value || '';
  }

  function sendMessage(payload) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(payload, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response || { success: false, error: 'No response' });
      });
    });
  }

  function errorMessage(response) {
    const err = response?.error;
    if (typeof err === 'string') return err;
    return err?.userMessage || 'Request failed.';
  }

  function parseArticleDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text ?? '');
    return div.innerHTML;
  }

  function populateServerSelect() {
    const qbit = qbitServers();
    const prev = currentServerId();
    rssServerSelect.innerHTML = '';
    if (!qbit.length) {
      rssEmptyState.classList.remove('hidden');
      rssLayout.classList.add('hidden');
      return;
    }
    rssEmptyState.classList.add('hidden');
    rssLayout.classList.remove('hidden');
    qbit.forEach((server) => {
      const opt = document.createElement('option');
      opt.value = server.id;
      opt.textContent = server.name;
      rssServerSelect.appendChild(opt);
    });
    const stored = sessionStorage.getItem('rssViewerServerId');
    if (prev && qbit.some((s) => s.id === prev)) {
      rssServerSelect.value = prev;
    } else if (stored && qbit.some((s) => s.id === stored)) {
      rssServerSelect.value = stored;
    }
  }

  function renderFeedTree() {
    if (!viewerData?.tree) {
      rssFeedTree.innerHTML = '<p class="p-2 text-xs text-gray-500">No feeds on server.</p>';
      return;
    }

    rssFeedTree.innerHTML = '';
    const root = document.createElement('div');
    root.className = 'p-1';

    function renderNodes(nodes, depth) {
      const frag = document.createDocumentFragment();
      for (const node of nodes) {
        if (node.type === 'folder') {
          const folderLabel = document.createElement('div');
          folderLabel.className = 'rss-tree-folder px-2 py-1 text-[11px] uppercase tracking-wide';
          folderLabel.style.paddingLeft = `${depth * 0.65 + 0.5}rem`;
          folderLabel.textContent = node.name;
          frag.appendChild(folderLabel);
          frag.appendChild(renderNodes(node.children || [], depth + 1));
          continue;
        }
        const row = document.createElement('label');
        row.className = 'rss-tree-item';
        row.style.paddingLeft = `${depth * 0.65 + 0.35}rem`;
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'rss-feed-check rounded shrink-0';
        cb.dataset.path = node.itemPath;
        cb.checked = selectedFeedPaths.has(node.itemPath);
        const label = document.createElement('span');
        label.className = 'truncate flex-1';
        let text = node.name;
        if (node.unreadCount > 0) text += ` (${node.unreadCount})`;
        if (node.isLoading) text += ' …';
        if (node.hasError) text += ' ⚠';
        label.textContent = text;
        label.title = node.itemPath;
        row.appendChild(cb);
        row.appendChild(label);
        frag.appendChild(row);
      }
      return frag;
    }

    root.appendChild(renderNodes(viewerData.tree, 0));
    rssFeedTree.appendChild(root);

    rssFeedTree.querySelectorAll('.rss-feed-check').forEach((cb) => {
      cb.addEventListener('change', () => {
        if (cb.checked) selectedFeedPaths.add(cb.dataset.path);
        else selectedFeedPaths.delete(cb.dataset.path);
        syncSelectAllCheckbox();
        renderArticles();
      });
    });
  }

  function syncSelectAllCheckbox() {
    const checks = rssFeedTree.querySelectorAll('.rss-feed-check');
    if (!checks.length) {
      rssSelectAllFeeds.checked = false;
      return;
    }
    rssSelectAllFeeds.checked = [...checks].every((c) => c.checked);
  }

  function allFeedPaths() {
    return (viewerData?.feeds || []).map((f) => f.itemPath);
  }

  function visibleArticles() {
    if (!viewerData?.feeds) return [];
    const paths = selectedFeedPaths.size ? selectedFeedPaths : new Set(allFeedPaths());
    let articles = [];
    for (const feed of viewerData.feeds) {
      if (!paths.has(feed.itemPath)) continue;
      for (const article of feed.articles) {
        articles.push({ ...article, feedName: feed.title || feed.name });
      }
    }
    if (rssUnreadOnly.checked) {
      articles = articles.filter((a) => !a.isRead);
    }
    const q = rssArticleFilter.value.trim().toLowerCase();
    if (q) {
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.feedName.toLowerCase().includes(q) ||
          (a.downloadUrl && a.downloadUrl.toLowerCase().includes(q))
      );
    }
    articles.sort((a, b) => {
      const da = Date.parse(a.date) || 0;
      const db = Date.parse(b.date) || 0;
      return db - da;
    });
    return articles;
  }

  function renderArticles() {
    const articles = visibleArticles();
    rssArticlesBody.innerHTML = '';
    const totalUnread = articles.filter((a) => !a.isRead).length;
    rssArticlesTitle.textContent = `Articles (${articles.length}${totalUnread ? `, ${totalUnread} unread` : ''})`;

    if (!selectedFeedPaths.size && viewerData?.feeds?.length) {
      rssArticlesEmpty.classList.remove('hidden');
      rssArticlesEmpty.textContent = 'Select one or more feeds to view articles.';
      return;
    }
    if (!articles.length) {
      rssArticlesEmpty.classList.remove('hidden');
      rssArticlesEmpty.textContent = rssUnreadOnly.checked
        ? 'No unread articles for selected feeds.'
        : 'No articles for selected feeds. Try Refresh all in qBittorrent.';
      return;
    }
    rssArticlesEmpty.classList.add('hidden');

    for (const article of articles) {
      const tr = document.createElement('tr');
      tr.className = `rss-article-row${article.isRead ? '' : ' rss-article-row--unread'}`;
      tr.dataset.articleId = article.id;
      tr.dataset.itemPath = article.feedPath;
      tr.dataset.downloadUrl = article.downloadUrl || '';

      const titleTd = document.createElement('td');
      titleTd.className = 'max-w-0';
      const titleSpan = document.createElement('span');
      titleSpan.className = 'block truncate';
      titleSpan.textContent = article.title;
      titleSpan.title = article.title;
      titleTd.appendChild(titleSpan);

      const feedTd = document.createElement('td');
      feedTd.className = 'text-gray-600 dark:text-gray-400 truncate';
      feedTd.textContent = article.feedName;
      feedTd.title = article.feedName;

      const dateTd = document.createElement('td');
      dateTd.className = 'text-gray-500 dark:text-gray-400 whitespace-nowrap tabular-nums';
      dateTd.textContent = parseArticleDate(article.date);

      const statusTd = document.createElement('td');
      statusTd.className = 'text-gray-500 dark:text-gray-400';
      statusTd.textContent = article.isRead ? 'Read' : 'Unread';

      tr.append(titleTd, feedTd, dateTd, statusTd);
      rssArticlesBody.appendChild(tr);
    }
  }

  function renderRulesList() {
    rssRulesList.innerHTML = '';
    const rules = viewerData?.rules || [];
    if (!rules.length) {
      rssRulesList.innerHTML = '<p class="text-xs text-gray-500 p-1">No download rules on server.</p>';
      return;
    }
    for (const rule of rules) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `rss-rule-card w-full text-left${activeRuleName === rule.name ? ' rss-rule-card--active' : ''}`;
      const feedsCount = (rule.affectedFeeds || []).length;
      const nameSpan = document.createElement('span');
      nameSpan.className = 'font-semibold block truncate';
      nameSpan.textContent = rule.name;
      const metaSpan = document.createElement('span');
      metaSpan.className = 'text-gray-500 dark:text-gray-400';
      metaSpan.textContent = `${rule.enabled === false ? 'Disabled' : 'Enabled'} · ${feedsCount} feed(s)`;
      const filterSpan = document.createElement('span');
      filterSpan.className = 'block truncate text-gray-600 dark:text-gray-300 mt-0.5 font-mono text-[10px]';
      filterSpan.textContent = rule.mustContain || '—';
      card.append(nameSpan, metaSpan, filterSpan);
      card.addEventListener('click', () => loadRuleIntoForm(rule));
      rssRulesList.appendChild(card);
    }
  }

  function renderRuleFeedCheckboxes(selectedUrls = []) {
    rssRuleFeedsBox.innerHTML = '';
    const selected = new Set(selectedUrls);
    for (const feed of viewerData?.feeds || []) {
      const label = document.createElement('label');
      label.className = 'flex items-center gap-1.5 text-[11px] truncate';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'rss-rule-feed-cb rounded shrink-0';
      cb.value = feed.url;
      cb.checked = selected.has(feed.url);
      const span = document.createElement('span');
      span.className = 'truncate';
      span.textContent = feed.title || feed.name;
      span.title = feed.url;
      label.appendChild(cb);
      label.appendChild(span);
      rssRuleFeedsBox.appendChild(label);
    }
  }

  function loadRuleIntoForm(rule) {
    activeRuleName = rule?.name || null;
    rssRuleOriginalName.value = rule?.name || '';
    rssRuleName.value = rule?.name || '';
    rssRuleEnabled.checked = rule?.enabled !== false;
    rssRuleMustContain.value = rule?.mustContain || '';
    rssRuleMustNotContain.value = rule?.mustNotContain || '';
    rssRuleUseRegex.checked = !!rule?.useRegex;
    rssRuleEpisodeFilter.value = rule?.episodeFilter || '';
    rssRuleSavePath.value = rule?.savePath || '';
    rssRuleCategory.value = rule?.assignedCategory || '';
    rssRuleAddPaused.checked = !!rule?.addPaused;
    renderRuleFeedCheckboxes(rule?.affectedFeeds || []);
    rssDeleteRuleBtn.classList.toggle('hidden', !rule?.name);
    renderRulesList();
  }

  function newRuleForm() {
    activeRuleName = null;
    rssRuleOriginalName.value = '';
    rssRuleName.value = '';
    rssRuleEnabled.checked = true;
    rssRuleMustContain.value = '';
    rssRuleMustNotContain.value = '';
    rssRuleUseRegex.checked = false;
    rssRuleEpisodeFilter.value = '';
    rssRuleSavePath.value = '';
    rssRuleCategory.value = '';
    rssRuleAddPaused.checked = false;
    renderRuleFeedCheckboxes([]);
    rssDeleteRuleBtn.classList.add('hidden');
    renderRulesList();
    rssRuleName.focus();
  }

  function collectRuleDef() {
    const affectedFeeds = [...rssRuleFeedsBox.querySelectorAll('.rss-rule-feed-cb:checked')].map(
      (cb) => cb.value
    );
    return {
      enabled: rssRuleEnabled.checked,
      mustContain: rssRuleMustContain.value.trim(),
      mustNotContain: rssRuleMustNotContain.value.trim(),
      useRegex: rssRuleUseRegex.checked,
      episodeFilter: rssRuleEpisodeFilter.value.trim(),
      smartFilter: false,
      previouslyMatchedEpisodes: [],
      affectedFeeds,
      ignoreDays: 0,
      lastMatch: '',
      addPaused: rssRuleAddPaused.checked,
      assignedCategory: rssRuleCategory.value.trim(),
      savePath: rssRuleSavePath.value.trim(),
    };
  }

  async function loadViewerData() {
    const serverId = currentServerId();
    if (!serverId) return;
    if (loading) return;
    loading = true;
    setStatus('Loading RSS from qBittorrent…');
    sessionStorage.setItem('rssViewerServerId', serverId);

    const response = await sendMessage({ action: 'getQbitRssViewerData', serverId });
    loading = false;
    if (!response?.success) {
      setStatus(errorMessage(response), 'error');
      return;
    }

    viewerData = response;
    if (!selectedFeedPaths.size) {
      selectedFeedPaths = new Set(allFeedPaths());
    } else {
      const valid = new Set(allFeedPaths());
      selectedFeedPaths = new Set([...selectedFeedPaths].filter((p) => valid.has(p)));
      if (!selectedFeedPaths.size) selectedFeedPaths = valid;
    }
    renderFeedTree();
    syncSelectAllCheckbox();
    renderArticles();
    renderRulesList();
    if (!activeRuleName && viewerData.rules?.length) {
      loadRuleIntoForm(viewerData.rules[0]);
    } else {
      renderRuleFeedCheckboxes();
    }
    setStatus(
      `Loaded ${viewerData.feeds?.length || 0} feed(s), ${viewerData.articleCount || 0} article(s), ${viewerData.rules?.length || 0} rule(s).`,
      'success'
    );
  }

  async function refreshAllFeeds() {
    const serverId = currentServerId();
    if (!serverId || !viewerData?.feeds?.length) return;
    setStatus('Refreshing feeds on qBittorrent…');
    for (const feed of viewerData.feeds) {
      await sendMessage({
        action: 'refreshQbitRssItem',
        serverId,
        itemPath: feed.itemPath,
      });
    }
    await loadViewerData();
    setStatus('Feeds refreshed.', 'success');
  }

  async function addArticleTorrent(article) {
    const url = article.downloadUrl;
    if (!url) {
      setStatus('This article has no torrent or magnet link.', 'error');
      return;
    }
    setStatus(`Adding: ${article.title.slice(0, 60)}…`);
    const response = await sendMessage({
      action: 'addTorrentFromRss',
      serverId: currentServerId(),
      url,
      itemPath: article.feedPath,
      articleId: article.id,
    });
    if (!response?.success) {
      setStatus(errorMessage(response), 'error');
      return;
    }
    setStatus(`Added torrent: ${article.title}`, 'success');
    await loadViewerData();
  }

  async function markArticleRead(article) {
    await sendMessage({
      action: 'markQbitRssRead',
      serverId: currentServerId(),
      itemPath: article.feedPath,
      articleId: article.id,
    });
    article.isRead = true;
    renderArticles();
    renderFeedTree();
  }

  rssServerSelect?.addEventListener('change', () => {
    selectedFeedPaths = new Set();
    activeRuleName = null;
    loadViewerData();
  });

  rssReloadBtn?.addEventListener('click', () => loadViewerData());
  rssRefreshAllBtn?.addEventListener('click', () => refreshAllFeeds());

  rssSelectAllFeeds?.addEventListener('change', () => {
    const checks = rssFeedTree.querySelectorAll('.rss-feed-check');
    if (rssSelectAllFeeds.checked) {
      checks.forEach((cb) => {
        cb.checked = true;
        selectedFeedPaths.add(cb.dataset.path);
      });
    } else {
      checks.forEach((cb) => {
        cb.checked = false;
      });
      selectedFeedPaths.clear();
    }
    renderArticles();
  });

  rssUnreadOnly?.addEventListener('change', renderArticles);
  rssArticleFilter?.addEventListener('input', renderArticles);

  rssArticlesBody?.addEventListener('dblclick', (event) => {
    const row = event.target.closest('.rss-article-row');
    if (!row) return;
    const article = visibleArticles().find(
      (a) => a.id === row.dataset.articleId && a.feedPath === row.dataset.itemPath
    );
    if (article) addArticleTorrent(article);
  });

  rssArticlesBody?.addEventListener('click', (event) => {
    const row = event.target.closest('.rss-article-row');
    if (!row) return;
    const article = visibleArticles().find(
      (a) => a.id === row.dataset.articleId && a.feedPath === row.dataset.itemPath
    );
    if (article && !article.isRead) markArticleRead(article);
  });

  rssNewRuleBtn?.addEventListener('click', newRuleForm);

  rssRuleForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = rssRuleName.value.trim();
    if (!name) {
      setStatus('Rule name is required.', 'error');
      return;
    }
    const ruleDef = collectRuleDef();
    const response = await sendMessage({
      action: 'setQbitRssRule',
      serverId: currentServerId(),
      ruleName: name,
      ruleDef,
    });
    if (!response?.success) {
      setStatus(errorMessage(response), 'error');
      return;
    }
    const oldName = rssRuleOriginalName.value.trim();
    if (oldName && oldName !== name) {
      await sendMessage({
        action: 'removeQbitRssRule',
        serverId: currentServerId(),
        ruleName: oldName,
      });
    }
    setStatus(`Rule “${name}” saved on qBittorrent.`, 'success');
    activeRuleName = name;
    await loadViewerData();
    const saved = viewerData?.rules?.find((r) => r.name === name);
    if (saved) loadRuleIntoForm(saved);
  });

  rssDeleteRuleBtn?.addEventListener('click', async () => {
    const name = rssRuleOriginalName.value.trim() || rssRuleName.value.trim();
    if (!name || !confirm(`Delete download rule “${name}” on qBittorrent?`)) return;
    const response = await sendMessage({
      action: 'removeQbitRssRule',
      serverId: currentServerId(),
      ruleName: name,
    });
    if (!response?.success) {
      setStatus(errorMessage(response), 'error');
      return;
    }
    setStatus(`Rule “${name}” removed.`, 'success');
    newRuleForm();
    await loadViewerData();
  });

  async function init() {
    const result = await chrome.storage.local.get(['servers', 'activeServerId']);
    servers = result.servers || [];
    populateServerSelect();
    if (!qbitServers().length) {
      setStatus('Configure a qBittorrent server in Options first.');
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const paramServer = params.get('serverId');
    if (paramServer && qbitServers().some((s) => s.id === paramServer)) {
      rssServerSelect.value = paramServer;
    } else if (result.activeServerId && qbitServers().some((s) => s.id === result.activeServerId)) {
      rssServerSelect.value = result.activeServerId;
    }
    await loadViewerData();
  }

  init();
})();
