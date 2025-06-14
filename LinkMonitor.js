import { debug } from './debug';

const handleMutations = (mutationsList, callback) => {
    debug.log('linkMonitor: handleMutations', mutationsList.length, 'mutations');
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.tagName === 'A') {
                        // debug.log('linkMonitor: New link added:', node.href);
                        callback && callback(node, 'node added');
                    }
                    node.querySelectorAll?.('a').forEach(a => {
                        // debug.log('linkMonitor: New link added in subtree:', a.href);
                        callback && callback(a, 'node added in subtree');
                    });
                }
            });
        } else if (mutation.type === 'attributes') {
            if (mutation.target.tagName === 'A' && mutation.attributeName === 'href') {
                // debug.log('Link href changed:', mutation.target.href);
                callback && callback(mutation.target, 'node href changed');
            }
        }
    }
};

const LinkMonitor = class {
    constructor(callback) {
        this.callback = callback;
        this.observer = new MutationObserver(mutationsList => {
            handleMutations(mutationsList, this.callback);
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['href']
        });
    }

    stop() {
        this.observer.disconnect();
    }
}

export {
    LinkMonitor
};