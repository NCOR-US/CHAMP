import EmberObject from '@ember/object';

const toEmberObject = function(data) {
    if (data === null || data === undefined) {
        return data;
    }
    else if (Array.isArray(data)) {
        let arr = [];
        data.forEach(function(thing) {
            arr.pushObject(toEmberObject(thing));
        });
        return arr;
    }
    else if (typeof data === 'object') {
        let o = EmberObject.create();
        Object.keys(data).forEach(function(key) {
            o.set(key, toEmberObject(data[key]));
        });
        return o;
    }
    else {
        return data;
    }
};

const fromEmberObject = function(data) {
    return JSON.parse(JSON.stringify(data));
};

export {
    toEmberObject,
    fromEmberObject
}
