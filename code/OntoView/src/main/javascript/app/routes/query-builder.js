import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import transform from 'ontoview/data/transform/sparql-results-json';
import QueryGraph from 'ontoview/data/query-graph';

export default Route.extend({
    entityQueryService: service('entity-query'),
    queryTrackerService: service('query-tracker'),

    model() {
        let tracker = this.get('queryTrackerService');
        let entities = tracker.get('queryEntities').map(e => {
            let x = e.id.length - 1;
            let id = e.get('id');
            if (id.charAt(0) === '<' && id.charAt(x) === '>') {
                id = id.substring(1, x);
            }
            id = id.replace(/\+/g, '/');
            e.set('id', id);
            return e;
        });
        let ns = this.get('entityQueryService').get('ns');

        if (tracker.isTrackingQuery && entities.length) {
            tracker.stop();
            return transform(entities, ns);
        } else {
            const fixture = QueryGraph.create({name: 'Untitled'});
            fixture.addPrefixes(ns);
            return fixture;
        }
    },

    actions: {
        willTransition(/*transition*/) {
            if (confirm('Are you sure you want to abandon progress?')) {
                return true;
            }
        }
    }
});
