import { helper } from '@ember/component/helper';

export function getIndex(params/*, hash*/) {
    if (params.length < 2) {
        console.warn("Must provide two parameters to get-index, you provided " + params.length);
        return null;
    }

    if (!Array.isArray(params[0])) {
        console.warn("Must provide an array as the first parameter to get-index, you provided " + params[0]);
        return null;
    }

    if (typeof(params[1]) !== 'number') {
        console.warn("Must provide a number as the second parameter to get-index, you provided " + params[1]);
        return null;
    }

    return params[0][params[1]];
}

export default helper(getIndex);
