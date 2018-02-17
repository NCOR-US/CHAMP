import EmberObject from '@ember/object';
import Service from '@ember/service';
import RSVP from 'rsvp';
import $ from 'jquery';
import { toEmberObject } from 'process-workflow/utilities/ember-utils';
import config from '../config/environment';

export default Service.extend({
    initialize() {
        // todo better organization for exposure through UI
        this.set('config', EmberObject.create());

        return RSVP.hashSettled({
            unitsOfMeasure: this.__initUOM(),

            processTypes: this.__initProperty('processTypes', 'ontologies/classes', {
                parentClass: 'http://www.semanticweb.org/no/ontologies/2017/1/PLC-ontology#ActOfProduction',
                ontologyIRI: 'http://www.semanticweb.org/no/ontologies/2017/1/PLC-ontology',
                deepSearch: true
            }),

            productTypes: this.__initProperty('productTypes', 'ontologies/classes', {
                parentClass: 'http://www.ontologyrepository.com/CommonCoreOntologies/Artifact',
                ontologyIRI: 'http://www.ontologyrepository.com/CommonCoreOntologies',
                deepSearch: false
            }),

            subProcessTypes: this.__initProperty('subProcessTypes', 'ontologies/classes', {
                parentClass: 'http://www.ontologyrepository.com/CommonCoreOntologies/IntentionalAct',
                ontologyIRI: 'http://www.semanticweb.org/ontologies/ManufacturingProcessOntology',
                deepSearch: true
            }),

            testingProcessTypes: this.__initProperty('testingProcessTypes', 'ontologies/classes', {
                parentClass: 'http://www.ontologyrepository.com/CommonCoreOntologies/ActOfAppraisal',
                ontologyIRI: 'http://www.semanticweb.org/ontologies/TestingProcessOntology',
                deepSearch: true
            }),

            materialTypes: this.__initProperty('materialTypes', 'ontologies/classes', {
                parentClass: 'http://www.ontologyrepository.com/CommonCoreOntologies/MachineElement',
                ontologyIRI: '',
                deepSearch: false
            }),

            processedMaterialTypes: this.__initProperty('processedMaterialTypes', 'ontologies/classes', {
                parentClass: 'http://www.ontologyrepository.com/CommonCoreOntologies/PortionOfProcessedMaterial',
                ontologyIRI: '',
                deepSearch: false
            }),

            documentTypes: this.__initProperty('documentTypes', 'ontologies/classes', {
                parentClass: 'http://www.ontologyrepository.com/CommonCoreOntologies/Document', // also Report?
                ontologyIRI: 'http://www.semanticweb.org/no/ontologies/2017/2/Widget',
                deepSearch: true
            }),

            testValueTypes: this.__initProperty('testValueTypes', 'ontologies/classes', {
                parentClass: 'http://www.ontologyrepository.com/CommonCoreOntologies/TestValueBearer',
                ontologyIRI: 'http://www.ontologyrepository.com/CommonCoreOntologies',
                deepSearch: true
            }),

            testDocumentTypes: this.__initProperty('testDocumentTypes', 'ontologies/classes', {
                parentClass: 'http://www.ontologyrepository.com/CommonCoreOntologies/Spreadsheet', // also Report?
                ontologyIRI: 'http://www.semanticweb.org/no/ontologies/2017/2/Widget',
                deepSearch: true
            }),

            toolTypes: this.__initProperty('toolTypes', 'ontologies/classes', {
                parentClass: 'http://www.ontologyrepository.com/CommonCoreOntologies/Tool', // also Artifact, MachineElement
                ontologyIRI: 'http://www.semanticweb.org/ontologies/ToolOntology',
                deepSearch: true
            }),

            roles: this.__initProperty('roles', 'ontologies/classes', {
                parentClass: 'http://purl.obolibrary.org/obo/BFO_0000023',
                ontologyIRI: 'http://www.semanticweb.org/no/ontologies/2017/2/Widget', // also others?
                deepSearch: true
            }),

            subAssemblyTypes: this.__initProperty('subAssemblyTypes', 'ontologies/classes', {
                parentClass: 'http://www.ontologyrepository.com/CommonCoreOntologies/Artifact',
                ontologyIRI: 'http://www.semanticweb.org/no/ontologies/2017/2/Widget',
                deepSearch: true
            })
        });
    },

    __initUOM() {
        let service = this;
        return new RSVP.Promise(function(resolve, reject) {
            $.ajax({
                url: config.rootURL + 'ontologies/units-of-measure',
                method: 'GET',
                dataType: 'json',
                success(data) {
                    service.set('unitsOfMeasure', toEmberObject(data.data));
                    resolve();
                },
                error(xhr) {
                    console.error("xhr:", xhr);
                    reject(`error getting units of measure: ${xhr.statusText}`);
                }
            });
        });
    },

    __initProperty(property, endpoint, params) {
        let service = this;
        return new RSVP.Promise(function(resolve, reject) {
            $.ajax({
                url: config.rootURL + endpoint,
                method: 'POST',
                dataType: 'json',
                data: JSON.stringify(params),
                contentType: 'application/json; charset=UTF-8',
                processData: false,
                success(data) {
                    service.set(property, toEmberObject(data.data));
                    service.get('config').set(property, params);
                    resolve();
                },
                error(xhr) {
                    console.error("xhr:", xhr);
                    reject(`error getting ${property}: ${xhr.statusText}`);
                }
            });
        });
    }
});
