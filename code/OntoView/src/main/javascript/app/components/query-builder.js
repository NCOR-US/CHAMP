import { later } from '@ember/runloop';
import EmberObject, { computed, observer } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

import { AdHocNode, InstanceNode } from 'ontoview/data/query-node';
import QueryEdge from 'ontoview/data/query-edge';
import {
  RelationshipApplication,
  CreateNodeApplication,
  FilterApplication,
  StartLinkedApplication,
  EndLinkedApplication,
  StartOptionalApplication,
  EndOptionalApplication,
  StartUnionApplication,
  EndUnionApplication
} from 'ontoview/data/query-application';
import QueryAggregate from 'ontoview/data/query-aggregate';
import { OrderConstraint } from 'ontoview/data/query-constraint';
import {
  Operators,
  Functions,
  AggregateFunctions
} from 'ontoview/data/query-function';
import { UUID } from 'ontoview/data/data-utils';
import $ from 'jquery';

// testing
import FixtureFactory from 'ontoview/data/test-fixture';
import QueryGraph from 'ontoview/data/query-graph';

/* global URL */

export default Component.extend({
    entityQueryService: service('entity-query'),
    queryTracker: service('query-tracker'),
    utils: service('utilities'),

    bodyApplications: computed('query.application.[]', function() {
        let query = this.get('query');
        let apps = query.get('application');
        return apps
            .map((a) => {
                if (a instanceof RelationshipApplication) {
                    a.set('type', 'relationship');
                    return a;
                } else if (a instanceof CreateNodeApplication) {
                    a.set('type', 'createNode');
                    return a;
                } else if (a instanceof FilterApplication) {
                    a.set('type', 'filter');
                    return a;
                } else if (a instanceof StartOptionalApplication) {
                    a.set('type', 'startOptional');
                    return a;
                } else if (a instanceof EndOptionalApplication) {
                    a.set('type', 'endOptional');
                    return a;
                } else if (a instanceof StartUnionApplication) {
                    a.set('type', 'startUnion');
                    return a;
                } else if (a instanceof EndUnionApplication) {
                    a.set('type', 'endUnion');
                    return a;
                }
            })
            .filter((a) => !!a)
            .filter((a) => a.type);
    }),

    orderingList: computed('query.{variables,nodes,aggregates,ordering}.[]', function() {
        let query = this.get('query');
        let nodes = query.get('nodes');
        let aggregates = query.get('aggregates');
        let ordering = query.get('ordering');
        let result = [];
        nodes.forEach(node => {
            let maybeOrder = ordering
                .filter(order => order.get('src') === node.get('id') && node.isUsingVariable());
            let order = EmberObject.create();
            let checked = false;
            if (maybeOrder.length) {
                order = maybeOrder.get(0);
                checked = true;
            }
            result.pushObject(EmberObject.create({
                node: node,
                order: order,
                checked
            }));
        });

        aggregates.forEach(agg => {
            let maybeOrder = ordering.filter(order => order.get('src') === agg.get('id'));
            let order = EmberObject.create();
            let checked = false;
            if (maybeOrder.length) {
                order = maybeOrder.get(0);
                checked = true;
            }
            result.pushObject(EmberObject.create({
                aggregate: agg,
                order: order,
                checked
            }));
        });
        return result;
    }),

    newRowDropdownID: computed('utils', function() {
        return 'id' + UUID.createV4();
    }),

    // todo the warning below does need to be addressed
    __watchQuerySelectType: observer('querySelectType', function() { // eslint-disable-line ember/no-observers
        let query = this.get('query');
        let type = this.get('querySelectType');
        if (type === 'noMod') {
            query.setDistinct(false);
            query.setReduced(false);
        } else if (type === 'distinct') {
            query.setDistinct(true);
            query.setReduced(false);
        } else if (type === 'reduced') {
            query.setDistinct(false);
            query.setReduced(true);
        }
    }),

    init() {
        this._super(...arguments);

        this.set('augmentOptions', [
            {id: 'none', display: 'No changes'},
            {id: 'add', display: 'Change to variable'},
            {id: 'generalize', display: 'Generalize'},
            {id: 'specialize', display: 'Specialize'},
        ]);

        this.set('functions', Functions);
        this.set('aggregateFunctions', AggregateFunctions);

        // todo might just let operators exist inside function arguments
        this.set('operators', Operators);

        // need to set query select type based on input query
        let query = this.get('query');
        let querySelectType = 'noMod';
        if (query.isDistinct()) {
            querySelectType = 'distinct';
        } else if (query.isReduced()) {
            querySelectType = 'reduced';
        }

        this.set('querySelectType', querySelectType);
    },

    didInsertElement() {
        // let query = this.get('query');

        // shim for https://github.com/zurb/foundation-sites/issues/8975, appears to not be fixed in
        // foundation 5
        try {
            $(document).foundation('dropdown', 'reflow');
        } catch (e) {
            // squash or warn?
            // console.warn(e);
        }
        // console.log("query", query);
    },

    actions: {
        removeRow(index) {
            if (confirm("Are you sure you want to remove this?")) {
                let query = this.get('query');
                let apps = query.get('application');
                let toRemove = apps.objectAt(index);
                if (toRemove && toRemove.get('link')) {
                    query.removeLinkedApplications(toRemove.get('link'));
                }
                else {
                    apps.removeAt(index);
                }
            }
        },

        addRow(type) {
            let query = this.get('query');
            switch(type) {
                case 'optional':
                    query.addOptional();
                    break;

                case 'union':
                    query.addUnion();
                    break;

                case 'bgp': {
                    // get or create each node
                    let tmpLhs = InstanceNode.create({variable: 'changeThisSubject'});
                    let lhs = query.getNodeIfExists(tmpLhs);
                    if (!lhs) {
                        lhs = tmpLhs;
                        query.addNode(lhs);
                    }

                    let tmpEdge = QueryEdge.create({iri: 'http://localhost:8080/source/changeThisEdge'});
                    let edge = query.getEdgeIfExists(tmpEdge);
                    if (!edge) {
                        edge = tmpEdge;
                        query.addEdge(edge);
                    }

                    let tmpRhs = InstanceNode.create({variable: 'changeThisObject'});
                    let rhs = query.getNodeIfExists(tmpRhs);
                    if (!rhs) {
                        rhs = tmpRhs;
                        query.addNode(rhs);
                    }

                    // get or add the application
                    let relApp = RelationshipApplication.create({
                        source: tmpLhs.get('id'),
                        edge: tmpEdge.get('id'),
                        target: tmpRhs.get('id')
                    });

                    // todo check
                    query.addApplication(relApp);
                    break;
                }
                case 'bind': {
                    // create a new node
                    let base = 'var';
                    let counter = 0;
                    let variable;
                    let existingVariables = query.get('variables');
                    do {
                        variable = base + counter;
                        counter += 1;
                    } while (existingVariables.includes(variable));

                    let tmpNode = AdHocNode.create({
                        variable,
                        expr: Functions.RDF.UUID.create()
                    });

                    let node = query.getNodeIfExists(tmpNode);
                    if (!node) {
                        node = tmpNode;
                        query.addNode(node);
                    }

                    let createApp = CreateNodeApplication.create({target: node.get('id')});

                    // todo check
                    query.addApplication(createApp);
                    break;
                }
                case 'filter':
                    // if no nodes, refuse
                    if (!query.get('nodes').filter((n) => !!n.get('variable')).length) {
                        alert('No nodes to filter.');
                    } else {
                        // create a filter on the first available node
                        let node = query.get('nodes')[0];
                        let filter = Functions.Functional.BOUND.create({args: ['?'+node.get('variable')]});
                        node.addFilter(filter);

                        let filterApp = FilterApplication.create({
                            target: node.get('id'),
                            filter: filter.get('id')
                        });

                        // todo check
                        query.addApplication(filterApp);
                    }

                    break;

                default:
                    console.warn(`Cannot add row of unknown type ${type} to query`);
                    break;
            }
        },

        dropRow(newRow, oldRow) {
            let query = this.get('query');
            let apps = query.get('application');
            apps.splice(newRow, 0, apps.splice(oldRow, 1)[0]);
            this._recomputeLinkedRows();
            query.notifyPropertyChange('application');
        },

        // todo move these to sub-component
        startEditingName() {
            this.set('currentName', this.get('query.name'));
            this.set('editingName', true);
        },

        saveName() {
            let currentName = this.get('currentName');
            if (!currentName) {
                currentName = "Untitled";
            }
            this.set('query.name', this.get('currentName'));
            this.send('stopEditingName');
        },

        stopEditingName() {
            this.set('editingName', false);
        },

        startEditingDescription() {
            this.set('currentDescription', this.get('query.description'));
            this.set('editingDescription', true);
        },

        saveDescription() {
            this.set('query.description', this.get('currentDescription'));
            this.send('stopEditingDescription');
        },

        stopEditingDescription() {
            this.set('editingDescription', false);
        },

        addNewAggregate() {
            let aggregateFunctions = this.get('aggregateFunctions');
            let nodeVariables = this.get('query.nodeVariables');

            // if there isn't anything to aggregate across, warn and block
            if (!nodeVariables.length) {
                alert("No variables to aggregate over.");
            } else {
                this.get('query').addAggregate(QueryAggregate.create({
                    target: 'newVar',
                    groups: [nodeVariables[0]],
                    expr: aggregateFunctions['SUM'].create({params: [nodeVariables[0]]}),
                    isEditing: true
                }));
            }
        },

        handleGroupChange(aggregate, change) {
            if (change.selected) {
                aggregate.get('groups').pushObject(change.selected);
            } else {
                aggregate.get('groups').removeObject(change.deselected);
            }
        },

        editAggregate(aggregate) {
            aggregate.set('isEditing', true);
        },

        stopEditingAggregate(aggregate, index) {
            aggregate.set('isEditing', false);
            // invalidate aggregate
            let aggregates = this.get('query.aggregates');
            aggregates.replace(index, 1, aggregate);
        },

        removeAggregate(index) {
            if (confirm("Are you sure you want to remove this aggregate?")) {
                this.get('query.aggregates').removeAt(index);
            }
        },

        changeAggregateFnName(aggregate, changed) {
            aggregate.get('expr').set('name', changed.selected);
        },

        changeAggregateFnVariable(aggregate, change) {
            let args = aggregate.get('expr').get('args');
            if (change.selected) {
                args.pushObject(`?${change.variable}`);
            } else {
                args.removeObject(`?${change.variable}`);
            }
        },

        handleClickOrder(ordering) {
            later(() => {
                let node = ordering.get('node');
                let aggregate = ordering.get('aggregate');
                let id = node ? node.get("id") : aggregate.get('id');
                let order = ordering.get('order');
                let checked = ordering.get('checked');

                let query = this.get('query');
                let queryOrdering = query.get('ordering');

                if (checked) {
                    queryOrdering.pushObject(OrderConstraint.create({
                        src: id,
                        type: 'asc'
                    }));
                } else {
                    let index = queryOrdering.map(qo => qo.get("id") === order.get('id')).indexOf(true);
                    if (index > -1) {
                        queryOrdering.removeAt(index);
                    }
                }
            });
        },

        setOrderDirection(ordering, value) {
            let order = ordering.get('order');
            let query = this.get('query');
            query.get('ordering')
                .filter(ord => ord.get('id') === order.get('id'))
                .forEach(ord => ord.set('type', value));
        },

        updateShowCompanionApplication(link, isHighlighted) {
            this.get('query.application')
                .filter((app) => app.get('link') === link)
                .forEach((app) => app.set('highlightRow', isHighlighted));
            this.get('query').notifyPropertyChange('application');
        },

        saveQuery() {
            let query = this.get('query');
            let queryName = query.get('name');
            let fileName = queryName.toLowerCase().replace(' ', '-');

            // todo better download
            let result = query.toQueryString();
            let blob = new Blob([result], {type: 'application/sparql-query;charset=utf-8'});
            let url = URL.createObjectURL(blob);
            let downloader = document.getElementById('downloader');
            downloader.href = url;
            downloader.download = fileName + '.sparql';
            downloader.click();
        },

        setFixture() {
            this.set('testFixtureIsSet', true);
            this.set('query', FixtureFactory.createFixture().fixture);
        },

        removeFixture() {
            let entityQueryService = this.get('entityQueryService');

            this.set('testFixtureIsSet', false);
            let query = QueryGraph.create({name: 'Untitled'});
            query.addPrefixes(entityQueryService.get('ns'));
            this.set('query', query);
        },

        toggleProperty(property) {
            this.set(property, !this.get(property));
        }
    },

    _recomputeLinkedRows() {
        let apps = this.get('query.application');

        // need to reassign end lines
        let starts = apps.filter((app) => app instanceof StartLinkedApplication);
        let ends = apps.filter((app) => app instanceof EndLinkedApplication);
        ends.reverse();

        for (let i = 0, ii = starts.length; i < ii; i++) {
            let start = starts[i];
            let end = ends[i];
            end.set('link', start.get('link'));
        }
    }
});
