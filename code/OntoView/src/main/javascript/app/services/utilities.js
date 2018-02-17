import EmberObject from '@ember/object';
import Service from '@ember/service';

// todo move all of this to ontoview/utilities/ember-utils.js
export default Service.extend({
    toEmberObject(data) {
        let service = this;
        if (data === null || data === undefined) {
            return data;
        }
        else if (Array.isArray(data)) {
            let arr = [];
            data.forEach(function(thing) {
                arr.pushObject(service.toEmberObject(thing));
            });
            return arr;
        }
        else if (typeof data === 'object') {
            let o = EmberObject.create({});
            Object.keys(data).forEach(function(key) {
                o.set(key, service.toEmberObject(data[key]));
            });
            return o;
        }
        else {
            return data;
        }
    },

    fromEmberObject(data) {
        return JSON.parse(JSON.stringify(data));
    },
});
