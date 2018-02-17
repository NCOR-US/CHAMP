import Route from '@ember/routing/route';
import RSVP from 'rsvp';

export default Route.extend({
    model(params) {
        let route = this;
        // peek so we don't have to manage that query
        let recordName = params.name;
        return new RSVP.Promise((resolve, reject) => {
            let records = route.get('store').peekAll('process');
            let matched = records.toArray()
                .filter((record) => record.get('name') === recordName);

            if (matched.length === 0) {
                console.log("matched length is 0");
                reject(`No record with name = ${recordName}`);
            } else {
                if (matched.length > 1) {
                    console.warn(`Name "${recordName}" matched ${matched.length} records, expected one`);
                }

                let model = matched.get(0);
                console.log("resolved with model:", model);

                // todo resolve steps
                model.set("steps", []);

                resolve(model);
            }
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
            let process = route.modelFor('processes.edit');

            if ((process.currentState.isNew || process.currentState.isDirty)
                && confirm("Are you sure you want to leave? Any unsaved changes will be discarded.")) {
                // todo reset all related records

                route.resetRecord(process);
            }
        }
    }
});
