import EmberObject, { set } from '@ember/object';
import Service from '@ember/service';

export default Service.extend({
    isTrackingQuery: false,
    queryEntities: [],

    /**
     * Adds an entity if it doesn't exist already.
     */
    addEntity(entity) {
        entity['current'] = true;

        let queryEntities = this.get('queryEntities');
        let foundDupe = false;
        queryEntities.forEach(e => {
            if (entity.id === e.id) {
                // found duplicate. need to make it current
                set(e, 'current', true);
                foundDupe = true;
            } else {
                set(e, 'current', false);
            }
        });

        if (!foundDupe) {
            queryEntities.pushObject(EmberObject.create(entity));
        }
    },

    start() {
        this.set('queryEntities', []);
        this.set('isTrackingQuery', true);
    },

    stop() {
        this.set('isTrackingQuery', false);
    }
});
