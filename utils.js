/** Local-only record IDs (server profiles, rules, feeds). Not used for secrets or auth. */
export function generateLocalId(prefix = 'id') {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    return `${prefix}-${Date.now()}-${bytes[0].toString(36)}`;
}

export const debounce = (fn, delay = 100) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
};
