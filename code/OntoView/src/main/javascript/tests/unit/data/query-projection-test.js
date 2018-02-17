import { module, test } from 'ember-qunit';
import QueryGraph from 'ontoview/data/query-graph';
import { InstanceNode } from 'ontoview/data/query-node';

let query;

module("Unit | Data | query-projection", {
    beforeEach: () => query = QueryGraph.create({name: 'test-query', description: 'Unit test query'}),
    afterEach: () => query = null
});

// projections
test("doesn't add a bad projection", (assert) => {
    assert.throws(() => query.addProjection([]));
    assert.throws(() => query.addProjection({}));
    assert.throws(() => query.addProjection(InstanceNode.create({name: 'test'})));
});

test("applies select *", (assert) => {
    assert.ok(query.toQueryString().includes('SELECT *'));
});

test("applies select variable", (assert) => {
    query.addNode(InstanceNode.create({variable: 'test'}));
    query.addProjection("test");

    assert.ok(query.toQueryString().includes(`SELECT ?test`));
});

test("applies select multiple variables", (assert) => {
    query.addNode(InstanceNode.create({variable: 'test'}));
    query.addNode(InstanceNode.create({variable: 'test2'}));
    query.addProjection("test");
    query.addProjection("test2");

    assert.ok(query.toQueryString().includes(`SELECT ?test ?test2`));
});

test("doesn't project things that don't exist", (assert) => {
    assert.throws(() => query.addProjection('test'));
});

test("removes a projection", (assert) => {
    query.addNode(InstanceNode.create({variable: 'test'}));
    query.addProjection("test");
    query.removeProjection("test");

    assert.ok(query.toQueryString().includes('SELECT *'));
});
