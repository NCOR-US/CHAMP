// import Ember from 'ember';
import { Identifiable } from 'ontoview/data/resource-identifiable';
import { assert, assertExists } from 'ontoview/data/data-utils';

// todo consider having typed args (e.g. Literal, IRI, Variable)

/**
 * A SPARQL query function expression. The following is needed to create an instance:
 *
 * name - the function name
 * numArgs - total number of arguments
 * numOptional - total number of arguments that are optional
 */
const QueryFunction = Identifiable.extend({
    args: [],
    numOptional: 0,

    init() {
        this._super(...arguments);
        assertExists(this, 'name', 'Missing function name');
        let numArgs = this.get('numArgs');
        assert(numArgs || numArgs === 0, 'Missing number of args');
    },

    assertNumArgs() {
        let args = this.get('args');
        let numArgs = this.get('numArgs');
        let numOptional = this.get('numOptional');

        if (args.length > numArgs) {
            console.warn(`${args.length} arguments above expected amount (${numArgs})`);
        }
        assert(args.length + numOptional >= numArgs, `Not enough arguments: ${numArgs} expected, ${numOptional} optional, got ${args.length}`);
    },

    toString() {
        // this.assertNumArgs();
        let args = this.get('args') || ['undefined'];
        let name = this.get('name') || 'ENONAME';
        let argString = args.join(", ");
        return `${name}(${argString})`;
    }
});

const NoArgFunction = QueryFunction.extend({numArgs: 0});
const UnaryFunction = QueryFunction.extend({numArgs: 1});
const BinaryFunction = QueryFunction.extend({numArgs: 2});
const TernaryFunction = QueryFunction.extend({numArgs: 3});

const QueryOperator = QueryFunction.extend({
    init() {
        assertExists(this, 'op', 'Missing function operator');

        // todo properly address below instead of shim
        this.set('name', this.get('op'));

        this._super(...arguments);
    }
});

const UnaryOperator = QueryOperator.extend({
    numArgs: 1,
    init() {
        this._super(...arguments);
        assertExists(this, 'param', "Missing unary operator param");
    },

    toString() {
        return `${this.get('op')}${this.get('param')}`;
    }
});

const BinaryOperator = QueryOperator.extend({
    numArgs: 2,
    init() {
        this._super(...arguments);
        assertExists(this, 'lhs', "Missing binary operator lhs");
        assertExists(this, 'rhs', "Missing binary operator rhs");
    },

    toString() {
        return `${this.get('lhs')} ${this.get('op')} ${this.get('rhs')}`;
    }
});

const Operators = {
    // unary operators
    NOT: UnaryOperator.extend({op: '!'}),
    UNARY_PLUS: UnaryOperator.extend({op: '+'}),
    UNARY_MINUS: UnaryOperator.extend({op: '-'}),

    // binary operators
    OR: BinaryOperator.extend({op: '||'}),
    AND: BinaryOperator.extend({op: '&&'}),
    EQUALS: BinaryOperator.extend({op: '='}),
    NOT_EQUALS: BinaryOperator.extend({op: '!='}),
    LESS_THAN: BinaryOperator.extend({op: '<'}),
    LESS_THAN_OR_EQUAL: BinaryOperator.extend({op: '<='}),
    GREATER_THAN: BinaryOperator.extend({op: '>'}),
    GREATER_THAN_OR_EQUAL: BinaryOperator.extend({op: '>='}),
    MULTIPLY: BinaryOperator.extend({op: '*'}),
    DIVIDE: BinaryOperator.extend({op: '/'}),
    ADD: BinaryOperator.extend({op: '+'}),
    SUBTRACT: BinaryOperator.extend({op: '-'}),
};

Object.freeze(Operators);

/*
 * Planned unsupported or delayed support:
 *
 * Conditionals: EXISTS (graph pattern), NOT EXISTS (graph pattern),
 *               IF (ternary), COALESCE (at least one arg),
 *               IN (at least one, equivalent to chaining ORs),
 *               NOT IN (same deal as IN),
 *               CONCAT (at least one arg)
 * VALUES
 * extension function
 */

