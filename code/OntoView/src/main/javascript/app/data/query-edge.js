import { computed } from '@ember/object';
import { ResourceIdentifiable } from 'ontoview/data/resource-identifiable';
import { assert, assertOneExists } from 'ontoview/data/data-utils';

/**
 * A SPARQL query edge.
 * For now, all non-variable nodes must be initialized with a non-prefixed IRI.
 * todo consider merging with ResourceNode
 */
const QueryEdge = ResourceIdentifiable.extend({
    propertyType: undefined,

    iri: computed('_identifier', {
        get(/*key*/) {
            return this.get('_identifier');
        },
        set(key, value) {
            this.set('_identifier', value);
            return value;
        }
    }),

    // lifecycle
    init() {
        this._super(...arguments);
        assertOneExists(this, ['iri', 'variable'], "Missing identifier for edge");
        if (this.get('iri')) {
            this.set('active', 'iri');
        } else {
            this.set('active', 'variable');
        }
    },

    merge(other) {
        assert(other instanceof QueryEdge, `Parameter must be QueryNode: ${other}`);
        // todo impose constraint on types of nodes?
        this.mergeProperty(other, 'variable');
        this.mergeProperty(other, 'iri');
    },

    isUsingIRI() {
        return this.get('active') === 'iri';
    },

    isUsingVariable() {
        return this.get('active') === 'variable';
    },

    useIRI() {
        this.set('active', 'iri');
    },

    useVariable() {
        this.set('active', 'variable');
    }
});

export default QueryEdge;
