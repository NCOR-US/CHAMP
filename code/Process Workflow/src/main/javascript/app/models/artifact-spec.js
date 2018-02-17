import DS from 'ember-data';

/**
 * Model for planned sub-process inputs and outputs.
 */
export default DS.Model.extend({
    /**
     * Display label for the artifact
     */
    name: DS.attr('string'),

    /**
     * Type of artifact
     */
    type: DS.attr('string'),

    /**
     * Category of artifact. e.g. tool, material, document.
     */
    category: DS.attr('string'),

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
    inputOf: DS.hasMany('sub-process-spec', { inverse: 'inputs' }),


    /**
     * Subprocesses that this artifact is an output of
     */
    outputOf: DS.hasMany('sub-process-spec', { inverse: 'outputs' })
});
