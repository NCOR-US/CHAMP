const __detachFromProcess = function(process, step, previous, next, children) {
    let newCurrentStepId = '';

    // if there are children, disconnect from the current step
    if (children.length) {
        children.forEach(child => {
            child.set('parentSubProcess', step.get('parentSubProcess'));
        });

        // attach first child to process or previous, and last child to the next
        let firstChild = children[0];
        if (previous) {
            previous.set('nextSubProcess', firstChild);
            firstChild.set('previousSubProcess', previous);
        } else {
            process.set('firstStep', firstChild);
            firstChild.set('parentPlan', process)
        }

        let lastChild = children[children.length-1];
        if (next) {
            next.set('previousSubProcess', lastChild);
            lastChild.set('nextSubProcess', next);
        }

        // set the current step to the first child
        newCurrentStepId = firstChild.get('id');
    }

    // if there aren't any children, attach previous to next
    else {
        if (next) {
            if (previous) {
                previous.set('nextSubProcess', next);
                next.set('previousSubProcess', previous);
            } else {
                process.set('firstStep', next);
                next.set('parentPlan', process);
            }
            newCurrentStepId = next.get('id');
        }

        else if (previous) {
            newCurrentStepId = previous.get('id');
        }

        else {
            // bad state: if no previous nor next, then there shouldn't have
            // been a "remove step" control
            console.warn("Bad state: shouldn't have been able to remove only step");
        }
    }

    return newCurrentStepId;
};

const detachStep = function(process, step, setNewCurrentStepCallback) {
    // retrieve all involved subprocesses
    let previous;
    let next;
    let children;

    return step  // eslint-disable-line ember/named-functions-in-promises
        .get('previousSubProcess')
        .then(maybePrevious => previous = maybePrevious)
        .then(() => step.get('nextSubProcess'))
        .then(maybeNext => next = maybeNext)
        .then(() => step.get('processParts'))
        .then(processParts => children = processParts)
        .then(() => __detachFromProcess(process, step, previous, next, children))
        .then(newCurrentStepId => setNewCurrentStepCallback(newCurrentStepId))
        .then(() => step.deleteRecord());
};

export {
    detachStep
}