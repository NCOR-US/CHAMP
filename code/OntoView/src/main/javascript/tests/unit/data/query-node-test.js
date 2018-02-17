import { module, test } from 'ember-qunit';
import {
  ClassNode,
  InstanceNode,
  LiteralNode,
  AdHocNode
} from 'ontoview/data/query-node';
import QueryFunction from 'ontoview/data/query-function';
import QueryGraph from 'ontoview/data/query-graph';

let query;

module("Unit | Data | query-node", {
    beforeEach: () => query = QueryGraph.create({name: 'test-query', description: 'Unit test query'}),
    afterEach: () => query = null
});

// node/edge creation

test("fails to create a bad node", (assert) => {
    assert.throws(() => query.addNode('not a real node'), "String node definition should fail");
    assert.throws(() => query.addNode(ClassNode.create()), "Empty class node definition should fail");
    assert.throws(() => query.addNode(InstanceNode.create()), "Empty instance node definition should fail");
    assert.throws(() => query.addNode(LiteralNode.create()), "Empty value node definition should fail");
    assert.throws(() => query.addNode(AdHocNode.create()), "Empty ad-hoc node definition should fail");
});

test("creates a valid class node w/iri", (assert) => assert.ok(ClassNode.create({iri: 'urn:test/Thing'})));
test("creates a valid class node w/variable", (assert) => assert.ok(ClassNode.create({variable: 'test123'})));
test("creates a valid instance node w/iri", (assert) => assert.ok(InstanceNode.create({iri: 'urn:test/Thing'})));
test("creates a valid instance node w/variable", (assert) => assert.ok(InstanceNode.create({variable: 'test123'})));
test("creates a valid literal node w/value", (assert) => assert.ok(LiteralNode.create({value: 123})));
test("creates a valid literal node w/variable", (assert) => assert.ok(LiteralNode.create({variable: 'test123'})));
test("creates a valid ad-hoc node w/variable and expression", (assert) => {
    assert.ok(AdHocNode.create({variable: 'test123', expr: QueryFunction.create({name: 'test', numArgs: 0})}));
});

test("doesn't add a node without a statement application", (assert) => {
    query.addNode(ClassNode.create({iri: 'www.test.com/some/ClassName'}));
    assert.notOk(query.toQueryString().includes('<www.test.com/some/ClassName>'));
});

test("properly removes nodes by ID", (assert) => {
    let node = ClassNode.create({iri: 'www.test.com/some/ClassName'});
    query.addNode(node);
    query.removeNode(node.get('id'));

    assert.notOk(query.getNode(node.get('id')));
});

test("doesn't allow adding the same node twice", (assert) => {
    let node = ClassNode.create({iri: 'www.test.com/some/ClassName'});
    query.addNode(node);
    assert.throws(() => query.addNode(node));
});

test("doesn't allow adding a node with duplicate IRI", (assert) => {
    let node = ClassNode.create({iri: 'www.test.com/some/ClassName'});
    let node2 = ClassNode.create({iri: 'www.test.com/some/ClassName'});
    query.addNode(node);
    assert.throws(() => query.addNode(node2));
});

test("doesn't allow adding a node with the same variable", (assert) => {
    let node = InstanceNode.create({variable: 'test123'});
    let node2 = InstanceNode.create({variable: 'test123'});
    query.addNode(node);
    assert.throws(() => query.addNode(node2));
});

test("doesn't allow adding a node with the same ID", (assert) => {
    let node = ClassNode.create({iri: 'www.test.com/some/ClassName'});
    let node2 = InstanceNode.create({variable: 'test456'});
    node2.set('id', node.get('id'));
    query.addNode(node);
    assert.throws(() => query.addNode(node2));
});
