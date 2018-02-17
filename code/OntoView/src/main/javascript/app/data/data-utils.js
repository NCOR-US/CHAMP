// todo move all of this to ontoview/utilities/data-utils.js

/**
 * Encode an IRI for use as a path parameter
 */
const encodeIRI = function(iri) {
    return iri.replace(/\//g, '+');
};

/**
 * Decode an IRI for use as a path parameter
 */
const decodeIRI = function(iri) {
    return iri.replace(/\+/g, '/');
};

const UUID = {
    createV4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            let r = Math.random()*16|0;
            let v = c === 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }
};

const assert = function(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
};

const assertExists = function(container, prop, message) {
    let item = container.get(prop);
    if (!item) {
        throw new Error(message);
    }
};

const assertAllExist = function(container, props, message) {
    for (let prop of props) {
        assertExists(container, prop, message);
    }
};

const assertOneExists = function(container, props, message) {
    let pass = false;
    for (let prop of props) {
        if (container.get(prop)) {
            pass = true;
        }
    }
    assert(pass, message);
};

const listToHierarchy = function(list, idAttr = "id", parentAttr = "parent", childrenAttr = "children") {
    let treeList = [];
    let lookup = {};
    list.forEach(function(obj) {
        lookup[obj[idAttr]] = obj;
        obj[childrenAttr] = [];
    });
    list.forEach(function(obj) {
        if (obj[parentAttr] && lookup[obj[parentAttr]]) {
            lookup[obj[parentAttr]][childrenAttr].push(obj);
        } else {
            treeList.push(obj);
        }
    });
    return treeList;
};

export {
    encodeIRI,
    decodeIRI,
    UUID,
    listToHierarchy,
    assert,
    assertExists,
    assertAllExist,
    assertOneExists
};
