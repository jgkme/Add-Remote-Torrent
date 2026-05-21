import { debug } from './debug';

const handleMutations = (mutationsList, callback) => {
    const linksToProcess = new Set();

    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            const querySelector = 'a, input, button';
            if (mutation.addedNodes.length > 5 && mutation.target.querySelectorAll) {
                mutation.target.querySelectorAll(querySelector).forEach((el) => linksToProcess.add(el));
            } else {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.matches(querySelector)) {
                            linksToProcess.add(node);
                        }
                        if (node.querySelectorAll) {
                            node.querySelectorAll(querySelector).forEach((el) => linksToProcess.add(el));
                        }
                    }
                });
            }
        } else if (mutation.type === 'attributes' && mutation.target.matches('a, input, button')) {
            linksToProcess.add(mutation.target);
        }
    }

    if (linksToProcess.size > 0) {
        linksToProcess.forEach((link) => callback && callback(link, 'mutation detected'));
    }
};

const LinkMonitor = class {
    constructor(callback) {
        this.callback = callback;
        this._pendingMutations = [];
        this._rafId = null;

        this.observer = new MutationObserver((mutationsList) => {
            this._pendingMutations.push(...mutationsList);
            if (this._rafId != null) {
                return;
            }
            this._rafId = requestAnimationFrame(() => {
                this._rafId = null;
                const batch = this._pendingMutations;
                this._pendingMutations = [];
                if (batch.length > 0) {
                    handleMutations(batch, this.callback);
                }
            });
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['href', 'action'],
        });
    }

    stop() {
        if (this._rafId != null) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        this._pendingMutations = [];
        this.observer.disconnect();
    }
};

export { LinkMonitor };
