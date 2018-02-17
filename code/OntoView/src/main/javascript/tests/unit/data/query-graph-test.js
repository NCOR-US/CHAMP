import { module, test } from 'ember-qunit';
import QueryGraph from 'ontoview/data/query-graph';

let query;

module("Unit | Data | query-graph", {
    beforeEach: () => query = QueryGraph.create({name: 'test-query', description: 'Unit test query'}),
    afterEach: () => query = null
});

test("is a QueryGraph", (assert) => assert.ok(query && query instanceof QueryGraph));
// test("empty query makes an empty string", (assert) => assert.equal(query.toQueryString(), ''));
