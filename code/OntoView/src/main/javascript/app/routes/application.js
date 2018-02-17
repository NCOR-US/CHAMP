import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import RSVP from 'rsvp';

export default Route.extend({
    entityQueryService: service('entity-query'),
    configService: service('configs'),

    model() {
        return RSVP.hashSettled({
            entityQueryService: this.get('entityQueryService').initialize(),
            configService: this.get('configService').initialize()
        });
    },

    actions: {
        error(error/*, transition*/) {
            console.error(error);
            alert(error.message);
        }
    }
});
