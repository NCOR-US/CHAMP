import { module, test } from 'ember-qunit';
import QueryGraph from 'ontoview/data/query-graph';
import {
  AdHocNode,
  ClassNode,
  InstanceNode,
  LiteralNode
} from 'ontoview/data/query-node';
import { BinaryOperator, UnaryFunction } from 'ontoview/data/query-function';
import QueryEdge from 'ontoview/data/query-edge';
import {CreateNodeApplication, FilterApplication, RelationshipApplication,
    StartUnionApplication, EndUnionApplication,
    StartOptionalApplication, EndOptionalApplication
} from 'ontoview/data/query-application';

let query;

module("Unit | Data | query-application", {
    beforeEach: () => query = QueryGraph.create({name: 'test-query', description: 'Unit test query'}),
    afterEach: () => query = null
});

test("applies basic node relationship", (assert) => {
    let sIRI = 'http://www.test.com/some/ClassName1';
    let source = ClassNode.create({iri: sIRI});
    query.addNode(source);

    let eIRI = 'http://www.test.com/has';
    let edge = QueryEdge.create({iri: eIRI});
    query.addEdge(edge);

    let tIRI = 'http://www.test.com/some/ClassName2';
    let target = ClassNode.create({iri: tIRI});
    query.addNode(target);

    query.addApplication(RelationshipApplication.create({
        source: source.get('id'),
        edge: edge.get('id'),
        target: target.get('id')
    }));

    let queryString = query.toQueryString();
    assert.ok(queryString.includes(`WHERE {`));
    assert.ok(queryString.includes(`<${sIRI}> <${eIRI}> <${tIRI}> .`));
    assert.ok(queryString.includes(`}`));
});

test("doesn't apply basic node relationship if a node doesn't exist", (assert) => {
    let app = RelationshipApplication.create({
        source: 'not-an-id',
        edge: 'not-an-id',
        target: 'not-an-id'
    });
    assert.throws(() => query.addApplication(app));
});

test("doesn't apply basic node relationship if an edge doesn't exist", (assert) => {
    let sid = 'http://www.test.com/some/ClassName1';
    let source = ClassNode.create({iri: sid});
    query.addNode(source);

    let tid = 'http://www.test.com/some/ClassName2';
    let target = ClassNode.create({iri: tid});
    query.addNode(target);

    let app = RelationshipApplication.create({
        source: source.get('id'),
        edge: 'not-an-id',
        target: target.get('id')
    });
    assert.throws(() => query.addApplication(app));
});

test("creates an ad-hoc node", (assert) => {
    let node = AdHocNode.create({
        variable: 'n',
        expr: UnaryFunction.create({name: 'xsd:decimal', args: ['"10"']})
    });
    query.addNode(node);
    query.addApplication(CreateNodeApplication.create({target: node.get('id')}));
    assert.ok(query.toQueryString().includes('BIND(xsd:decimal("10") as ?n)'));
});

test("applies a filter", (assert) => {
    let node = LiteralNode.create({variable: 'test'});
    let filter = BinaryOperator.create({op: '<', lhs: '?test', rhs: '5'});
    let node2 = InstanceNode.create({variable: 'test2'});
    let edge = QueryEdge.create({iri: 'urn:cubrc:has'});

    query.addNode(node2);
    node.addFilter(filter);
    assert.ok(node.getFilter(filter.get('id')));

    query.addNode(node);
    query.addEdge(edge);
    query.addApplication(RelationshipApplication.create({
        source: node2.get('id'),
        edge: edge.get('id'),
        target: node.get('id')
    }));

    query.addApplication(FilterApplication.create({target: node.get('id'), filter: filter.get('id')}));
    assert.ok(query.toQueryString().includes('FILTER ?test < 5'));
});

test("removes an application", (assert) => {
    let app = StartOptionalApplication.create({link: '123'});
    query.addApplication(app);
    query.removeApplication(app.get('id'));
    assert.notOk(query.getApplication(app.get('id')));
});

test("applies optional", (assert) => {
    query.addApplication(StartOptionalApplication.create({link: '123'}));
    query.addApplication(EndOptionalApplication.create({link: '123'}));

    assert.ok(query.toQueryString().replace(/\s/g, '').includes('OPTIONAL{}'));
});

test("applies union", (assert) => {
    query.addApplication(StartUnionApplication.create({link: '123'}));
    query.addApplication(EndUnionApplication.create({link: '123'}));

    assert.ok(query.toQueryString().replace(/\s/g, '').includes('UNION{}'));
});

// projection and constraint applications are tested in the
// projection and constraint unit tests, respectively
