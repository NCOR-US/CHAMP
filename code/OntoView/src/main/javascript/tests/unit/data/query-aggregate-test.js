import { module, test } from 'ember-qunit';
import QueryGraph from 'ontoview/data/query-graph';
import QueryAggregate from 'ontoview/data/query-aggregate';
import QueryFunction, { UnaryFunction } from 'ontoview/data/query-function';

let query;

module("Unit | Data | query-aggregate", {
    beforeEach: () => query = QueryGraph.create({name: 'test-query', description: 'Unit test query'}),
    afterEach: () => query = null
});

test("doesn't add a bad aggregation", (assert) => {
    assert.throws(() => query.addAggregate("not an aggregate"));
    assert.throws(() => query.addAggregate(QueryAggregate.create({})));
    assert.throws(() => query.addAggregate(QueryAggregate.create({groups: []})));
    assert.throws(() => query.addAggregate(QueryAggregate.create({expr: QueryFunction.create({name: 'test', numArgs: 0})})));
});

test("applies sum aggregation", (assert) => {
    let total = QueryAggregate.create({
        target: 'total',
        groups: ['aircraft'],
        expr: UnaryFunction.create({name: 'SUM', args: ['?stasis_hrs_total']})
    });
    query.addAggregate(total);

    let queryString = query.toQueryString();
    assert.ok(queryString.includes('SELECT (SUM(?stasis_hrs_total) as ?total)'));
    assert.ok(queryString.includes('GROUP BY ?aircraft'));
});

test("removes an aggregate", (assert) => {
    let total = QueryAggregate.create({
        target: 'total',
        groups: ['aircraft'],
        expr: UnaryFunction.create({name: 'SUM', args: ['?stasis_hrs_total']})
    });
    query.addAggregate(total);
    query.removeAggregate(total.get('id'));
    assert.notOk(query.getAggregate(total.get('id')));
});

test("doesn't aggregate over something that doesn't exist", (assert) => {
    // todo unsure how to do this properly since functions can be nested, have no knowledge of variables, etc.
    assert.expect(0);
});
