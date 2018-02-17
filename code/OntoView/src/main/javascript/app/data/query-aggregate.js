// import Ember from 'ember';
import { Identifiable } from 'ontoview/data/resource-identifiable';
import { assertExists } from 'ontoview/data/data-utils';

export default Identifiable.extend({
    init() {
        this._super(...arguments);
        assertExists(this, 'groups', 'Missing query aggregate groups');
        // todo include a node, so the expression doesn't need a target?
        // todo or add a target variable here?
        assertExists(this, 'expr', 'Missing query aggregate expr');
        // todo HAVING as below 'filter'
        // assertExists(this, 'filter', 'Missing query aggregate filter');
        assertExists(this, 'target', 'Missing query aggregate target variable');
    }
});
