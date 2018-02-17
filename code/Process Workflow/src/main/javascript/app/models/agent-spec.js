import DS from 'ember-data';

/**
 * Model for agent specifications, for use in process plans.
 */
export default DS.Model.extend({
    /**
     * Agent role
     */
    role: DS.attr('string'),

    /**
     * Sub-processes in which agents of the above role would participate
     */
    agentIn: DS.hasMany('sub-process-spec')
});
