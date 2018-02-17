import { later } from '@ember/runloop';
import { computed } from '@ember/object';
import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import RSVP from 'rsvp';
import moment from 'moment';
import { UriFactory, ProcessUtils } from 'process-workflow/data/data-utils';

export default Component.extend({
    store: service(),
    router: service(),
    ontologies: service(),

    classNames: ['process-creator-form'],

    showStart: true,
    currentStep: 0,

    name: alias('process.name'),
    description: alias('process.description'),
    processType: alias('process.type'),

    products: computed('ontologies.productTypes.[]', function() {
        let ontologies = this.get('ontologies');
        let productTypes = ontologies.get('productTypes');
        let makeOption = this.__makeOption;
        let sortOptions = this.__sortOptions;

        return productTypes.map(makeOption).sort(sortOptions);
    }),

    allInputItems: computed('ontologies.[materialTypes.[],processedMaterialTypes.[],toolTypes.[],documentTypes.[]}', function() {
        let ontologies = this.get('ontologies');
        let materialTypes = ontologies.get('materialTypes');
        let processedMaterialTypes = ontologies.get('processedMaterialTypes');
        let toolTypes = ontologies.get('toolTypes');
        let documentTypes = ontologies.get('documentTypes');
        let makeOption = this.__makeOption;
        let sortOptions = this.__sortOptions;

        return {
            1: materialTypes.concat(processedMaterialTypes).map(makeOption).sort(sortOptions),
            2: toolTypes.map(makeOption).sort(sortOptions),
            3: documentTypes.map(makeOption).sort(sortOptions)
        };
    }),

    allOutputItems: computed('ontologies.subAssemblyTypes.[]', function() {
        let ontologies = this.get('ontologies');
        let subAssemblyTypes = ontologies.get('subAssemblyTypes');
        let makeOption = this.__makeOption;
        let sortOptions = this.__sortOptions;

        return {
            1: subAssemblyTypes.map(makeOption).sort(sortOptions)
        };
    }),

    selectedProduct: computed('product', 'products.[]', function() {
        let product = this.get('product');
        let products = this.get('products');
        // this is fine for now. todo typecasting with ===
        return products.filter(p => p.id == product).get(0);
    }),

    processTypes: computed('ontologies.processTypes.[]', function() {
        let ontologies = this.get('ontologies');
        let processTypes = ontologies.get('processTypes');
        let makeOption = this.__makeOption;
        let sortOptions = this.__sortOptions;

        return processTypes
            // .filter(t => t.iri.indexOf('#') > -1)
            .map(makeOption).sort(sortOptions);
    }),

    selectedProcessType: computed('process.type', 'processTypes.[]', function() {
        let processType = this.get('process.type');
        let processTypes = this.get('processTypes');
        // this is fine for now. todo typecasting with ===
        return processTypes.filter(t => t.id == processType).get(0);
    }),

    showBegin: computed('process.{name,type}', function() {
        return !!this.get('process.name') && !!this.get('process.type');
    }),

    canDeleteStep: computed('process.firstStep.{id,nextSubProcess.id}', function() {
        let process = this.get('process');
        let firstStepID = process.get('firstStep.id');
        if (!firstStepID) {
            return false;
        }

        let nextStepID = process.get('firstStep.nextSubProcess.id');
        return !!nextStepID;
    }),

    showBack: computed('currentStep', function() {
        let currentStep = this.get('currentStep');

        return currentStep > 0;
    }),

    showNext: computed('currentStep', function() {
        // let currentStep = this.get('currentStep');

        return false;
    }),

    init() {
        this._super(...arguments);

        // todo move to user/authentication service
        let store = this.get('store');
        let defaultUserID = UriFactory.create("Agent", "DEFAULT-USER");
        let maybeUser = store.peekRecord('agent', defaultUserID);
        if (!maybeUser) {
            maybeUser = store.createRecord('agent', {
                id: defaultUserID,
                name: 'Default User',
                username: 'default.user',
                joined: moment()
            });
            maybeUser.save();
        }
        this.set('currentUser', maybeUser);
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

    saveProcess(process) {
        let component = this;

        // remove description and notes if they are not filled out
        if (process.get("description") === "") {
            process.set("description");
        }

        if (process.get("notes") === "") {
            process.set("notes");
        }

        let product = this.get('product');
        if (product) {
            let productRecord = this.get('store').createRecord('artifact-spec', {
                id: UriFactory.create("Spec-Artifact-"),
                type: product,
                amount: 1
            });
            productRecord.save().then(() => process.set('output', product));
        }

        return process.get('firstStep')
            .then(step => component.saveStep(step))
            .then(() => process.save());
    },

    saveStep(step) {
        // remove description and notes if they are not filled out
        if (step.get("description") === "") {
            step.set("description");
        }

        if (step.get("notes") === "") {
            step.set("notes");
        }

        let allInputItems = this.get('allInputItems');
        let allOutputItems = this.get('allOutputItems');

        let saves = [];
        // eslint-disable-next-line ember/named-functions-in-promises
        step.get('inputs').then(inputs => {
            inputs.forEach(input => {
                let list = allInputItems[input.get('category')];
                let maybeNameIndex = list.map(x => x.id === input.get('type')).indexOf(true);
                if (maybeNameIndex > -1) {
                    input.set('name', list[maybeNameIndex].display);
                }

                if (!input.get('amount')) {
                    input.set('amount', 1);
                }

                input.get('inputOf').pushObject(step);
            });
            saves.push(inputs.save());
        });

        // eslint-disable-next-line ember/named-functions-in-promises
        step.get('outputs').then(outputs => {
            outputs.forEach(output => {
                let list = allOutputItems[output.get('category')];
                let maybeNameIndex = list.map(x => x.id === output.get('type')).indexOf(true);
                if (maybeNameIndex > -1) {
                    output.set('name', list[maybeNameIndex].display);
                }

                if (!output.get('amount')) {
                    output.set('amount', 1);
                }

                output.get('outputOf').pushObject(step);
            });
            saves.push(outputs.save());
        });

        // eslint-disable-next-line ember/named-functions-in-promises
        step.get('testValues').then(bearers => {
            bearers.forEach(bearer => {
                // todo require name?
                if (bearer.get('name') === '') {
                    bearer.set('name');
                }
            });
            saves.push(bearers.save());
        });

        // eslint-disable-next-line ember/named-functions-in-promises
        step.get('agents').then(agents => {
            agents.forEach(agent => agent.get('agentIn').pushObject(step));
            saves.push(agents.save());
        });

        let component = this;

        // eslint-disable-next-line ember/named-functions-in-promises
        return RSVP.all(saves)
            .then(() => step.save())
            .then(() => step.get('processParts'))
            .then((parts) => {
                if (parts) {
                    return RSVP.all(parts.map(part => component.saveStep(part)));
                } else {
                    return RSVP.resolve();
                }
            })
            .then(() => step.get('nextSubProcess'))
            .then(next => {
                if (next) {
                    return component.saveStep(next);
                } else {
                    return RSVP.resolve();
                }
            });
    },

    actions: { // eslint-disable-line ember/order-in-components
        // adding things to the process
        addStep() {
            let store = this.get('store');

            let subProcess = store.createRecord('sub-process-spec', {
                id: UriFactory.create("Spec-SubProcess-")
            });

            let currentStep = this.get('currentStep');
            let previous = store.peekRecord('sub-process-spec', currentStep);
            previous.get("nextSubProcess").then(next => { // eslint-disable-line ember/named-functions-in-promises
                previous.set('nextSubProcess', subProcess);
                if (next) {
                    subProcess.set('nextSubProcess', next);
                    next.set('previousSubProcess', subProcess);
                }
            });
        },

        // changing things via select
        setChosenData(container, key, changed) {
            container.set(key, changed.selected);
        },

        // navigation
        begin() {
            let store = this.get('store');
            let firstStep = store.createRecord('sub-process-spec', {
                id: UriFactory.create("Spec-SubProcess-")
            });
            let process = this.get('process');
            process.set('firstStep', firstStep);

            this.set('showStart', false);
            this.set('currentStep', firstStep.get('id'));
        },

        finish() {
            let process = this.get('process');
            let router = this.get('router');

            // todo summarize in a modal?

            let component = this;
            component.set('isCurrentlySaving', true);

            process.set('author', this.get('currentUser'));

            component.saveProcess(process).then(() => { // eslint-disable-line ember/named-functions-in-promises
                component.set('saveSuccessful', true);
                if (confirm("Return to processes?")) {
                    // component.cleanupData();
                    router.transitionTo('processes.index');
                } else {
                    later(() => { component.set('saveSuccessful') }, 2000);
                }
            }).catch((e) => {
                alert("Could not save process. See log for details.");
                console.error("Could not save process:", e);
            }).finally(() => {
                component.set('isCurrentlySaving', false);
            });
        },

        goToInfo() {
            this.set('showStart', true);
        },

        goBack() {
            console.log("going back one");
            // this.decrementProperty('currentStep');
        },

        goForward() {
            console.log("going forward one");
            // this.incrementProperty('currentStep');
        },

        setCurrentStep(id) {
            if (this.get('showStart')) {
                this.set('showStart', false);
            }
            this.set('currentStep', id);
        },


        // removing things from a process
        deleteSubProcess() {
            if (confirm("Are you sure you want to remove this sub-process?")) {
                let currentStep = this.get('currentStep');
                let step = this.get('store').peekRecord('sub-process-spec', currentStep);
                let process = this.get('process');
                let component = this;

                ProcessUtils.detachStep(process, step, (newCurrentStep) => component.set('currentStep', newCurrentStep));
            }
        },

        willDestroy() {
            this._super(...arguments);
            console.log("destroying stuff");
        }
    }
});
