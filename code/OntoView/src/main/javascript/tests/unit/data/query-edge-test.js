import { module, test } from 'ember-qunit';
import QueryGraph from 'ontoview/data/query-graph';
import QueryEdge from 'ontoview/data/query-edge';

let query;

module("Unit | Data | query-edge", {
    beforeEach: () => query = QueryGraph.create({name: 'test-query', description: 'Unit test query'}),
    afterEach: () => query = null
});

test("fails to create a bad edge", (assert) => {
    assert.throws(
        () => query.addEdge("not a real edge"),
        "String edge definition should fail");
    assert.throws(
        () => query.addEdge(QueryEdge.create()),
        "Empty edge definition should fail");
});

test("doesn't add an edge without a statement application", (assert) => {
    query.addEdge(QueryEdge.create({iri: 'www.test.com/has'}));
    assert.notOk(query.toQueryString().includes('<www.test.com/has>'));
});

test("properly removes edges by ID", (assert) => {
    let edge = QueryEdge.create({iri: 'www.test.com/has'});
    query.addEdge(edge);
    query.removeEdge(edge.get('id'));

    assert.notOk(query.getEdge(edge.get('id')));
});

test("doesn't allow adding an edge that already exists", (assert) => {
    let edge = QueryEdge.create({iri: 'www.test.com/has'});
    query.addEdge(edge);
    assert.throws(() => query.addEdge(edge));
});

test("doesn't allow adding an edge with duplicate IRI", (assert) => {
    let edge = QueryEdge.create({iri: 'www.test.com/has'});
    let edge2 = QueryEdge.create({iri: 'www.test.com/has'});
    query.addEdge(edge);
    assert.throws(() => query.addEdge(edge2));
});

test("doesn't allow adding an edge with the same variable", (assert) => {
    let edge = QueryEdge.create({variable: 'test123'});
    let edge2 = QueryEdge.create({variable: 'test123'});
    query.addEdge(edge);
    assert.throws(() => query.addEdge(edge2));
});

test("doesn't allow adding an edge with the same ID", (assert) => {
    let edge = QueryEdge.create({iri: 'www.test.com/has'});
    let edge2 = QueryEdge.create({variable: 'test456'});
    edge2.set('id', edge.get('id'));
    query.addEdge(edge);
    assert.throws(() => query.addEdge(edge2), "Duplicate edge id should fail");
});
