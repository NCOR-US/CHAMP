import DS from 'ember-data';
import moment from 'moment';

export default DS.Transform.extend({
    deserialize(value) {
        return moment(value);
    },

    serialize(value) {
        return value ? value.toJSON() : null;
    }
});
