import { module, test } from 'ember-qunit';
import {
    NoArgFunction, UnaryFunction, BinaryFunction, TernaryFunction,
    UnaryOperator, BinaryOperator
} from 'ontoview/data/query-function';

module("Unit | Data | query-function");

test("creates a no-arg function", (assert) => {
    assert.throws(() => NoArgFunction.create());
    let fn = NoArgFunction.create({name: 'UUID'});
    assert.equal(fn.toString(), 'UUID()');
});

test("creates a unary function", (assert) => {
    assert.throws(() => UnaryFunction.create());
    let fn = UnaryFunction.create({name: 'BOUND', args: ['?someVar']});
    assert.equal(fn.toString(), 'BOUND(?someVar)');
});

test("creates a binary function", (assert) => {
    // assert.throws(() => BinaryFunction.create());
    // assert.throws(() => BinaryFunction.create({name: 'STRAFTER'}));
    let fn = BinaryFunction.create({name: 'STRAFTER', args: ['"abc"', '"b"']});
    assert.equal(fn.toString(), 'STRAFTER("abc", "b")');
});

test("creates a ternary function", (assert) => {
    // assert.throws(() => TernaryFunction.create());
    // assert.throws(() => TernaryFunction.create({name: 'REGEX'}));
    let fn = TernaryFunction.create({name: 'REGEX', args: ['?stasisstr', '"Stasis"', '"i"']});
    assert.ok(fn.toString().includes('REGEX(?stasisstr, "Stasis", "i")'));
});

test("creates a unary operator", (assert) => {
    assert.throws(() => UnaryOperator.create());
    assert.throws(() => UnaryOperator.create({op: '+'}));
    let op = UnaryOperator.create({op: '+', param: '2'});
    assert.equal(op.toString(), '+2');
});

test("creates a binary operator", (assert) => {
    assert.throws(() => BinaryOperator.create());
    assert.throws(() => BinaryOperator.create({op: '+'}));
    assert.throws(() => BinaryOperator.create({op: '+', lhs: '1'}));
    assert.throws(() => BinaryOperator.create({op: '+', rhs: '1'}));
    let op = BinaryOperator.create({op: '+', lhs: '1', rhs: '1'});
    assert.equal(op.toString(), '1 + 1');
});

test("creates a nested unary function", (assert) => {
    assert.throws(() => UnaryFunction.create());
    let fn = UnaryFunction.create({name: 'IRI', args: ['"http://www.test.com/Thing"']});
    assert.equal(fn.toString(), 'IRI("http://www.test.com/Thing")');
});

test("creates a nested binary function", (assert) => {
    assert.throws(() => BinaryFunction.create());
    let fn = BinaryFunction.create({name: 'sameTerm', args: ['?name1', '?name2']});
    assert.equal(fn.toString(), 'sameTerm(?name1, ?name2)');
});

test("creates a nested ternary function", (assert) => {
    let inner = TernaryFunction.create({name: 'replace', args: ['?stasisstr', '"StasisOfCapability"', '"StasisDurationHrsToken"']});
    let outer = UnaryFunction.create({name: 'IRI', args: [inner]});
    assert.equal(outer.toString(), 'IRI(replace(?stasisstr, "StasisOfCapability", "StasisDurationHrsToken"))');
});
