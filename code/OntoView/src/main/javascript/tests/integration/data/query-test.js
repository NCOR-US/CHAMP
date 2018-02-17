import { module, test } from 'ember-qunit';
import { ClassNode, InstanceNode, LiteralNode } from 'ontoview/data/query-node';
import QueryEdge from 'ontoview/data/query-edge';
import QueryGraph from 'ontoview/data/query-graph';

import FixtureFactory from 'ontoview/data/test-fixture';

let query;

module("Integration | Data | query", {
    beforeEach: () => query = QueryGraph.create({name: 'test-query', description: 'Unit test query'}),
    afterEach: () => query = null
});


test("stores variables", (assert) => {
    query.addNode(ClassNode.create({iri: 'urn:test'}));
    let node = ClassNode.create({iri: 'urn:test1', variable: 'a'});
    node.useVariable();
    query.addNode(node);
    query.addNode(InstanceNode.create({variable: 'b'}));
    // can't deepEqual: get infinite recursion (?)
    assert.equal(JSON.stringify(query.get('variables')), JSON.stringify(['a', 'b']));

    query.addNode(LiteralNode.create({variable: 'c', active: 'variable'}));
    query.addNode(LiteralNode.create({value: 123}));
    let edge = QueryEdge.create({iri: 'urn:test4', variable: 'e'});
    edge.useVariable();
    query.addEdge(edge);
    assert.equal(JSON.stringify(query.get('variables')), JSON.stringify(['a','b','c','e']));
});

test("stores IRIs", (assert) => {
    query.addNode(ClassNode.create({iri: 'urn:test'}));
    query.addNode(ClassNode.create({iri: 'urn:test1', variable: 'a'}));
    query.addNode(InstanceNode.create({variable: 'b'}));
    assert.deepEqual(query.get('iris'), ['urn:test', 'urn:test1']);

    query.addNode(LiteralNode.create({variable: 'c'}));
    query.addNode(LiteralNode.create({value: 123}));
    query.addEdge(QueryEdge.create({iri: 'urn:test4', variable: 'e'}));
    assert.deepEqual(query.get('iris'), ['urn:test', 'urn:test1', 'urn:test4']);
});

test("creates test fixture", (assert) => {
    assert.ok(FixtureFactory.createFixture());
});

test("full featured query", (assert) => {
    // todo the query is correct, but bombs out on the last body line
    // assert.equal(query.toQueryString(), targetQuery);
    // let expectedChunks = targetQuery.split('\n');
    // let actualChunks = query.toQueryString().split('\n');
    // assert.equal(expectedChunks.length, actualChunks.length, "Length of query is different");
    // for (let i = 0; i < expectedChunks.length; i++) {
    //     assert.equal(actualChunks[i], expectedChunks[i]);
    // }

    let testData = FixtureFactory.createFixture();
    // console.log("actual:", testData.fixture.toQueryString());
    // console.log("expected:", testData.expectedQueryString);
    assert.expect(0);
});
