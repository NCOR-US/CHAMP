import DS from 'ember-data';

/**
 * Model for a process existing within a process plan. Typically is a subclass of Act if a
 * manual process, and (todo) if it is automated.
 */
export default DS.Model.extend({
    /**
     * Name of the sub-process.
     */
    name: DS.attr('string'),

    /**
     * Type of the sub-process. todo enum?
     */
    type: DS.attr('string'),

    /**
     * The parent process plan which prescribes this subprocess (only valid for first steps)
     */
    parentPlan: DS.belongsTo('process'),

    /**
     * The IRI of the subprocess that this one precedes/follows.
     */
    previousSubProcess: DS.belongsTo('sub-process', { inverse: 'nextSubProcess' }),
    nextSubProcess: DS.belongsTo('sub-process', { inverse: 'previousSubProcess' }),

    /**
     * Array of input IRI
     */
    inputs: DS.hasMany('artifact', { inverse: 'inputOf' }),

    /**
     * Array of output IRI
     */
    outputs: DS.hasMany('artifact', { inverse: 'outputOf' }),

    /**
     * Array of test value bearer IRI
     */
    testValues: DS.hasMany('test-value-bearer'),

    /**
     * Array of agent IRI. todo determine if this needs to change according to "automated agents" (i.e. causal factors)
     */
    agents: DS.hasMany('agent'),

    /**
     * Array of IRIs for process steps
     */
    processParts: DS.hasMany('sub-process', { inverse: 'parentSubProcess' }),

    /**
     * IRI of the parent sub-process
     */
    parentSubProcess: DS.belongsTo('sub-process', { inverse: 'processParts' })
});
