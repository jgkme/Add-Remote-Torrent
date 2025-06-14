// Exports "debug" which binds all common console log methods + setEnabled() to switch on/off console output

const disabledLoggers = {
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {}
}

// Use "window.console" if exists, in background there's no "window" so try to use "global.console"...
const wnd = (typeof window !== 'undefined' && window) || (typeof global !== 'undefined' && global) || { console: { ...disabledLoggers } };

const enabledLoggers = {
    // Bind log methods to the global console object (preserves line numbers when logging)
    log: wnd.console.log.bind(wnd.console),
    error: wnd.console.error.bind(wnd.console),
    info: wnd.console.info.bind(wnd.console),
    warn: wnd.console.warn.bind(wnd.console)
}

const setEnabled = (enabled) => {
    // Takes a boolean (switch all output on/off), or an array of methods to enable (e.g. ['log', 'info'])
    Object.keys(disabledLoggers).forEach(method => {
        const methodEnabled = (Array.isArray(enabled) ? enabled.includes(method) : (typeof enabled === 'boolean' ? enabled : false));
        // We need to reassign each method in wnd.debug (because it's exported)
        debug[method] = (methodEnabled ? enabledLoggers[method] : disabledLoggers[method]);
    });
};

// Add to global scope
export const debug = {
    ...disabledLoggers,
    setEnabled
};
