import DS from 'ember-data';

export default DS.JSONAPISerializer.extend({
    // leave relationship keys as-is instead of expecting dasherized names
    keyForRelationship(key) {
        return key;
    },

    keyForAttribute(key) {
        return key;
    }
});
