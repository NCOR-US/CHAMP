import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import { decodeIRI, encodeIRI } from 'ontoview/data/data-utils';

export default Route.extend({
    entityQueryService: service('entity-query'),
    queryTracker: service('query-tracker'),

    model(params) {
        let subject = decodeIRI(params['entity_id']);

        return this.get('entityQueryService').performEntityQuery(subject);
    },

    afterModel(resolvedModel, transition) {
        let queryTracker = this.get('queryTracker');
        if (queryTracker.get('isTrackingQuery')) {
            // todo does this change?
            let entityID = transition.params['search-result']["entity_id"];
            queryTracker.addEntity({
                id: entityID,
                label: decodeIRI(entityID),
                model: resolvedModel
            });
        }
    },

    actions: {
        stopTrackingQuery() {
            this.set('initiatedByButton', true);
            this.transitionTo('query-builder');
        },

        startTrackingQuery() {
            let model = this.currentModel;
            let queryTracker = this.get('queryTracker');
            queryTracker.start();
            queryTracker.addEntity({
                id: encodeIRI(model.id),
                label: model.id,
                model: this.currentModel
            });
        },

        cancelTrackingQuery() {
            this.get('queryTracker').stop();
        },

        willTransition(transition) {
            let trackingQuery = this.get('queryTracker').isTrackingQuery;
            let transitioningAway = transition.targetName !== 'search-result';

            let message = 'Are you sure you want to discard query tracking progress?';
            if (this.get('initiatedByButton')) {
                this.set('initiatedByButton');
                message = 'Are you sure you want to continue to the Query Builder?';
            }
            if (transitioningAway && trackingQuery && !confirm(message)) {
                transition.abort();
            }

            return true;
        }
    }
});
