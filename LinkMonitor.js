import { debug } from './debug';

const handleMutations = (mutationsList, callback) => {
    // Use a Set to avoid processing the same link multiple times per mutation batch
    const linksToProcess = new Set();

    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            // If a large number of nodes are added, it's likely a dynamic content load.
            // Re-scanning the parent is more reliable than iterating every single node.
            if (mutation.addedNodes.length > 5 && mutation.target.querySelectorAll) {
                mutation.target.querySelectorAll('a').forEach(link => linksToProcess.add(link));
            } else {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'A') {
                            linksToProcess.add(node);
                        }
                        if (node.querySelectorAll) {
                            node.querySelectorAll('a').forEach(link => linksToProcess.add(link));
                        }
                    }
                });
            }
        } else if (mutation.type === 'attributes' && mutation.target.tagName === 'A') {
            linksToProcess.add(mutation.target);
        }
    }

    if (linksToProcess.size > 0) {
        // debug.log(`LinkMonitor: Processing ${linksToProcess.size} unique links from mutations.`);
        linksToProcess.forEach(link => callback && callback(link, 'mutation detected'));
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