// functional forms
const FunctionalFormFunctions = {};
['BOUND'].forEach((name) => FunctionalFormFunctions[name] = UnaryFunction.extend({name}));
['SAMETERM'].forEach((name) => FunctionalFormFunctions[name] = BinaryFunction.extend({name}));

// functions on RDF terms
const RDFFunctions = {};
['UUID', 'STRUUID'].forEach((name) => RDFFunctions[name] = NoArgFunction.extend({name}));
RDFFunctions['BNODE'] = UnaryFunction.extend({name: 'BNODE', numOptional: 1});
['ISIRI', 'ISBLANK', 'ISLITERAL', 'ISNUMERIC', 'STR', 'LANG', 'DATATYPE', 'IRI', 'URI'].forEach((name) => RDFFunctions[name] = UnaryFunction.extend({name}));
['STRDT', 'STRLANG'].forEach((name) => RDFFunctions[name] = BinaryFunction.extend({name}));

// functions on strings
const StringFunctions = {};
['STRLEN', 'UCASE', 'LCASE', 'ENCODE_FOR_URI'].forEach((name) => StringFunctions[name] = UnaryFunction.extend({name}));
['STRSTARTS', 'STRENDS', 'CONTAINS', 'STRBEFORE', 'STRAFTER', 'LANGMATCHES'].forEach((name) => StringFunctions[name] = BinaryFunction.extend({name}));
StringFunctions['REPLACE'] = QueryFunction.extend({name: 'REPLACE', numArgs: 4, numOptional: 1});
StringFunctions['SUBSTR'] = TernaryFunction.extend({name: 'SUBSTR', numOptional: 1});
StringFunctions['REGEX'] = TernaryFunction.extend({name: 'REGEX', numOptional: 1});

// functions on numerics
const NumericFunctions = {};
['RAND'].forEach((name) => NumericFunctions[name] = NoArgFunction.extend({name}));
['ABS', 'ROUND', 'CEIL', 'FLOOR'].forEach((name) => NumericFunctions[name] = UnaryFunction.extend({name}));

// functions on dates and times
const DateTimeFunctions = {};
['NOW'].forEach((name) => DateTimeFunctions[name] = NoArgFunction.extend({name}));
['YEAR', 'MONTH', 'DAY', 'HOURS', 'MINUTES', 'SECONDS', 'TIMEZONE', 'TZ'].forEach((name) => DateTimeFunctions[name] = UnaryFunction.extend({name}));

// hash functions
const HashFunctions = {};
['MD5', 'SHA1', 'SHA256', 'SHA384', 'SHA512'].forEach((name) => HashFunctions[name] = UnaryFunction.extend({name}));

// constructors
const ConstructorFunctions = {};
['BOOL', 'DBL', 'FLT', 'DEC', 'INT', 'DT', 'STR', 'IRI', 'LTRL'].forEach((name) => ConstructorFunctions[name] = UnaryFunction.extend({name}));

const Functions = {
    Functional: FunctionalFormFunctions,
    RDF: RDFFunctions,
    String: StringFunctions,
    Numeric: NumericFunctions,
    DateTime: DateTimeFunctions,
    Hash: HashFunctions,
    Constructor: ConstructorFunctions
};

Object.freeze(Functions);

/*
 * Planned unsupported or delayed support:
 *
 * SAMPLE
 * GROUP_CONCAT
 */

const AggregateFunctions = {};
['COUNT', 'SUM', 'MIN', 'MAX', 'AVG'].forEach((name) => AggregateFunctions[name] = UnaryFunction.extend({name}));

Object.freeze(AggregateFunctions);

export {
    NoArgFunction,
    UnaryFunction,
    BinaryFunction,
    TernaryFunction,
    Functions,
    QueryOperator,
    UnaryOperator,
    BinaryOperator,
    Operators,
    AggregateFunctions
};

export default QueryFunction;
