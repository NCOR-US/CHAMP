/* global Math */

const UUID = {
    createV4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            let r = Math.random()*16|0;
            let v = c === 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    },

    regex: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
};

const UriFactory = {
    /**
     * Generate an IRI based on some base and extension.
     *
     * @param base the part of the IRI after the namespace
     * @param ext the part of the IRI after the base
     * @returns {string} the full IRI
     */
    create(base = "IRI-", ext) {
        ext = ext || UUID.createV4();
        return `urn:process-workflow:plans:generated:${base}${ext}`;
    }
};

const ArrayUtils = {
    /**
     * Zip two arrays together, forming an array of tuples
     */
    zip(a, b) {
        assert(Array.isArray(a), "First parameter must be an array");
        assert(Array.isArray(b), "Second parameter must be an array");

        let length = Math.max(a.length, b.length);
        let result = [];
        for (let i = 0; i < length; i++) {
            result.push([a[i], b[i]]);
        }

        return result;
    }
};

const assert = function(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
};

export {
    UUID,
    UriFactory,
    ArrayUtils,
    assert
};
