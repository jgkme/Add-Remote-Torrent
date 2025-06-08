
const handleMutations = (mutationsList, callback) => {
    console.log('linkMonitor: handleMutations', mutationsList.length, 'mutations');
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.tagName === 'A') {
                        // console.log('linkMonitor: New link added:', node.href);
                        callback && callback(node, 'added');
                    }
                    node.querySelectorAll?.('a').forEach(a => {
                        // console.log('linkMonitor: New link added in subtree:', a.href);
                        callback && callback(a, 'added');
                    });
                }
            });
        } else if (mutation.type === 'attributes') {
            if (mutation.target.tagName === 'A' && mutation.attributeName === 'href') {
                // console.log('Link href changed:', mutation.target.href);
                callback && callback(mutation.target, 'changed');
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