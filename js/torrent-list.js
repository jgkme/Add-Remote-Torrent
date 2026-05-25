/**
 * Sort/filter torrent rows for popup and dashboard lists.
 */
(function initTorrentList(global) {
  const MODES = {
    recent: { label: 'Recently added', defaultLimit: 15 },
    active: { label: 'Active now', defaultLimit: 20 },
    all: { label: 'All torrents', defaultLimit: 50 },
  };

  const INACTIVE_STATES = new Set([
    'stoppeddl',
    'stoppedup',
    'pauseddl',
    'pausedup',
    'error',
    'missingfiles',
  ]);

  const ACTIVE_STATES = new Set([
    'downloading',
    'uploading',
    'metadl',
    'stalleddl',
    'stalledup',
    'forceddl',
    'forcedup',
    'checkingdl',
    'checkingup',
    'checkingresumedata',
    'queueddl',
    'queuedup',
  ]);

  function normalizeState(state) {
    return String(state || '')
      .trim()
      .toLowerCase();
  }

  function torrentAddedOn(torrent) {
    const raw = torrent?.added_on ?? torrent?.addedOn ?? torrent?.time_added;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  function isActiveTorrent(torrent) {
    const s = normalizeState(torrent?.state);
    if (INACTIVE_STATES.has(s)) return false;
    if (ACTIVE_STATES.has(s)) return true;
    const dl = Number(torrent?.dlspeed) || 0;
    const ul = Number(torrent?.upspeed) || 0;
    if (dl > 0 || ul > 0) return true;
    const progress = Number(torrent?.progress) || 0;
    if (progress >= 1 && s === 'uploading') return true;
    return false;
  }

  function sortByRecent(torrents) {
    return [...torrents].sort((a, b) => {
      const diff = torrentAddedOn(b) - torrentAddedOn(a);
      if (diff !== 0) return diff;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
  }

  /**
   * @param {object[]} torrents
   * @param {'recent'|'active'|'all'} mode
   * @param {number} [limit]
   */
  function applyTorrentListMode(torrents, mode, limit) {
    const list = Array.isArray(torrents) ? torrents : [];
    const modeKey = MODES[mode] ? mode : 'recent';
    const cap = Number.isFinite(limit) && limit > 0 ? limit : MODES[modeKey].defaultLimit;

    let filtered = list;
    if (modeKey === 'active') {
      filtered = list.filter(isActiveTorrent);
    }

    const sorted = sortByRecent(filtered);
    const trimmed = sorted.slice(0, cap);
    return {
      torrents: trimmed,
      total: filtered.length,
      mode: modeKey,
      limit: cap,
    };
  }

  global.TorrentList = {
    MODES,
    applyTorrentListMode,
    isActiveTorrent,
    sortByRecent,
    torrentAddedOn,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
