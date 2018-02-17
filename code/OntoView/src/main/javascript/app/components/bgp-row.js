import { hashSettled } from 'rsvp';
import { or, equal } from '@ember/object/computed';
import { computed, observer } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

import {
  AdHocNode,
  ClassNode,
  LiteralNode,
  InstanceNode
} from 'ontoview/data/query-node';

export default Component.extend({
    entityQueryService: service('entity-query'),

    classNames: ['query-bgp-row'],

    showIRI: or('subjectIsClass', 'subjectIsInstance'),

    showObjectIRI: or('objectIsClass', 'objectIsInstance'),

    adhocNodes: computed('query.nodes.[]', function() {
        let query = this.get('query');
        let nodes = query.get('nodes');
        return nodes.filter((node) => node instanceof AdHocNode);
    }),

    subjectNode: computed('row.source', function() {
        let query = this.get('query');
        let source = this.get('row.source');
        return query.getNode(source);
    }),

    subjectIsClass: computed('subjectNode', function() {
        return this.get('subjectNode') instanceof ClassNode;
    }),

    subjectIsInstance: computed('subjectNode', function() {
        return this.get('subjectNode') instanceof InstanceNode;
    }),

    subjectIsAdHoc: computed('subjectNode', function() {
        return this.get('subjectNode') instanceof AdHocNode;
    }),

    subjectView: computed('subjectNode.{active,iri,variable}', function() {
        let query = this.get('query');
        let subjectNode = this.get('subjectNode');
        return query.__buildNode(subjectNode);
    }),

    predicate: computed('row.edge', function() {
        let query = this.get('query');
        let tmp = this.get('row.edge');
        return query.getEdge(tmp);
    }),

    predicateView: computed('predicate.{active,iri,variable}', function() {
        let query = this.get('query');
        let predicate = this.get('predicate');
        return query.__buildResource(predicate);
    }),

    objectNode: computed('row.target', function() {
        let query = this.get('query');
        let target = this.get('row.target');
        return query.getNode(target);
    }),

    objectIsClass: computed('objectNode', function() {
        return this.get('objectNode') instanceof ClassNode;
    }),

    objectIsInstance: computed('objectNode', function() {
        return this.get('objectNode') instanceof InstanceNode;
    }),

    objectIsAdHoc: computed('objectNode', function() {
        return this.get('objectNode') instanceof AdHocNode;
    }),

    objectIsLiteral: computed('objectNode', function() {
        return this.get('objectNode') instanceof LiteralNode;
    }),

    objectView: computed('objectNode.{active,iri,value,variable}', function() {
        let query = this.get('query');
        let node = this.get('objectNode');
        return query.__buildNode(node);
    }),

    objectClassView: computed('objectNode', function() {
        let query = this.get('query');
        let objectNode = this.get('objectNode');
        if (this.get('objectIsInstance') && objectNode.get('useClass')) {
            let instanceClass = objectNode.get('instanceClass');
            if (instanceClass) {
                return query.__buildResource(ClassNode.create({iri: instanceClass}));
            }
        }
    }),

    // _getOldNode(oldType, isObject) {
    //     return isObject ? this.get('oldObjectNode_' + oldType) : this.get('oldSubjectNode_' + oldType);
    // },

    _convertNode(node, oldType, newType, isObject = false) {

        let newNode;
        if (newType === 'class') {
            // default to BFO entity??
            let iri = node.get('instanceClass') || node.get('iri') || 'http://purl.obolibrary.org/obo/BFO_0000001';
            newNode = ClassNode.create({iri});
        }
        else if (newType === 'instance') {
            // carry over iri if it was a class
            let iri = node.get('instanceClass') || node.get('iri') || 'http://localhost:8080/source/NewIdentifier';
            newNode = InstanceNode.create({iri});
        }
        else if (newType === 'adhoc') {
            let nodes = this.get('query.nodes').filter((node) => node instanceof AdHocNode);
            if (nodes.length) {
                newNode = nodes[0];
            }
        }
        else if (isObject && newType === 'literal') {
            // completely new node
            // todo probably need to handle duplicate value
            newNode = LiteralNode.create({value: 'newLiteral'});
        }
        else {
            // unknown
            console.warn("Unknown target node type:", newType);
        }

        // merge with old properties if it exists and is not adhoc
        // if (newType !== 'adhoc' && newNode) {
        //     // need to deal with filters...
        //     let oldNode = this._getOldNode(oldType, isObject);
        //     if (oldNode) {
        //         newNode.merge(oldNode);
        //     }
        // }

        return newNode;
    },

    subjectNodeType: computed('subjectNode', { // eslint-disable-line ember/order-in-components
        set(key, newType, oldType) {
            let subjectNode = this.get('subjectNode');

            // store this current node to build off of later
            // this.set('oldSubjectNode_' + oldType, subjectNode);

            // create a new node
            let newNode = this._convertNode(subjectNode, oldType, newType);

            if (!newNode) {
                console.warn(`Cannot create undefined node for type transition ${oldType} to ${newType}`);
            } else {
                if (newType !== 'adhoc') {
                    let query = this.get('query');
                    // todo does this leak subjectNode?
                    query.removeNode(subjectNode.get('id'));
                    query.addNode(newNode);
                }
                this.set('row.source', newNode.get("id"));
            }

            return newType;
        },

        get() {
            let subjectNode = this.get('subjectNode');
            if (subjectNode instanceof ClassNode) {
                return 'class';
            }
            else if (subjectNode instanceof InstanceNode) {
                return 'instance';
            }
            else if (subjectNode instanceof AdHocNode) {
                return 'adhoc';
            }

            return 'unknown';
        }
    }),

    objectNodeType: computed('objectNode', { // eslint-disable-line ember/order-in-components
        set(key, newType, oldType) {
            let objectNode = this.get('objectNode');
            let newNode = this._convertNode(objectNode, oldType, newType, true);

            if (!newNode) {
                console.warn(`Cannot create undefined node for type transition ${oldType} to ${newType}`);
            } else {
                if (newType !== 'adhoc') {
                    let query = this.get('query');
                    // todo does this leak objectNode?
                    query.removeNode(objectNode.get('id'));
                    query.addNode(newNode);
                }
                this.set('row.target', newNode.get("id"));
            }

            return newType;
        },

        get() {
            let objectNode = this.get('objectNode');
            if (objectNode instanceof ClassNode) {
                return 'class';
            }
            else if (objectNode instanceof InstanceNode) {
                return 'instance';
            }
            else if (objectNode instanceof LiteralNode) {
                return 'literal';
            }
            else if (objectNode instanceof AdHocNode) {
                return 'adhoc';
            }

            return 'unknown';
        }
    }),

    subjectClassChange: 'exact', // eslint-disable-line ember/order-in-components
    generalizeSubjectClass: equal('subjectClassChange', 'generalize'), // eslint-disable-line ember/order-in-components
    specializeSubjectClass: equal('subjectClassChange', 'specialize'), // eslint-disable-line ember/order-in-components
    augmentSubjectClass: or('generalizeSubjectClass', 'specializeSubjectClass'), // eslint-disable-line ember/order-in-components
    __watchSubjectClassChange: observer('subjectClassChange', function() { // eslint-disable-line
        let subjectClassChange = this.get('subjectClassChange');
        let gTargets = this.get('subjectInstanceClassGeneralizeTargets');
        let sTargets = this.get('subjectInstanceClassSpecializeTargets');

        if (subjectClassChange === 'generalize' && (!gTargets || !gTargets.length)) {
            this.findSubjectGeneralizeTargets();
        } else if (subjectClassChange === 'specialize' && (!sTargets || !sTargets.length)) {
            this.findSubjectSpecializeTargets();
        }
    }),

    findSubjectGeneralizeTargets() {
        let queryService = this.get('entityQueryService');
        let subjectNode = this.get('subjectNode');
        let instanceClass = subjectNode.get('instanceClass');
        if (!instanceClass) {
            this.set('subjectInstanceClassGeneralizeTargets', []);
            return;
        }

        let unpacked = queryService.unpackIRI(instanceClass);
        let display = unpacked.prefix ? `${unpacked.prefix}:${unpacked.localName}` : instanceClass;

        hashSettled({
            superClass: queryService.getSuperClassChain(instanceClass),
            info: queryService.getInfoForEntity(instanceClass)
        }).then((hash) => this.__handleSubjectGeneralizeTargets(hash, display, instanceClass));
    },

    __handleSubjectGeneralizeTargets(hash, display, instanceClass) {
        if (hash.superClass.state === 'fulfilled') {
            let label, description;
            if (hash.info.state === 'fulfilled') {
                label = hash.info.value.label;
                description = hash.info.value.desc;
            } else {
                label = '(no label)';
                description = '(no description)';
            }

            let result = hash.superClass.value;
            result = result.reverse();
            result.pushObject({
                value: instanceClass,
                display, label, description
            });
            this.set('subjectInstanceClassGeneralizeTargets', result);
        } else {
            console.error(hash.superclass.reason);
            this.set('subjectInstanceClassGeneralizeTargets', [instanceClass]);
        }
    },

    findSubjectSpecializeTargets() {
        let queryService = this.get('entityQueryService');
        let subjectNode = this.get('subjectNode');
        let instanceClass = subjectNode.get('instanceClass');
        if (!instanceClass) {
            this.set('subjectInstanceClassSpecializeTargets', []);
            return;
        }

        let unpacked = queryService.unpackIRI(instanceClass);
        let display = unpacked.prefix ? `${unpacked.prefix}:${unpacked.localName}` : instanceClass;
        display += ' - parent';


        hashSettled({
            subClasses: queryService.getDirectChildren(instanceClass),
            info: queryService.getInfoForEntity(instanceClass)
        }).then((hash) => this.__handleSubjectSpecializeTargets(hash, display, instanceClass));
    },

    __handleSubjectSpecializeTargets(hash, display, instanceClass) {
        if (hash.subClasses.state === 'fulfilled') {
            let label, description;
            if (hash.info.state === 'fulfilled') {
                label = hash.info.value.label;
                description = hash.info.value.desc;
            } else {
                label = '(no label)';
                description = '(no description)';
            }

            let result = hash.subClasses.value;
            if (result) {
                result.unshiftObject({
                    value: instanceClass,
                    display, label, description
                });

                this.set('subjectInstanceClassSpecializeTargets', result);
            }
        } else {
            console.error(hash.superclass.reason);
            this.set('subjectInstanceClassSpecializeTargets', [instanceClass]);
        }
    },

    objectClassChange: 'exact', // eslint-disable-line ember/order-in-components
    generalizeObjectClass: equal('objectClassChange', 'generalize'), // eslint-disable-line ember/order-in-components
    specializeObjectClass: equal('objectClassChange', 'specialize'), // eslint-disable-line ember/order-in-components
    augmentClass: or('generalizeObjectClass', 'specializeObjectClass'), // eslint-disable-line ember/order-in-components
    __watchObjectClassChange: observer('objectClassChange', function() { // eslint-disable-line
        let objectClassChange = this.get('objectClassChange');
        let gTargets = this.get('objectInstanceClassGeneralizeTargets');
        let sTargets = this.get('objectInstanceClassSpecializeTargets');

        if (objectClassChange === 'generalize' && (!gTargets || !gTargets.length)) {
            this.findObjectGeneralizeTargets();
        } else if (objectClassChange === 'specialize' && (!sTargets || !sTargets.length)) {
            this.findObjectSpecializeTargets();
        }
    }),

    findObjectGeneralizeTargets() {
        let queryService = this.get('entityQueryService');
        let objectNode = this.get('objectNode');
        let instanceClass = objectNode.get('instanceClass');
        if (!instanceClass) {
            this.set('objectInstanceClassGeneralizeTargets', []);
            return;
        }

        let unpacked = queryService.unpackIRI(instanceClass);
        let display = unpacked.prefix ? `${unpacked.prefix}:${unpacked.localName}` : instanceClass;

        hashSettled({
            superClass: queryService.getSuperClassChain(instanceClass),
            info: queryService.getInfoForEntity(instanceClass)
        }).then((hash) => this.__handleObjectGeneralizeTargets(hash, display, instanceClass));
    },

    __handleObjectGeneralizeTargets(hash, display, instanceClass) {
        if (hash.superClass.state === 'fulfilled') {
            let label, description;
            if (hash.info.state === 'fulfilled') {
                label = hash.info.value.label;
                description = hash.info.value.desc;
            } else {
                label = '(no label)';
                description = '(no description)';
            }

            let result = hash.superClass.value;
            result = result.reverse();
            result.pushObject({
                value: instanceClass,
                display, label, description
            });
            this.set('objectInstanceClassGeneralizeTargets', result);
        } else {
            console.error(hash.superclass.reason);
            this.set('objectInstanceClassGeneralizeTargets', [instanceClass]);
        }
    },

    findObjectSpecializeTargets() {
        let queryService = this.get('entityQueryService');
        let objectNode = this.get('objectNode');
        let instanceClass = objectNode.get('instanceClass');
        if (!instanceClass) {
            this.set('objectInstanceClassSpecializeTargets', []);
            return;
        }

        let unpacked = queryService.unpackIRI(instanceClass);
        let display = unpacked.prefix ? `${unpacked.prefix}:${unpacked.localName}` : instanceClass;
        display += ' - parent';


        hashSettled({
            subClasses: queryService.getDirectChildren(instanceClass),
            info: queryService.getInfoForEntity(instanceClass)
        }).then((hash) => this.__handleObjectSpecializeTargets(hash, display, instanceClass));
    },

    __handleObjectSpecializeTargets(hash, display, instanceClass) {
        if (hash.subClasses.state === 'fulfilled') {
            let label, description;
            if (hash.info.state === 'fulfilled') {
                label = hash.info.value.label;
                description = hash.info.value.desc;
            } else {
                label = '(no label)';
                description = '(no description)';
            }

            let result = hash.subClasses.value;
            result.unshiftObject({
                value: instanceClass,
                display, label, description
            });

            this.set('objectInstanceClassSpecializeTargets', hash.subClasses.value);
        } else {
            console.error(hash.superclass.reason);
            this.set('objectInstanceClassSpecializeTargets', [instanceClass]);
        }
    },

    actions: { // eslint-disable-line ember/order-in-components
        toggleEditingSubject() {
            if (this.get('editing') === 'subject') {
                this.set('editing');
            } else {
                this.set('editing', 'subject');
            }
        },

        toggleUseSubjectVariable() {
            // todo should change this
            let subjectNode = this.get('subjectNode');

            if (subjectNode.isUsingVariable()) {
                subjectNode.useIRI();
            } else {
                subjectNode.useVariable();
            }

            // todo this is probably heavy
            let nodes = this.get('query.nodes');
            nodes.arrayContentDidChange(0, nodes.length-1, nodes.length-1);
            nodes.filter(node => node.get("id") === subjectNode.get("id"))
                .forEach(node => node.notifyPropertyChange('active'));
        },

        toggleUseSubjectClass() {
            // todo should change this
            let subjectNode = this.get('subjectNode');

            if (subjectNode.get('useClass')) {
                subjectNode.set('useClass');
            } else {
                subjectNode.set('useClass', true);
            }
        },

        toggleEditingPredicate() {
            if (this.get('editing') === 'predicate') {
                this.set('editing');
            } else {
                this.set('editing', 'predicate');
            }
        },

        toggleUsePredicateVariable() {
            let predicate = this.get('predicate');
            if (predicate.isUsingVariable()) {
                predicate.useIRI();
            } else {
                predicate.useVariable();
            }

            // todo this is probably heavy
            let edges = this.get('query.edges');
            edges.arrayContentDidChange(0, edges.length-1, edges.length-1);
            edges.filter(edge => edge.get("id") === predicate.get("id"))
                .forEach(edge => edge.notifyPropertyChange('active'));
        },

        toggleEditingObject() {
            if (this.get('editing') === 'object') {
                this.set('editing');
            } else {
                this.set('editing', 'object');
            }
        },

        toggleUseObjectVariable() {
            // todo should change this
            let objectNode = this.get('objectNode');

            if (objectNode.isUsingVariable()) {
                objectNode.useIRI();
            } else {
                objectNode.useVariable();
            }

            // todo this is probably heavy
            let nodes = this.get('query.nodes');
            nodes.arrayContentDidChange(0, nodes.length-1, nodes.length-1);
            nodes.filter(node => node.get("id") === objectNode.get("id"))
                .forEach(node => node.notifyPropertyChange('active'));
        },

        toggleUseObjectClass() {
            // todo should change this
            let objectNode = this.get('objectNode');

            if (objectNode.get('useClass')) {
                objectNode.set('useClass');
            } else {
                objectNode.set('useClass', true);
            }
        },

        findSubjectClassTargets() {
            if (this.get('generalizeSubjectClass')) {
                this.findSubjectGeneralizeTargets();
            } else {
                this.findSubjectSpecializeTargets();
            }
        },

        pickSubjectGeneralizeTarget(target) {
            this.get('subjectNode').set('instanceClass', target.value);
            this.notifyPropertyChange('subjectNode');
        },

        pickSubjectSpecializeTarget(target) {
            this.get('subjectNode').set('instanceClass', target.value);
            this.notifyPropertyChange('subjectNode');
        },

        findObjectClassTargets() {
            if (this.get('generalizeObjectClass')) {
                this.findObjectGeneralizeTargets();
            } else {
                this.findObjectSpecializeTargets();
            }
        },

        pickObjectGeneralizeTarget(target) {
            this.get('objectNode').set('instanceClass', target.value);
            this.notifyPropertyChange('objectNode');
        },

        pickObjectSpecializeTarget(target) {
            this.get('objectNode').set('instanceClass', target.value);
            this.notifyPropertyChange('objectNode');
        },

        changeSelectedAdhocSubjectNode(selected) {
            // this makes the change instantly, cannot cancel
            this.get("row").set('source', selected);
        },

        changeSelectedAdhocObjectNode(selected) {
            // this makes the change instantly, cannot cancel
            this.get("row").set('target', selected);
        },

        stopEditing() {
            this.set('editing');
        }
    }
});
