import Route from '@ember/routing/route';
import moment from 'moment';
import { UriFactory } from 'process-workflow/data/data-utils';

export default Route.extend({
    model() {
        let store = this.get('store');

        let now = moment();
        return store.createRecord('process', {
            id: UriFactory.create("Process-"),
            name: '',
            description: '',
            type: '',
            created: now,
            lastEdited: now
        });
    },

    resetRecord(record) {
        let store = this.get('store');

        // if is uncommitted, unload it
        if (record.currentState.isNew) {
            store.unloadRecord(record);
        }

        // if it is dirty, roll it back
        else if (record.currentState.isDirty) {
            record.rollbackAttributes();
        }
    },

    // eslint-disable-next-line ember/order-in-routes
    actions: {
        willTransition(/*transition*/) {
            let route = this;
            let process = route.modelFor('processes.new');

            if ((process.currentState.isNew || process.currentState.isDirty)
                && confirm("Are you sure you want to leave? Any unsaved changes will be discarded.")) {
                // todo reset all related records

                route.resetRecord(process);
            }
        }
    }
});
