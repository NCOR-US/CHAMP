// import Ember from 'ember';
import { Identifiable } from 'ontoview/data/resource-identifiable';
import { assertExists } from 'ontoview/data/data-utils';

const QueryConstraint = Identifiable.extend({});

const OrderConstraint = QueryConstraint.extend({
    init() {
        this._super(...arguments);
        assertExists(this, 'type', 'Missing query order constraint type');
        assertExists(this, 'src', 'Missing query order constraint src');
    }
});

export {
    OrderConstraint
};

export default QueryConstraint;
