import DS from 'ember-data';

export default DS.Model.extend({
    /**
     * The value of the bearer
     */
    value: DS.attr('string'),

    /**
     * Type of the bearer
     */
    type: DS.attr('string'),

    /**
     * The subprocess which created this value
     */
    subProcess: DS.belongsTo('sub-process')
});
