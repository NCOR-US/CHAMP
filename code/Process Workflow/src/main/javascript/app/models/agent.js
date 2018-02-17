import DS from 'ember-data';

/**
 * Model for agents of processes, both abstract and concrete
 */
export default DS.Model.extend({
    /**
     * Display label for the agent
     */
    name: DS.attr('string'),

    /**
     * Username of the agent
     */
    username: DS.attr('string'),

    /**
     * When the user joined
     */
    joined: DS.attr('date'),

    /**
     * Agent role
     */
    role: DS.attr('string'),

    /**
     * Artifacts that this agent has authored
     */
    authorOf: DS.hasMany('artifact'),

    /**
     * Subprocesses that this agent participates in
     */
    agentIn: DS.hasMany('sub-process')
});
