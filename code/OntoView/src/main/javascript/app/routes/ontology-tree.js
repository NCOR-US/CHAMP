import { computed, get } from '@ember/object';
import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import $ from 'jquery';
import { listToHierarchy } from 'ontoview/data/data-utils';

export default Route.extend({
    configs: service(),
    utilities: service(),

    ontologyGraphURI: alias('configs.appConfig.ontologyGraph'),
    nsList: alias('configs.appConfig.queryNamespaces'),
    queryEndpoint: alias('configs.appConfig.queryLocation'),

    allClassesQuery: computed('ontologyGraphURI', 'nsList', function() {
        let uri = this.get('ontologyGraphURI');
        let nsList = this.get('nsList');

        let result = '';
        for (let i = 0, ii = nsList.length; i < ii; i++) {
            let ns = nsList[i];
            result += `PREFIX ${ns.prefix}: <${ns.ns}>\n`;
        }

        result += `\nSELECT * WHERE { GRAPH <${uri}> {`;
        result += `\n?iri rdf:type owl:Class . filter (isIRI(?iri)) .`;
        result += `\noptional {?iri rdfs:subClassOf ?parentClass . ?parentClass rdf:type owl:Class .}`;
        result += `\noptional {?iri rdfs:label ?label .}`;
        result += `\noptional {?iri cco:definition ?definition .}`;
        result += `\noptional {?iri cco:is_curated_in_ontology ?ont .}`;
        result += '\n}}';

        return result;
    }),

    model() {
        let query = this.get('allClassesQuery');
        let queryEndpoint = this.get('queryEndpoint');
        let utilities = this.get('utilities');
        let route = this;
        return new RSVP.Promise((resolve/*, reject*/) => {
            $.ajax({
                url: queryEndpoint,
                type: 'POST',
                data: {query},
                dataType: 'json',
                success(data) {
                    let list = route.rdfJsonToList(data);
                    list.sort((lhs, rhs) => {
                        let lpc = get(lhs, "parentClass") || "";
                        let rpc = get(rhs, "parentClass") || "";
                        return lpc.localeCompare(rpc);
                    });
                    let hierarchy = listToHierarchy(list, "iri", "parentClass", "subClasses");
                    resolve(utilities.toEmberObject(hierarchy));
                },
                error(xhr) {
                    console.error("Couldn't get ontology classes", xhr);
                    resolve([]);
                }
            });
        });
    },

    rdfJsonToList(data) {
        let results = [];
        let names = data.head.vars;
        data.results.bindings.forEach(solution => {
            let result = {};
            names.forEach(name => {
                let tmp;
                if ((tmp = solution[name]) && tmp.value) {
                    result[name] = tmp.value;
                }
            });
            results.push(result);
        });

        return results;
    }
});
