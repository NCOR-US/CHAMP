// import Ember from 'ember';
import { Identifiable } from 'ontoview/data/resource-identifiable';
import { assertExists } from 'ontoview/data/data-utils';

const QueryApplication = Identifiable.extend({});

// todo consider trying id first, then _identifier
const RelationshipApplication = QueryApplication.extend({
    init() {
        this._super(...arguments);
        assertExists(this, 'source', 'Missing query relationship source');
        assertExists(this, 'edge', 'Missing query relationship edge');
        assertExists(this, 'target', 'Missing query relationship target');
    }
});

const CreateNodeApplication = QueryApplication.extend({
    init() {
        this._super(...arguments);
        assertExists(this, 'target', 'Missing query create node target');
    }
});

const FilterApplication = QueryApplication.extend({
    init() {
        this._super(...arguments);
        assertExists(this, 'target', 'Missing query filter target');
        assertExists(this, 'filter', 'Missing query filter ID');
    }
});

// todo consider implementing in QueryApplication instead
const StartLinkedApplication = QueryApplication.extend({
    init() {
        this._super(...arguments);
        assertExists(this, 'link', 'Missing end application link');
    }
});

const EndLinkedApplication = QueryApplication.extend({
    init() {
        this._super(...arguments);
        assertExists(this, 'link', 'Missing start application link');
    }
});

const StartOptionalApplication = StartLinkedApplication.extend();
const EndOptionalApplication = EndLinkedApplication.extend();

const StartUnionApplication = StartLinkedApplication.extend();
const EndUnionApplication = EndLinkedApplication.extend();

export {
    StartLinkedApplication,
    EndLinkedApplication,
    StartOptionalApplication,
    EndOptionalApplication,
    StartUnionApplication,
    EndUnionApplication,
    RelationshipApplication,
    CreateNodeApplication,
    FilterApplication
};

export default QueryApplication;
