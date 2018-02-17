import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import RSVP from 'rsvp';

export default Route.extend({
    configService: service('configs'),
    ontologyService: service('ontologies'),

    model() {
        let store = this.get('store');
        return RSVP.hashSettled({
            // retrieve all records so we can peek later
            agents: store.findAll('agent'),
            artifacts: store.findAll('artifact'),
            testValues: store.findAll('test-value-bearer'),
            subProcesses: store.findAll('sub-process'),
            processes: store.findAll('process'),

            agentSpecs: store.findAll('agent-spec'),
            artifactSpecs: store.findAll('artifact-spec'),
            testValueSpecs: store.findAll('test-value-bearer-spec'),
            subProcessSpecs: store.findAll('sub-process-spec'),

            // init all services requiring data
            configService: this.get('configService').initialize(),
            ontologyService: this.get('ontologyService').initialize()
        });
    },

    actions: {
        error(error/*, transition*/) {
            console.error(error);
            alert(error.message);
        }
    }
});
