import Route from '@ember/routing/route';
import RSVP from 'rsvp';

export default Route.extend({
    model() {
        let store = this.get('store');
        
        return RSVP.hashSettled({
            // todo consider moving this to application route instead of having here and in index route
            agentSpecs: store.findAll('agent-spec'),
            artifactSpecs: store.findAll('artifact-spec'),
            subProcessSpecs: store.findAll('sub-process-spec'),
            processes: store.findAll('process')
        })
    }
});
