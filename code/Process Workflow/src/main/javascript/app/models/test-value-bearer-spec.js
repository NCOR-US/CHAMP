import DS from 'ember-data';

export default DS.Model.extend({
    /**
     * Name of the field (bearer)
     */
    name: DS.attr('string'),

    /**
     * IRI of the class
     */
    type: DS.attr('string'),

    /**
     * The unit of measure of the test value
     */
    unitOfMeasure: DS.attr('string'),

    /**
     * Amount of values expected
     */
    amount: DS.attr('number'),

    /**
     * Subprocess specifications which include this test value bearer as a test output
     */
    subProcesses: DS.hasMany('sub-process-spec')
});
