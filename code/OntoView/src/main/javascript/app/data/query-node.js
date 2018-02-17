import EmberObject, { computed } from '@ember/object';
import { ResourceIdentifiable } from 'ontoview/data/resource-identifiable';
import QueryFunction from 'ontoview/data/query-function';
import { XsdTypes, ReverseXsdTypes } from 'ontoview/data/xsd-types';
import {
  assert,
  assertExists,
  assertOneExists
} from 'ontoview/data/data-utils';

/**
 * A SPARQL query node.
 * For now, all non-variable nodes must be initialized with a non-prefixed IRI.
 */
const QueryNode = ResourceIdentifiable.extend({
    // todo "unknown" node from query string?
    setVariable(variable) {
        this.set('variable', variable);
    },

    getVariable() {
        return this.get('variable');
    },

    removeVariable() {
        this.set('variable', null);
    },

    useVariable() {
        this.set('active', 'variable');
    },

    isUsingVariable() {
        return this.get('active') === 'variable';
    },

    addFilter(filterExpr) {
        assert(filterExpr instanceof QueryFunction, 'parameter not instance of QueryFunction');

        let filters = this.get('filters');
        let filterID = filterExpr.get('id');

        if (filters[filterID]) {
            throw new Error('filter already exists: ' + filterExpr.toString());
        }

        filters.set(filterID, filterExpr);
    },

    removeFilter(filterExprID) {
        assert(typeof filterExprID === 'string', 'parameter not a string');

        this.get('filters').set(filterExprID);
    },

    getFilter(filterExprID) {
        return this.get('filters').get(filterExprID);
    },

    merge(other) {
        assert(other instanceof QueryNode, `Parameter must be QueryNode: ${other}`);
        // todo impose constraint on types of nodes?
        this.mergeProperty(other, 'variable');
    },

    mergeProperty(other, propertyName) {
        let otherProp = other.get(propertyName);
        if (otherProp !== null && otherProp !== undefined) {
            this.set(propertyName, otherProp);
        }
    },

    init() {
        this._super(...arguments);
        this.set('filters', EmberObject.create());
    }
});

/**
 * A resource node; class or instance.
 */
const ResourceNode = QueryNode.extend({
    // todo if literal nodes aren't going to use _identifier, remove it
    iri: computed('_identifier', {
        get(/*key*/) {
            return this.get('_identifier');
        },
        set(key, value) {
            this.set('_identifier', value);
            return value;
        }
    }),

    useIRI() {
        this.set('active', 'iri');
    },

    isUsingIRI() {
        return this.get('active') === 'iri';
    },

    merge(other) {
        this._super(other);
        this.mergeProperty(other, 'iri');
    },

    init() {
        this._super(...arguments);
        assertOneExists(this, ['iri', 'variable'], 'Missing identifier for resource node');

        if (this.get('iri')) {
            this.set('active', 'iri');
        } else {
            this.set('active', 'variable');
        }
    }
});

/**
 * A class node. Requires either a URI or a variable name.
 */
const ClassNode = ResourceNode.extend({});

// this will have to be the default in the case of unknown node type
const InstanceNode = ResourceNode.extend({
    instanceClass: undefined,

    merge(other) {
        this._super(other);
        this.mergeProperty(other, 'instanceClass');
        this.mergeProperty(other, '__useClass');
    },

    init() {
        this._super(...arguments);
        this.set('useClass', !!this.get('instanceClass'));
    },

    // uses a private variable for actual storage
    useClass: computed('instanceClass', {
        get(key) {
            let hasClassDef = !!this.get('instanceClass');
            if (hasClassDef) {
                return hasClassDef;
            } else {
                return this.get('__'+key);
            }
        },
        set(key, value) {
            this.set('__'+key, value);
            return value;
        }
    }),
    __useClass: false
});

const AdHocNode = QueryNode.extend({
    init() {
        this._super(...arguments);
        assertExists(this, 'variable', 'Missing identifier for ad-hoc node');
        assertExists(this, 'expr', 'Missing expression for ad-hoc node');
        assert(this.get('expr') instanceof QueryFunction, 'expr is not instance of QueryFunction');

        this.set('active', 'variable');
    },

    // no merging of adhoc nodes here
    merge() {},

    // disable
    removeVariable() {
        console.warn("Cannot remove variable of an ad-hoc node");
    },

    useVariable() {
        console.warn("Cannot change use of variable of an ad-hoc node");
    },

    setExpression(expr) {
        this.set('expr', expr);
    }
});

const LiteralNode = QueryNode.extend({
    // todo consider detecting type
    dataType: XsdTypes.STRING,

    init() {
        this._super(...arguments);
        assertOneExists(this, ['variable', 'value'], 'Missing identifier for literal node');

        if (this.get('value')) {
            this.set('active', 'value');
        } else {
            this.set('active', 'variable');
            this.set('useDataType', true);
        }
    },

    merge(other) {
        this._super(other);
        this.mergeProperty(other, 'value');
    },

    useValue() {
        this.set('active', 'value');
    },

    isUsingValue() {
        return this.get('active') === 'value';
    },

    setValue(value) {
        this.set('value', value);
    },

    removeValue() {
        // todo check to see if an identifier exists??
        this.set('value');
    },

    isUsingDataType() {
        return this.get('useDataType');
    },

    setUsingDataType(udt) {
        this.set('useDataType', udt);
    },

    setDataType(type) {
        assert(ReverseXsdTypes[type], 'Cannot set non-XSD type');
        this.set('dataType', type);
    },
});

export {
    ResourceNode,
    ClassNode,
    InstanceNode,
    AdHocNode,
    LiteralNode
};

export default QueryNode;
