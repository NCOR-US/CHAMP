import { later } from '@ember/runloop';
import EmberObject, { computed } from '@ember/object';
import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import RSVP from 'rsvp';
import moment from 'moment';
import { UriFactory } from 'process-workflow/data/data-utils';
// import { toEmberObject } from 'process-workflow/utilities/ember-utils';

export default Component.extend({
    store: service(),

    showFirstForm: true,
    formatString: "dddd, MMMM Do YYYY",

    processes: alias('model.processes.value'),
    processOptions: computed('processes.[]', function() {
        return this.get('processes').toArray().map(p => {
            return {
                id: p.get("id"),
                display: p.get("name")
            }
        });
    }),

    startDateView: computed('startDate', 'formatString', function() {
        let startDate = this.get('startDate');
        if (!startDate) {
            return "";
        }
        return startDate.format(this.get('formatString'));
    }),

    endDateView: computed('endDate', 'formatString', function() {
        let endDate = this.get('endDate');
        if (!endDate) {
            return "";
        }
        return endDate.format(this.get('formatString'));
    }),

    showBackToStart: computed('currentStep', function() {
        let currentStep = this.get('currentStep') || 0;
        return currentStep === 0;
    }),

    hasPreviousInProcess: computed('currentStep', 'store', function() {
        // todo have to pass the top-level stuff all the way through
        // let currentStep = this.get('currentStep');
        // let record = this.get('store').peekRecord('sub-process-spec', currentStep);
        // return record && (record.get('previousSubProcess.id') || record.get('processParts.length'));
        return false;
    }),

    hasNextInProcess: computed('currentStep', 'store', function() {
        // todo have to pass the top-level stuff all the way through
        // let currentStep = this.get('currentStep');
        // let record = this.get('store').peekRecord('sub-process-spec', currentStep);
        // return record && (record.get('nextSubProcess.id') || record.get('processParts.length'));
        return false;
    }),

    processTypeDisplay: computed('process.type', function() {
        let iri = this.get('process.type');
        if (iri) {
            let lastDelim = Math.max(iri.lastIndexOf('#'), iri.lastIndexOf('/'));
            let localName = iri.substring(lastDelim + 1);
            return localName.replace(/([A-Z])/g, ' $1');
        }
    }),

    selectedProduct: computed('process.output', function() {
        if (this.get('process.output.id')) {
            let output = this.get('process.output');

            // let record = this.get('store').peekRecord('artifact-spec', output);
            let lastDelim = Math.max(output.lastIndexOf('#'), output.lastIndexOf('/'));
            let localName = output.substring(lastDelim + 1);
            let display = localName.replace(/([A-Z])/g, ' $1');
            return EmberObject.create({
                id: output,
                display: display
            });
        }
    }),

    init() {
        this._super(...arguments);
        this.set('startDate', moment());

        this.set('dpasLevelOptions', [
            { value: '', display: 'Unrated' },
            { value: 'do', display: 'DO' },
            { value: 'dx', display: 'DX' }
        ]);

        this.set('dpasLevelOptions', [
            { value: '', display: 'Unrated' },
            { value: 'a1', display: 'A1' },
            { value: 'a2', display: 'A2' },
            { value: 'a3', display: 'A3' },
            { value: 'a4', display: 'A4' },
            { value: 'a5', display: 'A5' },
            { value: 'a6', display: 'A6' },
            { value: 'a7', display: 'A7' },
            { value: 'b1', display: 'B1' },
            { value: 'b8', display: 'B8' },
            { value: 'b9', display: 'B9' },
            { value: 'c1', display: 'C1' },
            { value: 'c2', display: 'C2' },
            { value: 'c3', display: 'C3' },
            { value: 'c9', display: 'C9' },
        ]);
    },

    getAllSteps(process) {
        return this.getNextStep(process.get("firstStep"), []);
    },

    getNextStep(promise, accumulator) {
        let _this = this;
        return promise.then((data) => {
            if (data) {
                accumulator.push(data);
                return _this.getNextStep(data.get("nextSubProcess"), accumulator);
            } else {
                return RSVP.resolve(accumulator);
            }
        })
    },

    convertRangeString(rangeString) {
        let result = [];

        let tmp = rangeString.replace(/\s/g, '');
        tmp.split(',').filter(t => !!t).forEach(t => {
            if (t.indexOf('-') > -1) {
                let rangeChunks = t.split('-');
                if (rangeChunks.length !== 2) {
                    console.warn("Not processing invalid range", t);
                } else {
                    let lower, upper;
                    try {
                        lower = parseInt(rangeChunks[0]);
                    } catch (e) {
                        console.warn("Not processing invalid number", lower);
                        return;
                    }
                    try {
                        upper = parseInt(rangeChunks[1]);
                    } catch (e) {
                        console.warn("Not processing invalid number", upper);
                        return;
                    }
                    for (let i = lower; i <= upper; i++) {
                        result.push(i);
                    }
                }
            } else {
                result.push(parseInt(t));
            }
        });

        return result;
    },

    saveProcess(processSpec) {
        let component = this;
        return processSpec.get('firstStep')
            .then(stepSpec => component.saveStep(stepSpec));
            // .then(() => component.saveConcreteProcess(processSpec));
    },

    saveStep(stepSpec) {
        let store = this.get('store');
        let outputLookup = this.get('outputLookup');
        let testOutputLookup = this.get('testOutputLookup');
        let saves = [];

        let step = store.createRecord('sub-process', {
            id: UriFactory.create("SubProcess-"),
            name: stepSpec.get("name"),
            type: stepSpec.get('type')
        });

        stepSpec.get('parentSubProcess').then(parent => step.set('parentProcess', parent));

        // eslint-disable-next-line ember/named-functions-in-promises
        stepSpec.get('inputs').then(inputs => {
            let inputsArray = inputs.toArray();
            for (let i = 0, ii = inputsArray.length; i < ii; i++) {
                let input = inputsArray[i];
                console.log("input spec:", input);
                // if (input.get('isUsed')) {
                let artifact = store.createRecord('artifact', {
                    id: UriFactory.create("Artifact-"),
                    name: input.get("name"),
                    type: input.get("type")
                });
                artifact.get('inputOf').pushObject(step);
                saves.push(artifact.save());
                // }
            }
        });

        // eslint-disable-next-line ember/named-functions-in-promises
        stepSpec.get('outputs').then(outputs => {
            let outputArray = outputs.toArray();
            for (let i = 0, ii = outputArray.length; i < ii; i++) {
                let output = outputArray[i];
                console.log("output spec:", output);

                // convert completedString, rejectedString and scrapString into numbers...
                let lookup = outputLookup.get(output.get('id'));

                let completedString = lookup.get('completedString');
                let completedSerials = component.convertRangeString(completedString);
                let rejectedString = lookup.get('rejectedString');
                let rejectedSerials = component.convertRangeString(rejectedString);
                let scrapString = lookup.get('scrapString');
                let scrapSerials = component.convertRangeString(scrapString);

                for (let i = 0, ii = completedSerials.length; i < ii; i++) {
                    let serial = completedSerials[i];
                    let rNum = component.getRandomInt(0, 1000000);
                    let artifact = store.createRecord('artifact', {
                        id: `urn:process-workflow:plans:generated:Artifact-Serial#${serial}-r-${rNum}`,
                        name: output.get("name"),
                        type: output.get("type")
                    });
                    artifact.get('outputOf').pushObject(step);
                    saves.push(artifact.save());
                }

                for (let i = 0, ii = rejectedSerials.length; i < ii; i++) {
                    // todo
                }

                for (let i = 0, ii = scrapSerials.length; i < ii; i++) {
                    // todo
                }
            }
        });

        // eslint-disable-next-line ember/named-functions-in-promises
        stepSpec.get('testValues').then(bearerSpecs => {
            let bearerArray = bearerSpecs.toArray();
            for (let i = 0, ii = bearerArray.length; i < ii; i++) {
                let bearerSpec = bearerArray[i];
                let lookup = testOutputLookup.get(bearerSpec.get('id'));

                lookup.forEach(container => {
                    if (container && container.get('value')) {
                        let bearer = store.createRecord('test-value-bearer', {
                            id: UriFactory.create('TestValueBearer-'),
                            type: bearerSpec.get('type'),
                            value: container.get('value')
                        });
                        bearer.set('subProcess', step);
                        saves.push(bearer.save());
                    }
                });
            }
        });

        // eslint-disable-next-line ember/named-functions-in-promises
        stepSpec.get('agents').then(agentSpecs => {
            let agentsArray = agentSpecs.toArray();
            for (let i = 0, ii = agentsArray.length; i < ii; i++) {
                let agentSpec = agentsArray[i];
                let agent = store.createRecord('agent', {
                    id: UriFactory.create("Agent-"),
                    name: agentSpec.get('realName'),
                    role: agentSpec.get('role')
                });

                agent.get('agentIn').pushObject(step);
                saves.push(agent.save());
            }
        });

        let component = this;

        // eslint-disable-next-line ember/named-functions-in-promises
        return RSVP.all(saves)
            .then(() => step.save())
            .then(() => step.get('processParts'))
            .then(parts => {
                if (parts) {
                    return RSVP.all(parts.map(partSpec => component.saveStep(partSpec)));
                } else {
                    return RSVP.resolve();
                }
            })
            .then(() => stepSpec.get('nextSubProcess'))
            .then(next => {
                if (next) {
                    return component.saveStep(next)
                } else {
                    return RSVP.resolve();
                }
            });
    },

    // inclusive min, exclusive max
    getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    },

    cleanupData() {
        this.set('currentStep');
        this.set('showFirstForm', true);

        this.set('product');
        this.set('quantity');
        this.set('customer');
        this.set('orderNumber');
        this.set('govtContract');
        this.set('dpasLevel');
        this.set('dpasSymbol');
    },

    // eslint-disable-next-line ember/order-in-components
    actions: {
        setFixture() {
            this.set('endDate', moment().add(1, 'week'));
            let processes = this.get('processes');
            if (!processes.length) {
                alert("Please create a process before setting the test fixture.");
                return;
            }

            let process = this.get('processes').toArray()[0];
            this.set('product', process.get('id'));
            this.set('quantity', 1000);
            this.set('customer', 'Customer Name');
            this.set('orderNumber', '12345-ABC-6789');
            this.set('govtContract', '9876-CBA-54321');
            this.set('dpasLevel', 'do');
            this.set('dpasSymbol', 'c9');
        },

        chooseStartDate(startDate) {
            this.set('startDate', moment(startDate));
            this.set('startDatePickerIsOpen', false);
        },

        chooseEndDate(endDate) {
            this.set('endDate', moment(endDate));
            this.set('endDatePickerIsOpen', false);
        },

        toggleProperty(name) {
            if (!this.get(name)) {
                this.set(name, true);
            } else {
                this.set(name, false);
            }
        },

        advanceToProcess() {
            // check all required things
            let requiredProperties = ['product', 'quantity', 'startDate', 'endDate'];
            let missingProperties = [];
            let message = "Please complete required fields: ";

            requiredProperties.forEach((prop) => {
                let value = this.get(prop);
                if (!value) {
                    missingProperties.push(prop);
                }
            });

            if (missingProperties.length) {
                message += missingProperties.join(", ");
                alert(message);

                return;
            }

            // check that the start and end dates are valid
            let startDate = this.get('startDate');
            let endDate = this.get('endDate');

            if (endDate.isBefore(startDate)) {
                alert("End date must be after start date");
                return;
            }

            // make sure DPAS is valid
            if (!!this.get('dpasLevel') !== !!this.get('dpasSymbol')) {
                alert("DPAS rating must have both level and symbol, or neither");
                return;
            }

            // todo create a new set of records to operate on

            // don't overwrite the existing process
            if (!this.get("process")) {
                let product = this.get('product');
                let process = this.get('store').peekRecord('process', product);
                this.set('process', process);

                let outputLookup = EmberObject.create();

                this.set('outputLookup', outputLookup);
                this.set('inputLookup', EmberObject.create());
                this.set('testOutputLookup', EmberObject.create());
            }

            let process = this.get('process');
            this.set('currentStep', process.get('firstStep.id'));
            this.set('showFirstForm', false);
        },

        finishProcess() {
            let component = this;

            let processSpec = this.get('process');
            // let concreteProcess = this.get('realProcess');

            // eslint-disable-next-line ember/named-functions-in-promises
            component.saveProcess(processSpec).then(() => {
                component.set('saveSuccessful', true);
                // todo better message
                if (confirm("Return to data input landing page?")) {
                    component.cleanupData();
                    later(() => { component.set('saveSuccessful') }, 2000);
                }
            }).catch((e) => {
                alert("Could not save data. See log for details.");
                console.error("Could not save data:", e);
            }).finally(() => component.set('isCurrentlySaving', false));
        },

        goToNextInProcess() {
            // todo have to pass the top-level stuff all the way through
            // let currentStep = this.get('currentStep');
            // let record = this.get('store').peekRecord('sub-process-spec', currentStep);
            // if (record.get('processParts.length')) {
            //     let component = this;
            //     record.get('processParts').then(parts => component.set('currentStep', parts[0].get('id')));
            // } else {
            //     this.set('currentStep', record.get('nextSubProcess.id'));
            // }
        },

        goToPreviousInProcess() {
            // todo have to pass the top-level stuff all the way through
            // let currentStep = this.get('currentStep');
            // let record = this.get('store').peekRecord('sub-process-spec', currentStep);
            // let prevID = record.get('previousSubProcess.id');
            // let prevRecord = this.get('store').peekRecord('sub-process-spec', prevID);
            // if (prevRecord.get('processParts.length')) {
            //     let component = this;
            //     prevRecord.get('processParts')
            //         .then(parts => component.set('currentStep', parts[parts.length-1].get('id')));
            // } else {
            //     this.set('currentStep', record.get('previousSubProcess.id'));
            // }
        },

        setCurrentStep(id) {
            this.set('currentStep', id);
        },

        goToInfo() {
            this.set('showFirstForm', true);
        },

        reset() {
            if (confirm("Discard all information and return to the start?")) {
                this.set('currentStep');
                this.set('showFirstForm', true);

                this.set('product');
                this.set('quantity');
                this.set('customer');
                this.set('orderNumber');
                this.set('govtContract');
                this.set('dpasLevel');
                this.set('dpasSymbol');
            }
        }
    }
});
