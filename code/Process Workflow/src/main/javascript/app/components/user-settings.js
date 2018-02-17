import EmberObject, { computed } from '@ember/object';
import { alias, union, collect } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
    ontologies: service(),

    classNames: ['user-settings'],

    unitsOfMeasure: alias('ontologies.unitsOfMeasure'),
    processTypes: alias('ontologies.processTypes'),
    productTypes: alias('ontologies.productTypes'),
    subProcessTypes: alias('ontologies.subProcessTypes'),
    testingProcessTypes: alias('ontologies.testingProcessTypes'),
    materialTypes: alias('ontologies.materialTypes'),
    processedMaterialTypes: alias('ontologies.processedMaterialTypes'),
    documentTypes: alias('ontologies.documentTypes'),
    testValueTypes: alias('ontologies.testValueTypes'),
    testDocumentTypes: alias('ontologies.testDocumentTypes'),
    toolTypes: alias('ontologies.toolTypes'),
    roles: alias('ontologies.roles'),
    subAssemblyTypes: alias('ontologies.subAssemblyTypes'),

    // subProcessTypes should concat testingProcessTypes
    subProcessTypesConcat: union('subProcessTypes', 'testingProcessTypes'),
    materialTypesConcat: union('materialTypes', 'processedMaterialTypes'),

    ontologyConfigs: alias('ontologies.config'),

    dropdowns: collect('unitsOfMeasure', 'processTypes', 'productTypes', 'subProcessTypesConcat',
        'testingProcessTypes', 'materialTypesConcat', 'documentTypes', 'testValueTypes', 'testDocumentTypes',
        'toolTypes', 'roles', 'subAssemblyTypes'),

    dropdownConfigs: computed('dropdownNames', 'dropdownLabels', 'dropdowns', function() {
        let dropdownNames = this.get('dropdownNames');
        let dropdownLabels = this.get('dropdownLabels');
        let dropdowns = this.get('dropdowns');

        let component = this;
        let configs = dropdownNames.reduce(function(acc, name, index) {
            let options = dropdowns[index];
            acc.push(EmberObject.create({
                name: name,
                label: dropdownLabels[index],
                options: options.map(component.__makeOption).sort(component.__sortOptions)
            }));
            return acc;
        }, []);

        // todo better
        let ontologyConfigs = this.get('ontologyConfigs');
        configs[3].set('multiConfig', [
            ontologyConfigs.get('subProcessTypes'),
            ontologyConfigs.get('testingProcessTypes')
        ]);

        configs[5].set('multiConfig', [
            ontologyConfigs.get('materialTypes'),
            ontologyConfigs.get('processedMaterialTypes')
        ]);

        return configs;
    }),

    init() {
        this._super(...arguments);

        this.set('dropdownLabels', ['Units of Measure', 'Process Types', 'Product Types', 'Sub-process types',
            'Testing Process Types', 'Material Types', 'Document Types', 'Test Value Types', 'Test Document Types',
            'Tool Types', 'Roles', 'Sub-assembly Types']);

        this.set('dropdownNames', ['unitsOfMeasure', 'processTypes', 'productTypes', 'subProcessTypesConcat',
            'testingProcessTypes', 'materialTypesConcat', 'documentTypes', 'testValueTypes', 'testDocumentTypes',
            'toolTypes', 'roles', 'subAssemblyTypes']);
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
});
