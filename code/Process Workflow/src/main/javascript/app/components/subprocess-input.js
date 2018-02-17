import EmberObject, { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
    ontologies: service(),

    testValueTableHeaders: computed('step.testValues.[]', 'ontologies.unitsOfMeasure.[]', function() {
        let step = this.get('step');
        if (!step) {
            return;
        }

        let ontoUnits = this.get('ontologies.unitsOfMeasure');
        let testValues = step.get('testValues');

        return testValues.map(bearer => {
            let name = bearer.get('name');
            let uom = bearer.get('unitOfMeasure');
            let label;
            if (uom) {
                let maybeUOM = ontoUnits.filter(unit => unit.iri === uom).get(0);
                if (maybeUOM) {
                    label = maybeUOM.get("label");
                }
            }

            if (label) {
                return `${name} (${label})`;
            } else {
                return name;
            }
        })
    }),

    testValueTableData: computed('step.testValues.[]', function() {
        let step = this.get('step');
        if (!step) {
            return;
        }
        let testValues = step.get('testValues');
        let data = [];

        testValues.forEach(bearer => {
            let row = [];
            let amount = bearer.get('amount');
            if (amount) {
                for (let i = 0; i < amount; i++) {
                    row.push(EmberObject.create({
                        bearerID: bearer.get("id"),
                        value: ''
                    }));
                }
                data.push(row);
            }
        });

        return data;
    }),

    transposedTableData: computed('testValueTableData', function() {
        let tableData = this.get('testValueTableData');
        return tableData[0].map((x,i) => tableData.map(x => x[i]))
    }),

    didInsertElement() {
        // populate outputLookup. todo better
        let outputLookup = this.get('outputLookup');
        this.get('step.outputs').then(outputs => this.__saveOutputs(outputs, outputLookup));
        
        let testOutputLookup = this.get('testOutputLookup');
        this.get('step.testValues').then(bearers => this.__saveTestValues(bearers, testOutputLookup));
    },

    __saveOutputs(outputs, outputLookup) {
        outputs.forEach(output => {
            outputLookup.set(output.get("id"), EmberObject.create({
                completedString: '',
                rejectedString: '',
                scrapString: ''
            }));
        });
    },

    __saveTestValues(bearers, testOutputLookup) {
        bearers.forEach(bearer => {
            let amount = bearer.get('amount');
            let containers = [];
            for (let i = 0; i < amount; i++) {
                containers.push(EmberObject.create({
                    name: bearer.get('name') || 'Untitled',
                    value: ''
                }));
            }

            testOutputLookup.set(bearer.get('id'), containers);
        });

        this.set('columnPad', new Array(6));
    }
});
