import { computed, get } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { UriFactory } from 'process-workflow/data/data-utils';

export default Component.extend({
    store: service(),
    ontologies: service(),

    subProcessTypes: computed('ontologies.{subProcessTypes.[],testingProcessTypes.[]}', function() {
        let ontologies = this.get('ontologies');
        let subProcessTypes = ontologies.get('subProcessTypes');
        let testingProcessTypes = ontologies.get('testingProcessTypes');
        let makeOption = this.__makeOption;
        let sortOptions = this.__sortOptions;

        // need to filter out bad IRIs, todo follow up
        return subProcessTypes.filter(t => t.iri.indexOf('#') > -1)
            .concat(testingProcessTypes)
            .map(makeOption).sort(sortOptions);
    }),

    testValueTypes: computed('ontologies.testValueTypes.[]', function() {
        let ontologies = this.get('ontologies');
        let testValueTypes = ontologies.get('testValueTypes');
        let makeOption = this.__makeOption;
        let sortOptions = this.__sortOptions;

        return testValueTypes.map(makeOption).sort(sortOptions);
    }),

    agentRoles: computed('ontologies.roles.[]', function() {
        let ontologies = this.get('ontologies');
        let roles = ontologies.get('roles');
        let makeOption = this.__makeOption;
        let sortOptions = this.__sortOptions;

        return roles.map(makeOption).sort(sortOptions);
    }),

    uomOptions: computed('ontologies.unitsOfMeasure.[]', function() {
        let ontologies = this.get('ontologies');
        let unitsOfMeasure = ontologies.get('unitsOfMeasure');
        let makeOption = this.__makeOption;
        let sortOptions = this.__sortOptions;

        return unitsOfMeasure.map(makeOption).sort(sortOptions);
    }),

    init() {
        this._super(...arguments);
        this.set('inputTypes', [
            { id: 1, display: 'Material' },
            { id: 2, display: 'Tool' },
            { id: 3, display: 'Document' }
        ]);
        this.set('outputTypes', [
            { id: 1, display: 'Sub-assembly' }
        ]);
    },

    didInsertElement() {
        let step = this.get('step');
        let allInputItems = this.get('allInputItems');
        let allOutputItems = this.get('allOutputItems');
        // eslint-disable-next-line ember/named-functions-in-promises
        step.get('inputs').then(inputs => {
            inputs.forEach(input => {
                Object.keys(allInputItems).forEach(key => {
                    let category = get(allInputItems, key);
                    let maybeItem = category.filter(c => get(c, 'id') === input.get('type')).get(0);
                    if (maybeItem) {
                        input.set('category', key);
                        return true;
                    }
                });
            });
        }).then(() => step.get('outputs')).then(outputs => {
            outputs.forEach(output => {
                Object.keys(allOutputItems).forEach(key => {
                    let category = get(allOutputItems, key);
                    let maybeItem = category.filter(c => get(c, 'id') === output.get('type')).get(0);
                    if (maybeItem) {
                        output.set('category', key);
                        return true;
                    }
                });
            });
        })
    },

    __makeOption(t) {
        let iri = t.get('iri');
        let lastDelim = Math.max(iri.lastIndexOf('#'), iri.lastIndexOf('/'));
        let localName = iri.substring(lastDelim + 1);
        let display = t.get('label') || localName.replace(/([A-Z])/g, ' $1');
        return {
            id: t.get('iri'),
            title: t.get('definition') || '(No definition available)',
            display: display.trim()
        };
    },

    __sortOptions(a, b) {
        return a.display.toLocaleLowerCase().localeCompare(b.display.toLocaleLowerCase());
    },

    // eslint-disable-next-line ember/order-in-components
    actions: {
        showTask(...args) {
            // we need bubbling here
            // eslint-disable-next-line ember/closure-actions
            this.sendAction('showTask', ...args);
        },

        addInput(step) {
            let store = this.get('store');
            let artifact = store.createRecord('artifact-spec', {
                id: UriFactory.create("Spec-Artifact-"),
                amount: 1
            });
            step.get('inputs').pushObject(artifact);
        },

        addOutput(step) {
            let store = this.get('store');
            let artifact = store.createRecord('artifact-spec', {
                id: UriFactory.create("Spec-Artifact-"),
                amount: 1
            });
            step.get('outputs').pushObject(artifact);
        },

        addTestValueBearer(step) {
            let store = this.get('store');
            let artifact = store.createRecord('test-value-bearer-spec', {
                id: UriFactory.create("Spec-TestValueBearer-"),
                name: '',
            });
            artifact.get('subProcesses').pushObject(step);
            step.get('testValues').pushObject(artifact);
        },

        addAgent(step) {
            let store = this.get('store');
            let agent = store.createRecord('agent-spec', {
                id: UriFactory.create("Spec-Agent-")
            });
            step.get('agents').pushObject(agent);
        },

        addTask(step) {
            let childSteps = step.get('processParts');
            let newIndex = childSteps.get('length') + 1;

            let store = this.get('store');
            let newSubtask = store.createRecord('sub-process-spec', {
                id: UriFactory.create("Spec-SubProcess-"),
                name: 'New Subtask ' + newIndex,
                parentSubProcess: step
            });

            childSteps.pushObject(newSubtask);
        },

        // changing things via select
        setChosenData(container, key, changed) {
            container.set(key, changed.selected);
        },

        deleteInput(step, index) {
            step.get('inputs').removeAt(index);
        },

        deleteOutput(step, index) {
            step.get('outputs').removeAt(index);
        },

        deleteTestValueBearer(step, index) {
            step.get('testValues').removeAt(index);
        },

        deleteAgent(step, index) {
            step.get('agents').removeAt(index);
        },

        deleteTask(step, index) {
            step.get('processParts').removeAt(index);
        }
    }
});
