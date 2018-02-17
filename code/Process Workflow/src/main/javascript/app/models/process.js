import { computed } from '@ember/object';
import DS from 'ember-data';
import { UUID } from "../data/data-utils";

/**
 * Model for a process plan. Process plans only differ from scheduled/executed plans
 * in Lewisian relations
 */
export default DS.Model.extend({
    /**
     * Name of the plan.
     */
    name: DS.attr('string'),

    /**
     * Type of process.
     */
    type: DS.attr('string'),

    /**
     * Short description of the plan.
     */
    description: DS.attr('string'),

    /**
     * Additional notes
     */
    notes: DS.attr('string'),

    /**
     * When the plan was created
     */
    created: DS.attr('moment'),

    /**
     * When the plan was last edited
     */
    lastEdited: DS.attr('moment'),

    /**
     * The IRI of the agent that developed this plan
     */
    author: DS.belongsTo('agent'),

    /**
     * Final output of the process
     * todo consider multiple
     */
    output: DS.belongsTo('artifact-spec'),

    /**
     * The IRI of the first step of the plan
     */
    firstStep: DS.belongsTo('sub-process-spec'),

    /**
     * IRIs of first steps of concrete plan runs
     */
    firstConcreteSteps: DS.hasMany('sub-process'),

    uuid: computed('id', function() {
        try {
            let id = this.get('id') || '';
            let matches = id.match(UUID.regex);
            if (matches && matches.length) {
                return matches[0];
            } else {
                return null;
            }
        } catch (e) {
            console.error("error computing uuid:", e);
            return null;
        }
    }),
});
