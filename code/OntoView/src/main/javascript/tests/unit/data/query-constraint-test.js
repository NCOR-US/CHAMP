import { module, test } from 'ember-qunit';
import QueryGraph from 'ontoview/data/query-graph';
import { InstanceNode } from 'ontoview/data/query-node';
import { OrderConstraint } from 'ontoview/data/query-constraint';

let query;

module("Unit | Data | query-constraint", {
    beforeEach: () => query = QueryGraph.create({name: 'test-query', description: 'Unit test query'}),
    afterEach: () => query = null
});

test("creates a valid ascending order constraint", (assert) => {
    assert.ok(OrderConstraint.create({src: 'test', type: 'asc'}));
});

test("creates a valid descending order constraint", (assert) => {
    assert.ok(OrderConstraint.create({src: 'test2', type: 'desc'}));
});

test("fails to create a bad constraint", (assert) => {
    assert.throws(
        () => OrderConstraint.create("not a real order"),
        "String order constraint definition should fail");
    assert.throws(
        () => OrderConstraint.create({src: 'test'}),
        "Missing order type should fail");
    assert.throws(
        () => OrderConstraint.create({type: 'asc'}),
        "Missing order variable src should fail");
});

test("applies limit constraint", (assert) => {
    query.setLimit(10);
    assert.ok(query.toQueryString().includes('LIMIT 10'));
});

test("applies order constraint", (assert) => {
    let test = InstanceNode.create({variable: 'test'});
    query.addNode(test);
    query.addOrder(OrderConstraint.create({src: test.get('id'), type: 'asc'}));
    assert.ok(query.toQueryString().includes('ORDER BY asc(?test)'));
});

test("applies multiple order constraints", (assert) => {
    let test = InstanceNode.create({variable: 'test'});
    let test2 = InstanceNode.create({variable: 'test2'});
    query.addNode(test);
    query.addNode(test2);
    query.addOrder(OrderConstraint.create({src: test.get('id'), type: 'asc'}));
    query.addOrder(OrderConstraint.create({src: test2.get('id'), type: 'desc'}));
    assert.ok(query.toQueryString().includes('ORDER BY asc(?test) desc(?test2)'));
});

test("applies order then limit", (assert) => {
    let test = InstanceNode.create({variable: 'test'});
    let test2 = InstanceNode.create({variable: 'test2'});
    query.addNode(test);
    query.addNode(test2);
    query.addOrder(OrderConstraint.create({src: test.get('id'), type: 'asc'}));
    query.setLimit(10);
    query.addOrder(OrderConstraint.create({src: test2.get('id'), type: 'desc'}));
    assert.ok(query.toQueryString().includes('ORDER BY asc(?test) desc(?test2)\nLIMIT 10'));
});

test("removes a limit constraint", (assert) => {
    query.setLimit(10);
    query.removeLimit();
    assert.notOk(query.toQueryString().includes('LIMIT 10'));
});

test("removes an order constraint", (assert) => {
    let test = InstanceNode.create({variable: 'test'});
    query.addNode(test);
    let order = OrderConstraint.create({src: test.get('id'), type: 'asc'});
    query.addOrder(order);
    query.removeOrder(order.get('id'));
    assert.notOk(query.getOrder(order.get('id')));
});

test("doesn't add an order constraint with a variable that doesn't exist", (assert) => {
    assert.throws(() => query.addOrder(OrderConstraint.create({src: 'test', type: 'asc'})));
});

test("doesn't add an order constraint if the inverse exists", (assert) => {
    let test = InstanceNode.create({variable: 'test'});
    query.addNode(test);
    query.addOrder(OrderConstraint.create({src: test.get('id'), type: 'asc'}));
    assert.throws(() => query.addOrder(OrderConstraint.create({src: test.get('id'), type: 'desc'})));
});

test("doesn't add a constraint if it already exists", (assert) => {
    let test = InstanceNode.create({variable: 'test'});
    query.addNode(test);
    let order = OrderConstraint.create({src: test.get("id"), type: 'asc'});
    query.addOrder(order);
    assert.throws(() => query.addOrder(order));
    assert.throws(() => query.addOrder(OrderConstraint.create({src: test.get('id'), type: 'asc'})));
});
