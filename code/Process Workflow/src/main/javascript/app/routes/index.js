import { later } from '@ember/runloop';
import Route from '@ember/routing/route';
import RSVP from 'rsvp';

export default Route.extend({
    model() {
        return this.getModelPromise();
    },

    getModelPromise() {
        let store = this.get('store');

        // might want to lazy load. peek in other places for now
        return RSVP.hashSettled({
            // concrete
            agents: store.findAll('agent'),
            artifacts: store.findAll('artifact'),
            testValues: store.findAll('test-value-bearer'),
            subProcesses: store.findAll('sub-process'),
            processes: store.findAll('process'),

            // lewisian
            agentSpecs: store.findAll('agent-spec'),
            artifactSpecs: store.findAll('artifact-spec'),
            testValueSpecs: store.findAll('test-value-bearer-spec'),
            subProcessSpecs: store.findAll('sub-process-spec')
        });
    },

    deleteAll(type) {
        return this.get('store')
            .findAll(type, { backgroundReload: false })
            .then((data) => RSVP.all(data.map(record => record.destroyRecord())));
    },

    // eslint-disable-next-line ember/order-in-routes
    actions: {
        reload() {
            let route = this;
            let controller = route.get('controller');
            controller.set('isReloading', true);

            // eslint-disable-next-line ember/named-functions-in-promises
            route.refresh().then(() => {
                controller.set('reloadSuccess', true);
                later(() => { controller.set('reloadSuccess') }, 2000);
            }).catch((e) => {
                alert("Couldn't reload. See log for details.");
                console.error("Couldn't reload:", e);
            }).finally(() => {
                controller.set('isReloading', false);
            });
        },

        deleteAllSpecs() {
            let controller = this.get('controller');
            controller.set('isCurrentlyDeletingSpecs', true);
            let promises = [
                this.deleteAll('process'), // probably shouldn't include this here
                this.deleteAll('agent-spec'),
                this.deleteAll('artifact-spec'),
                this.deleteAll('test-value-bearer-spec'),
                this.deleteAll('sub-process-spec')
            ];

            // eslint-disable-next-line ember/named-functions-in-promises
            RSVP.all(promises).then(() => {
                controller.set('specDeleteSuccessful', true);
                later(() => { controller.set('specDeleteSuccessful') }, 2000);
            }).catch((e) => {
                alert("Could not delete some process plan records. See log for details.");
                console.error("Could not delete some process plan records", e);
            }).finally(() => {
                controller.set('isCurrentlyDeletingSpecs', false);
            });
        },

        deleteAllConc() {
            let controller = this.get('controller');
            controller.set('isCurrentlyDeletingProc', true);
            let promises = [
                this.deleteAll('agent'),
                this.deleteAll('artifact'),
                this.deleteAll('test-value-bearer'),
                this.deleteAll('sub-process')
            ];

            // eslint-disable-next-line ember/named-functions-in-promises
            RSVP.all(promises).then(() => {
                controller.set('procDeleteSuccessful', true);
                later(() => { controller.set('procDeleteSuccessful') }, 2000);
            }).catch((e) => {
                alert("Could not delete some process records. See log for details.");
                console.error("Could not delete some process records", e);
            }).finally(() => {
                controller.set('isCurrentlyDeletingProc', false);
            });
        }
    }
});
