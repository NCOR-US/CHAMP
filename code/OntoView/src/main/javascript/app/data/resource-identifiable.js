import EmberObject, { computed } from '@ember/object';
import { UUID } from 'ontoview/data/data-utils';

// class Eyedeeable {
//     constructor() {
//         this.id = UUID.createV4();
//     }
// }

const Identifiable = EmberObject.extend({
    // todo consider API to get ID
    init() {
        this._super(...arguments);
        this.set('id', UUID.createV4());
    }
});

/**
 * Enables resource identity computed properties
 */
const ResourceIdentifiable = Identifiable.extend({
    init() {
        this._super(...arguments);
        this.set('localNameDelimiters', ['/', '#', '/#']);
    },

    __identifierChunks: computed('_identifier', function() {
        let identifier = this.get('_identifier');
        if (!identifier) {
            return [];
        }

        let delims = this.get('localNameDelimiters');
        let indices = delims.map((d) => identifier.lastIndexOf(d));
        indices.sort();

        let index = indices[indices.length - 1] + 1;
        return [identifier.slice(0, index), identifier.slice(index)];
    }),

    namespace: computed('__identifierChunks', function() {
        let chunks = this.get('__identifierChunks');
        if (chunks.length !== 2) { return; }

        return chunks[0];
    }),

    localName: computed('__identifierChunks', function() {
        let chunks = this.get('__identifierChunks');
        if (chunks.length !== 2) { return; }

        return chunks[1];
    }),

    changeIdentifier(newID) {
        this.set('_identifier', newID);
    }
});

export {Identifiable, ResourceIdentifiable};
