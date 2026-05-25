/**
 * Shared torrent list UI helpers (popup + dashboard).
 */
(function initTorrentUi(global) {
  function humanizeTorrentState(state, progress) {
    const s = String(state || '')
      .trim()
      .toLowerCase();
    const pct = Math.round(Math.max(0, Math.min(1, Number(progress) || 0)) * 100);

    const labels = {
      downloading: 'Downloading',
      uploading: 'Seeding',
      stalleddl: 'Stalled (download)',
      stalledup: 'Stalled (upload)',
      stoppeddl: 'Stopped',
      stoppedup: 'Finished',
      pauseddl: 'Paused',
      pausedup: 'Complete (paused)',
      queueddl: 'Queued',
      queuedup: 'Queued',
      checkingdl: 'Checking files',
      checkingup: 'Checking files',
      checkingresumedata: 'Checking resume data',
      metadl: 'Fetching metadata',
      forceddl: 'Forced download',
      forcedup: 'Forced upload',
      error: 'Error',
      missingfiles: 'Missing files',
      moving: 'Moving',
    };

    if (labels[s]) return labels[s];
    if (pct >= 100) return 'Complete';
    if (pct > 0) return `In progress (${pct}%)`;
    if (s) return s.replace(/([a-z])([A-Z])/g, '$1 $2');
    return 'Unknown';
  }

  function statusBadgeClasses(state, progress) {
    const s = String(state || '')
      .trim()
      .toLowerCase();
    const pct = Number(progress) || 0;

    if (s === 'error' || s === 'missingfiles') {
      return 'bg-red-600 text-white';
    }
    if (
      s === 'uploading' ||
      s === 'forcedup' ||
      s === 'stoppedup' ||
      s === 'pausedup' ||
      s === 'checkingup' ||
      pct >= 1
    ) {
      return 'bg-emerald-600 text-white';
    }
    if (
      s.includes('stop') ||
      s.includes('pause') ||
      s === 'stoppeddl' ||
      s === 'pauseddl'
    ) {
      return 'bg-amber-600 text-white';
    }
    if (s.includes('stall')) {
      return 'bg-orange-500 text-white';
    }
    if (s.includes('download') || s === 'metadl' || s === 'forceddl' || s === 'checkingdl') {
      return 'bg-blue-600 text-white';
    }
    return 'bg-gray-500 text-white';
  }

  function torrentActionVisibility(torrent) {
    const s = String(torrent?.state || '')
      .trim()
      .toLowerCase();
    const progress = Number(torrent?.progress) || 0;
    const complete =
      progress >= 1 ||
      s === 'uploading' ||
      s === 'stoppedup' ||
      s === 'pausedup' ||
      s === 'forcedup' ||
      s === 'checkingup';

    const stoppedOrPaused =
      s.includes('stop') ||
      s.includes('pause') ||
      s === 'stoppeddl' ||
      s === 'stoppedup' ||
      s === 'pauseddl' ||
      s === 'pausedup';

    const activeTransfer =
      s === 'downloading' ||
      s === 'uploading' ||
      s === 'forceddl' ||
      s === 'forcedup' ||
      s === 'stalleddl' ||
      s === 'stalledup' ||
      s === 'metadl' ||
      s === 'checkingdl' ||
      s === 'checkingup';

    return {
      showPause: activeTransfer && !complete && !stoppedOrPaused,
      showResume: stoppedOrPaused || s.includes('stall'),
      showDelete: true,
    };
  }

  function formatEta(seconds) {
    const eta = Number(seconds);
    if (!Number.isFinite(eta) || eta <= 0 || eta >= 8640000) return '';
    if (eta < 60) return `${eta}s left`;
    if (eta < 3600) return `${Math.round(eta / 60)}m left`;
    if (eta < 86400) return `${Math.round(eta / 3600)}h left`;
    return `${Math.round(eta / 86400)}d left`;
  }

  function formatSpeedLine(torrent, formatBytes) {
    const dl = formatBytes(torrent?.dlspeed);
    const ul = formatBytes(torrent?.upspeed);
    const eta = formatEta(torrent?.eta);
    const parts = [`DL ${dl}/s`, `UL ${ul}/s`];
    if (eta) parts.push(eta);
    return parts.join(' · ');
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

  function renderTorrentCardHtml(torrent, opts) {
    const { formatBytes, escapeHtml, serverId = '' } = opts;
    const progressPct = Math.max(0, Math.min(100, Math.round((torrent.progress || 0) * 100)));
    const statusLabel = humanizeTorrentState(torrent.state, torrent.progress);
    const badgeClass = statusBadgeClasses(torrent.state, torrent.progress);
    const actions = torrentActionVisibility(torrent);
    const serverAttr = serverId ? ` data-server-id="${escapeHtml(serverId)}"` : '';

    const pauseBtn = actions.showPause
      ? `<button type="button" data-action="pause" data-hash="${encodeDataAttr(torrent.hash)}"${serverAttr} class="torrent-action-btn px-2 py-1 text-[11px] bg-amber-500 hover:bg-amber-600 text-white rounded min-h-8">Pause</button>`
      : '';
    const resumeBtn = actions.showResume
      ? `<button type="button" data-action="resume" data-hash="${encodeDataAttr(torrent.hash)}"${serverAttr} class="torrent-action-btn px-2 py-1 text-[11px] bg-green-600 hover:bg-green-700 text-white rounded min-h-8">Resume</button>`
      : '';
    const deleteBtn = actions.showDelete
      ? `<button type="button" data-action="delete" data-hash="${encodeDataAttr(torrent.hash)}"${serverAttr} class="torrent-action-btn px-2 py-1 text-[11px] bg-red-600 hover:bg-red-700 text-white rounded min-h-8">Delete</button>`
      : '';

    return `
      <div class="torrent-card rounded-md border border-gray-200 dark:border-gray-600 p-2.5 bg-white/60 dark:bg-gray-800/80">
        <div class="flex items-start justify-between gap-2 mb-1">
          <p class="font-medium text-gray-800 dark:text-gray-100 truncate flex-1 min-w-0 text-sm" title="${escapeHtml(torrent.name)}">${escapeHtml(torrent.name)}</p>
          <span class="shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full ${badgeClass}">${escapeHtml(statusLabel)}</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-600 rounded h-2 mb-1.5" role="progressbar" aria-valuenow="${progressPct}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(statusLabel)}">
          <div class="bg-blue-500 h-2 rounded transition-[width] duration-300" style="width: ${progressPct}%"></div>
        </div>
        <p class="text-[10px] text-gray-600 dark:text-gray-300 tabular-nums">${progressPct}% · ${escapeHtml(formatSpeedLine(torrent, formatBytes))}</p>
        <div class="mt-2 flex flex-wrap gap-2">${pauseBtn}${resumeBtn}${deleteBtn}</div>
      </div>
    `;
  }

  function deleteTorrentConfirmMessage(server) {
    if (server?.deleteTorrentWithFiles) {
      return 'Delete this torrent and its downloaded files from the client?';
    }
    return 'Remove this torrent from the client? Downloaded files will be kept on disk.';
  }

  global.TorrentUI = {
    deleteTorrentConfirmMessage,
    humanizeTorrentState,
    statusBadgeClasses,
    torrentActionVisibility,
    formatEta,
    formatSpeedLine,
    encodeDataAttr,
    decodeDataAttr,
    renderTorrentCardHtml,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
