import EmberObject, { computed } from '@ember/object';

import QueryNode, {
  AdHocNode,
  ClassNode,
  InstanceNode,
  LiteralNode,
  ResourceNode
} from 'ontoview/data/query-node';
import QueryEdge from 'ontoview/data/query-edge';
import QueryAggregate from 'ontoview/data/query-aggregate';
import QueryApplication, {
    RelationshipApplication, CreateNodeApplication, FilterApplication,
    StartOptionalApplication, EndOptionalApplication,
    StartUnionApplication, EndUnionApplication
} from 'ontoview/data/query-application';
import QueryConstraint, { OrderConstraint } from 'ontoview/data/query-constraint';

import { assert, assertExists, UUID } from 'ontoview/data/data-utils';

/*
    todo might want to consider merging "do{type}" style API into one and detect the type
    being passed in
 */

const QueryGraph = EmberObject.extend({
    nodes: null,
    edges: null,
    projections: null,
    aggregates: null,
    constraints: null,
    application: null,

    // constraints
    distinct: false,
    ordering: null,
    offset: null,
    limit: null,

    nodeVariables: computed('nodes.[]', function() {
        return this.get('nodes')
            .filter((thing) => thing.isUsingVariable())
            .map((thing) => thing.get('variable'))
            .filter((thing) => thing);
    }),

    edgeVariables: computed('edges.[]', function() {
        return this.get('edges')
            .filter((thing) => thing.isUsingVariable())
            .map((thing) => thing.get('variable'))
            .filter((thing) => thing);
    }),

    variables: computed('{nodeVariables,edgeVariables}.[]', function() {
        return this.get('nodeVariables').concat(this.get('edgeVariables'));
    }),

    nodeIRIs: computed('nodes.[]', function() {
        return this.get('nodes')
            .map((node) => node.get('iri'))
            .filter((thing) => thing);
    }),

    edgeIRIs: computed('edges.[]', function() {
        return this.get('edges')
            .map((node) => node.get('iri'))
            .filter((thing) => thing);
    }),

    iris: computed('{nodeIRIs,edgeIRIs}.[]', function() {
        return this.get('nodeIRIs').concat(this.get('edgeIRIs'));
    }),

    values: computed('nodes.[]', function() {
        return this.get('nodes').map((node) => node.get('value')).filter((node) => node);
    }),

    init() {
        this._super();
        assertExists(this, 'name', 'Missing query name');

        this.set('prefixes', EmberObject.create());
        this.set('reversePrefixes', {});
        this.set('nodes', []);
        this.set('edges', []);
        this.set('projections', []);
        this.set('aggregates', []);
        this.set('constraints', []);
        this.set('application', []);

        this.set('ordering', []);
    },

    getNodeIndex(nodeID) {
        assert(typeof nodeID === 'string', 'parameter not a string');
        let nodes = this.get('nodes');
        for (let i = 0, ii = nodes.length; i < ii; i++) {
            let n = nodes[i];
            if (nodeID === n.get('id')) {
                return i;
            }
        }
        return -1;
    },

    getNode(nodeID) {
        assert(typeof nodeID === 'string', 'parameter not a string');
        let nodes = this.get('nodes').filter((node) => nodeID === node.get('id'));
        return nodes.length ? nodes[0] : null;
    },

    hasNode(node) {
        assert(node instanceof QueryNode, `expected QueryNode, got ${typeof node}`);

        let checkVariable, checkIRI, checkValue;
        let checkID = this.getNodeIndex(node.get('id')) > -1;

        let variable = node.get('variable');
        if (variable) {
            let variables = this.get('variables');
            checkVariable = variables.includes(variable);
        }
        let iri = node.get('iri');
        if (iri) {
            checkIRI = this.get('iris').includes(iri);
        }
        // todo do we care about the value?
        let value = node.get('value');
        if (value) {
            checkValue = this.get('values').includes(value);
        }

        return checkID || checkVariable || checkIRI || checkValue;
    },

    getNodeIfExists(node) {
        assert(node instanceof QueryNode, `expected QueryNode, got ${typeof node}`);

        // check by id first
        let maybeNode = this.getNode(node.get('id'));
        if (maybeNode) {
            return maybeNode;
        }

        // check by contents. todo do we care about value?
        let nodes = this.get('nodes');
        ['variable', 'iri', 'value'].forEach((propertyName) => {
            let property = node.get(propertyName);
            if (property) {
                let maybeNodes = nodes.filter((n) => n.get(propertyName) === property);
                if (maybeNodes.length) {
                    return maybeNodes[0];
                }
            }
        });

        return null;
    },

    addNode(node) {
        assert(node instanceof QueryNode, 'parameter not instance of QueryNode');
        if (!this.hasNode(node)) {
            this.get('nodes').pushObject(node);
        } else {
            throw new Error("Node already exists");
        }
    },

    removeNode(nodeID) {
        assert(typeof nodeID === 'string', 'parameter not a string');
        let nodeIndex = this.getNodeIndex(nodeID);
        if (nodeIndex > -1) {
            this.get('nodes').removeAt(nodeIndex);
        }
    },

    getEdgeIndex(edgeID) {
        assert(typeof edgeID === 'string', 'parameter not a string');
        let edges = this.get('edges');
        for (let i = 0, ii = edges.length; i < ii; i++) {
            let edge = edges[i];
            if (edgeID === edge.get('id')) {
                return i;
            }
        }
        return -1;
    },

    getEdge(edgeID) {
        assert(typeof edgeID === 'string', 'parameter not a string');
        let edges = this.get('edges').filter((edge) => edgeID === edge.get('id'));
        return edges.length ? edges[0] : null;
    },

    getEdgeIfExists(edge) {
        assert(edge instanceof QueryEdge, `expected QueryEdge, got ${typeof edge}`);

        // check by id first
        let maybeEdge = this.getEdge(edge.get('id'));
        if (maybeEdge) {
            return maybeEdge;
        }

        // check by contents
        let edges = this.get('edges');
        ['variable', 'iri'].forEach((propertyName) => {
            let property = edge.get(propertyName);
            if (property) {
                let maybeEdges = edges.filter((e) => e.get(propertyName) === property);
                if (maybeEdges.length) {
                    return maybeEdges[0];
                }
            }
        });

        return null;
    },

    hasEdge(edge) {
        assert(edge instanceof QueryEdge, 'parameter not instance of QueryEdge');

        let checkVariable, checkIRI;
        let checkID = this.getEdgeIndex(edge.get('id')) > -1;

        let variable = edge.get('variable');
        if (variable) {
            let variables = this.get('variables');
            checkVariable = variables.includes(variable);
        }
        let iri = edge.get('iri');
        if (iri) {
            checkIRI = this.get('iris').includes(iri);
        }

        return checkID || checkVariable || checkIRI;
    },

    addEdge(edge) {
        assert(edge instanceof QueryEdge, 'parameter not instance of QueryEdge');
        if (!this.hasEdge(edge)) {
            this.get('edges').pushObject(edge);
        } else {
            throw new Error("Edge already exists");
        }
    },

    removeEdge(edgeID) {
        assert(typeof edgeID === 'string', 'parameter not a string');
        let edgeIndex = this.getEdgeIndex(edgeID);
        if (edgeIndex > -1) {
            this.get('edges').removeAt(edgeIndex);
        }
    },

    addProjection(variable) {
        assert(typeof variable === 'string', 'parameter not a string');

        let hasNode = this.get('variables').includes(variable);
        let projections = this.get('projections');
        let hasProjection = projections.includes(variable);
        if (!hasNode) {
            throw new Error("Can't project a variable that doesn't exist");
        }

        if (hasProjection) {
            throw new Error("Can't project an aggregate (added automatically)");
        }

        projections.pushObject(variable);
    },
    removeProjection(variable) {
        assert(typeof variable === 'string', 'parameter not a string');

        let projections = this.get('projections');
        let index = projections.indexOf(variable);
        if (index > -1) {
            projections.removeAt(index);
        }
    },

    addAggregate(aggregate) {
        assert(aggregate instanceof QueryAggregate, 'parameter not instance of QueryAggregate');
        this.get('aggregates').pushObject(aggregate);
    },
    removeAggregate(aggregateID) {
        let aggregates = this.get('aggregates');
        for (let i = 0, ii = aggregates.length; i<ii; i++) {
            if (aggregates[i].get('id') === aggregateID) {
                aggregates.removeAt(i);
                return;
            }
        }
    },
    getAggregate(aggregateID) {
        let aggregates = this.get('aggregates').filter((a) => a.get('id') === aggregateID);
        return aggregates.length ? aggregates[0] : null;
    },

    addOrder(constraint) {
        assert(constraint instanceof OrderConstraint, 'parameter not instance of OrderConstraint');

        let constraints = this.get('ordering');
        let srcVar = constraint.get('src');
        if (!this.getNode(srcVar) && !this.getAggregate(srcVar)) {
            throw new Error("Node or aggregate with variable " + srcVar + " doesn't exist");
        }

        let maybeOrder = constraints.filter((c) => {
            return c.get('id') === constraint.get('id') || c.get('src') === constraint.get('src');
        });
        if (maybeOrder.length) {
            let order = maybeOrder[0];
            if (order.get('type') === constraint.get('type')) {
                throw new Error("Order constraint already exists");
            } else {
                throw new Error("Order constraint conflicts with existing constraint");
            }
        }

        this.get('ordering').pushObject(constraint);
    },

    removeOrder(constraintID) {
        assert(typeof constraintID === 'string', 'parameter not a string');
        let order = this.get('ordering');
        let index =  order.map((c) => c.get('id') === constraintID).indexOf(true);
        if (index > -1) {
            order.removeAt(index);
        }
    },

    getOrder(constraintID) {
        assert(typeof constraintID === 'string', 'parameter not a string');
        let constraints = this.get('ordering').filter((c) => c.get("id") === constraintID);
        return constraints.length ? constraints[0] : null;
    },

    getLimit() {
        return this.get('limit');
    },

    setLimit(num) {
        // assert(typeof num === 'number', 'parameter not instance of number');
        this.set('limit', num);
    },

    removeLimit() {
        this.set('limit');
    },

    setOffset(num) {
        assert(typeof num === 'number', 'parameter not instance of number');
        this.set('offset', num);
    },

    removeOffset() {
        this.set('offset');
    },

    setDistinct(val) {
        this.set('distinct', val);
    },

    isDistinct() {
        return this.get('distinct');
    },

    setReduced(val) {
        this.set('reduced', val);
    },

    isReduced() {
        return this.get('reduced');
    },

    addConstraint(constraint) {
        assert(constraint instanceof QueryConstraint, 'parameter not instance of QueryConstraint');
        let constraints = this.get('constraints');

        if (constraint instanceof OrderConstraint) {
            let srcVar = constraint.get('src');
            if (!this.getNode(srcVar) && !this.getAggregate(srcVar)) {
                throw new Error("Node or aggregate with variable " + srcVar + " doesn't exist");
            }

            let maybeOrder = constraints.filter((c) => {
                return c.get('id') === constraint.get('id') || c.get('src') === constraint.get('src');
            });
            if (maybeOrder.length) {
                let order = maybeOrder[0];
                if (order.get('type') === constraint.get('type')) {
                    throw new Error("Order constraint already exists");
                } else {
                    throw new Error("Order constraint conflicts with existing constraint");
                }
            }
        }
        constraints.pushObject(constraint);
    },
    removeConstraint(constraintID) {
        assert(typeof constraintID === 'string', 'parameter not a string');
        let constraints = this.get('constraints');
        let index =  constraints.map((c) => c.get('id') === constraintID).indexOf(true);
        if (index > -1) {
            constraints.removeAt(index);
        }
    },
    getConstraint(constraintID) {
        assert(typeof constraintID === 'string', 'parameter not a string');
        let constraints = this.get('constraints').filter((c) => c.get("id") === constraintID);
        return constraints.length ? constraints[0] : null;
    },

    addApplication(application) {
        assert(application instanceof QueryApplication, 'parameter not instance of QueryApplication');
        if (application instanceof RelationshipApplication) {
            // make sure nodes exist
            if (!this.getNode(application.get('source'))) {
                throw new Error("Relationship source node doesn't exist");
            }

            if (!this.getEdge(application.get('edge'))) {
                throw new Error("Relationship edge doesn't exist");
            }

            if (!this.getNode(application.get('target'))) {
                throw new Error("Relationship target node doesn't exist");
            }
        }

        this.get('application').pushObject(application);
    },

    removeApplication(applicationID) {
        assert(typeof applicationID === 'string', 'parameter not a string');
        let apps = this.get('application');
        for (let i = 0, ii = apps.length; i<ii; i++) {
            if (apps[i].get('id') === applicationID) {
                apps.removeAt(i);
                return;
            }
        }
    },
    getApplication(applicationID) {
        assert(typeof applicationID === 'string', 'parameter not a string');
        let apps = this.get('application').filter((a) => a.get('id') === applicationID);
        return apps.length ? apps[0] : null;
    },

    /**
     * Creates a set of linked start and end optional applications
     */
    createOptional() {
        let uuid = UUID.createV4();
        return {
            start: StartOptionalApplication.create({link: uuid}),
            end: EndOptionalApplication.create({link: uuid})
        };
    },

    /**
     * Creates a set of linked start and end optional applications, and adds them to the end of the query
     */
    addOptional() {
        let optionals = this.createOptional();
        this.addApplication(optionals.start);
        this.addApplication(optionals.end);
    },

    /**
     * Creates a set of linked start and end union applications
     */
    createUnion() {
        let uuid = UUID.createV4();
        return {
            start: StartUnionApplication.create({link: uuid}),
            end: EndUnionApplication.create({link: uuid})
        };
    },

    /**
     * Creates a set of linked start and end union applications, and adds them to the end of the query
     */
    addUnion() {
        let optionals = this.createUnion();
        this.addApplication(optionals.start);
        this.addApplication(optionals.end);
    },

    /**
     * Remove a linked application set by their shared link.
     */
    removeLinkedApplications(link) {
        let apps = this.get('application');
        let indices = apps.map((a, ind) => {
            if (a.get('link') === link) {
                return ind;
            }
        }).filter((a) => a !== undefined);
        indices.reverse().forEach((i) => apps.removeAt(i));
    },

    // convenience functions
    removeOptionalSet(link) {
        this.removeLinkedApplications(link);
    },

    removeUnionSet(link) {
        this.removeLinkedApplications(link);
    },

    /**
     * Creates a query string from the current query representation.
     * Strategy: Start with "select *", walk through the applications and build the query.
     *
     * todo add a computed property that does this?
     *
     * @returns {string} - the query string serialization
     */
    toQueryString() {
        // initialize clauses
        let prologue = this.__buildPrologue();
        let projections = this.__buildProjections();
        let dataset = this.__buildDataset();
        let body = this.__buildBody();
        let modifier = this.__buildModifier();

        let result = [];
        result.push(`# ${this.get('name')}`);
        if (this.get('description')) {
            result.push('#');
            // todo what to do about multiline description?
            result.push(`# ${this.get('description').replace('\n', '# \n')}`);
        }
        result.push('');

        if (prologue) { result.push(prologue.join('\n')); }

        let select = 'SELECT';
        // todo check?
        if (this.get('distinct')) {
            select += ' DISTINCT';
        } else if (this.get('reduced')) {
            select += ' REDUCED';
        }

        if (projections) { result.push(`\n${select} ${projections.join(' ')}`); }
        if (dataset) { result.push(dataset.join('\n')); }
        // todo not sure about this. leave empty where?
        result.push('WHERE {');
        if (body) { result.push(`\t${body.join('\n\t')}`); } else { result.push(''); }
        result.push('}');
        if (modifier) { result.push(modifier.join('\n')); }

        return result.join('\n');
    },

    /**
     * Combine prefixes to form the prologue.
     *
     * @returns {Array} - the list of prologue lines
     * @private
     */
    __buildPrologue() {
        let result;
        let prefixes = this.get('prefixes');
        let keys = Object.keys(prefixes);

        if (keys.length) {
            result = [];
            for (let key of keys) {
                result.push(`PREFIX ${key}: <${prefixes[key]}>`);
            }
        }

        return result;
    },

    /**
     * Combine regular variable projections and aggregates.
     *
     * @returns {Array|null} - the list of things to project (as strings), or null
     * @private
     */
    __buildProjections() {
        let projections = this.get('projections');
        let aggregates = this.get('aggregates');

        let selectAll = !projections.length && !aggregates.length;

        if (selectAll) {
            return ['*'];
        }

        let result = [];
        if (projections.length) {
            projections.forEach((p) => result.push(`?${p}`));
        }

        if (aggregates.length) {
            // todo checks
            aggregates.forEach((a) => result.push(this.__buildAggregate(a)));
        }

        return result;
    },

    // todo consider making utilities like this as static methods
    __buildAggregate(aggregate) {
        return `(${aggregate.get('expr').toString()} as ?${aggregate.get('target')})`;
    },

    /**
     * Generate FROM clauses.
     *
     * This currently returns null since we don't support FROM clauses.
     *
     * @returns {Array} - the list of FROM clauses
     * @private
     */
    __buildDataset() {

    },

    /**
     * Build the body of the query. This combines most parts of the query representation:
     * - nodes and edges by way of RelationshipApplications and CreateNodeApplications
     * - filters by way of FilterApplications
     *
     * @returns {Array}
     * @private
     */
    __buildBody() {
        let result = [];
        let apps = this.get('application');
        for (let app of apps) {
            switch (app.constructor) {
                case RelationshipApplication: {
                    let source = this.getNode(app.get('source'));
                    if (source instanceof LiteralNode) {
                        throw new Error("Cannot have a literal as the subject of a triple");
                    }
                    let s = this.__buildNode(source);

                    let edge = this.getEdge(app.get('edge'));
                    let p = this.__buildResource(edge);

                    let target = this.getNode(app.get('target'));
                    let o = this.__buildNode(target);

                    result.push(`${s} ${p} ${o} .`);

                    if (target instanceof InstanceNode && target.get('useClass')) {
                        // todo consider looking up rdf:type in graph instead of just making it here
                        let tmp = ClassNode.create({iri: target.get('instanceClass')});
                        let tmpBuilt = this.__buildResource(tmp);
                        result.push(`${o} rdf:type ${tmpBuilt} .`);
                    }

                    break;
                }
                // todo could we imply this on the relationship application?
                case CreateNodeApplication: {
                    let newNodeID = app.get('target');
                    let newNode = this.getNode(newNodeID);

                    // todo expr and variable checks?
                    let createExpression = newNode.get('expr');
                    let newVariable = newNode.get('variable');
                    result.push(`BIND(${createExpression.toString()} as ?${newVariable}) .`);

                    break;
                }
                case FilterApplication: {
                    let filterTargetNodeID = app.get('target');
                    let targetFilterID = app.get('filter');

                    // todo checks
                    let filterTargetNode = this.getNode(filterTargetNodeID);
                    let targetFilter = filterTargetNode.getFilter(targetFilterID);

                    result.push(`FILTER ${targetFilter.toString()} .`);

                    break;
                }
                case StartOptionalApplication:
                    result.push('OPTIONAL {');
                    break;

                case EndOptionalApplication:
                    result.push('}');
                    break;

                case StartUnionApplication:
                    result.push('UNION {');
                    break;

                case EndUnionApplication:
                    result.push('}');
                    break;

                default:
                    console.warn("Unhandled query application:", app);
            }
        }

        if (!result.length) {
            // todo force basic body here?
            // result.push("?s ?p ?o .");
            // console.warn("empty query body");
            result = null;
        }

        return result;
    },

    __buildNode(node) {
        if (node instanceof ResourceNode) {
            return this.__buildResource(node);
        } else if (node instanceof AdHocNode) {
            return this.__buildAdHocNode(node);
        } else if (node instanceof LiteralNode) {
            return this.__buildLiteralNode(node);
        } else {
            throw new Error("Unknown node type: " + node);
        }
    },

    // todo there has to be a better way for the three below
    __buildResource(resource) {
        if (resource.isUsingIRI()) {
            let reversePrefixes = this.get('reversePrefixes');
            // todo checks
            let maybeNS = reversePrefixes[resource.get('namespace')];
            if (maybeNS) {
                return `${maybeNS}:${resource.get('localName')}`;
            } else {
                return `<${resource.get('iri')}>`;
            }
        } else {
            return `?${resource.get('variable')}`;
        }
    },

    __buildLiteralNode(node) {
        if (node.isUsingVariable()) {
            return `?${node.get('variable')}`;
        } else {
            if (node.isUsingDataType()) {
                return `"${node.get('value')}"^^${node.get('dataType')}`;
            } else {
                return `"${node.get('value')}"`;
            }
        }
    },

    __buildAdHocNode(node) {
        return `?${node.get('variable')}`;
    },
    // end

    /**
     * Build the query modifier. Includes
     * - GROUP BY clauses by way of aggregates
     * - all constraints
     *
     * @returns {Array|null} - string lines of the SPARQL query for query modifiers
     * @private
     */
    __buildModifier() {
        let aggregates = this.get('aggregates');
        let orderConstraints = this.get('ordering');

        let results = [];

        let tmp = [];
        if (aggregates.length) {
            // todo checks
            aggregates.forEach((agg) => tmp.push(`?${agg.get('groups').join(' ?')}`));
        }
        if (tmp.length) {
            results.push(`GROUP BY ${tmp.join(' ')}`);
        }

        if (orderConstraints.length) {
            let orders = [];
            for (let constraint of orderConstraints) {
                let src = constraint.get('src');
                let maybeNode = this.getNode(src);
                if (maybeNode) {
                    // todo need to make sure the node variable is still valid
                    orders.push(`${constraint.get('type')}(?${maybeNode.get('variable')})`);
                }
                else {
                    let maybeAggregate = this.getAggregate(src);
                    if (!maybeAggregate) {
                        throw new Error("Failed to apply order constraint on nonexistent variable");
                    }
                    orders.push(`${constraint.get('type')}(?${maybeAggregate.get('target')})`);
                }
            }
            if (orders.length) {
                results.push(`ORDER BY ${orders.join(' ')}`);
            }
        }

        let limit = this.getLimit();
        if (limit)  {
            results.push(`LIMIT ${limit}`);
        }

        if (results.length) {
            return results;
        } else {
            return null;
        }
    },

    // todo checks on all three
    addPrefixes(map) {
        let prefixes = this.get('prefixes');
        let reversePrefixes = this.get('reversePrefixes');
        let keys = Object.keys(map);
        for (let key of keys) {
            if (map.hasOwnProperty(key)) {
                let thing = map[key];
                prefixes.set(key, thing);
                reversePrefixes[thing] = key;
            }
        }
    },

    addPrefix(key, ns) {
        this.get('prefixes').set(key, ns);
        this.get('reversePrefixes')[ns] = key;
    },

    removePrefix(key) {
        let prefixes = this.get('prefixes');
        let ns = prefixes.get(key);
        delete this.get('reversePrefixes')[ns];
        prefixes.set(key);
    }
});

QueryGraph.reopenClass({
    /**
     * Builds a query object from a query string.
     * Strategy: parse out variable projections, then constraints, then aggregates, then the rest of the body.
     *
     * todo do we actually support this?
     *
     * @param query - the query string
     * @param name - the name of the query
     * @param description - the description of the query
     */
    fromQueryString(query, name='anonymous-query', description='An anonymous query') {
        console.log("query", query);

        return QueryGraph.create({name, description});
    },
});

export default QueryGraph;
