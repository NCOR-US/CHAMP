import DS from 'ember-data';

/**
 * Model for sub-process specifications, for use in process plans.
 */
export default DS.Model.extend({
    /**
     * Name of the sub-process.
     */
    name: DS.attr('string'),

    /**
     * Short description of the sub-process.
     */
    description: DS.attr('string'),

    /**
     * Additional notes
     */
    notes: DS.attr('string'),

    /**
     * Type of the sub-process.
     */
    type: DS.attr('string'),

    /**
     * The parent process plan which prescribes this subprocess (only valid for first steps)
     */
    parentPlan: DS.belongsTo('process'),

    /**
     * The IRI of the subprocess that this one precedes/follows.
     */
    previousSubProcess: DS.belongsTo('sub-process-spec', { inverse: 'nextSubProcess' }),
    nextSubProcess: DS.belongsTo('sub-process-spec', { inverse: 'previousSubProcess' }),

    /**
     * Array of input IRI
     */
    inputs: DS.hasMany('artifact-spec', { inverse: 'inputOf' }),

    /**
     * Array of output IRI
     */
    outputs: DS.hasMany('artifact-spec', { inverse: 'outputOf' }),

    /**
     * Array of test value bearer IRI
     */
    testValues: DS.hasMany('test-value-bearer-spec'),

    /**
     * Array of agent IRI
     */
    agents: DS.hasMany('agent-spec'),

    /**
     * Array of IRIs for process steps/subtasks
     */
    processParts: DS.hasMany('sub-process-spec', { inverse: 'parentSubProcess' }),

    /**
     * IRI of the parent sub-process
     */
    parentSubProcess: DS.belongsTo('sub-process-spec', { inverse: 'processParts' })
});
