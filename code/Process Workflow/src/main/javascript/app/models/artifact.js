import DS from 'ember-data';

/**
 * Model for sub-process inputs and outputs.
 */
export default DS.Model.extend({
    /**
     * Display label for the artifact
     */
    name: DS.attr('string'),

    /**
     * Type of artifact (probably just the local name of the class)
     */
    type: DS.attr('string'),

    /**
     * Amount of the artifact, dependent on unit of measurement
     */
    amount: DS.attr('number'),

    /**
     * Unit of measurement for the amount
     */
    unitOfMeasure: DS.attr('string'),

    /**
     * Subprocesses that this artifact is an input of
     */
    inputOf: DS.hasMany('sub-process', { inverse: 'inputs' }),


    /**
     * Subprocesses that this artifact is an output of
     */
    outputOf: DS.hasMany('sub-process', { inverse: 'outputs' })
});
