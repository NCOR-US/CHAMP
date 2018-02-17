import { computed } from '@ember/object';
import { alias } from '@ember/object/computed';
import Service, { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import $ from 'jquery';
import { encodeIRI } from 'ontoview/data/data-utils';

export default Service.extend({
    configs: service(),

    /**
     * Run in application model hook.
     */
    initialize() {
        return RSVP.Promise.resolve();
    },

    queryEndpoint: alias('configs.appConfig.queryLocation'),
    dataGraphURI: alias('configs.appConfig.dataGraph'),
    ontologyGraphURI: alias('configs.appConfig.ontologyGraph'),
    nsList: alias('configs.appConfig.queryNamespaces'),

    baseQuery: computed('dataGraphURI', function() {
        let dataGraphURI = this.get('dataGraphURI');

        let result = 'SELECT ?predicate ?object WHERE { ';

        if (dataGraphURI) {
            result += `GRAPH <${dataGraphURI}> { `;
        }

        result += "${subject} ?predicate ?object . ";

        if (dataGraphURI) {
            result += "} ";
        }

        result += "}";

        return result;
    }),

    baseSuperClassQuery: computed('nsList', function() {
        let result = '';
        let nsList = this.get('nsList');
        for (let i = 0, ii = nsList.length; i < ii; i++) {
            let thing = nsList[i];
            result += `PREFIX ${thing.prefix}: <${thing.ns}>\n`;
        }

        return result + [
            'SELECT ?object ?label ?description ?oboDescription',
            'WHERE {',
            '   GRAPH <' + this.get('ontologyGraphURI') + '> {',
            '       ${subject} rdfs:subClassOf ?object .',
            '       OPTIONAL {',
            '       ?object rdfs:label ?label .',
            '       }',
            '       OPTIONAL {',
            '           ?object cco:definition ?description',
            '       }',
            '       OPTIONAL {',
            '           ?object <http://purl.obolibrary.org/obo/IAO_0000600> ?oboDescription',
            '       }',
            '   }',
            '}',
            'LIMIT 1'
        ].join(' \n ');
    }),

    ns: computed('configs.appConfig.queryNamespaces', function() {
        return this.get('configs').get('appConfig')
            .get('queryNamespaces')
            .reduce((acc, thing) => {acc[thing.prefix] = thing.ns; return acc;}, {});
    }),

    ns_reverse: computed('ns', function() {
        return this.get('configs').get('appConfig')
            .get('queryNamespaces')
            .reduce((acc, thing) => {acc[thing.ns] = thing.prefix; return acc;}, {});
    }),

    subjectVarQuery: computed('ns', 'baseQuery', function() {
        let ns = this.get('ns');
        let baseQuery = this.get('baseQuery');
        let result = '';

        for (let key in ns) {
            if (ns.hasOwnProperty(key)) {
                result += `PREFIX ${key}: <${ns[key]}>\n`;
            }
        }
        result = result + '\n' + baseQuery;

        return result;
    }),

    directChildrenQuery: computed('ns', function() {
        let ns = this.get('ns');
        let prefixes = '';

        for (let key in ns) {
            if (ns.hasOwnProperty(key)) {
                prefixes += `PREFIX ${key}: <${ns[key]}>\n`;
            }
        }
        return [prefixes,
            'select ?child ?label ?desc ?oboDesc',
            'where {',
            '    graph <http://ontoview.cubrc.org/ontologies> {',
            '    ?child rdfs:subClassOf ${iri}',
            '    filter (isIRI(?child))',
            '    optional { ?child rdfs:label ?label }',
            '    optional { ?child cco:definition ?desc }',
            '    optional { ?child <http://purl.obolibrary.org/obo/IAO_0000600> ?oboDesc }',
            '  }',
            '}',
            'limit 10'
        ].join( '\n' );
    }),

    getDirectChildren(iri) {
        let service = this;
        if (iri.startsWith("http://")) {
            iri = "<" + iri + ">";
        }

       let query = this.get('directChildrenQuery').replace('${iri}', iri);
       return new RSVP.Promise(function(resolve/*, reject*/) {
            $.ajax({
                url: service.get('queryEndpoint'),
                type: 'POST',
                data: { query },
                dataType: 'json',
                success(data) {
                    let bindings = data.results.bindings;
                    if (!bindings.length) {
                        resolve(null);
                    } else {
                        let result = [];
                        for (let i = 0, ii = bindings.length; i < ii; i++) {
                            let binding = bindings[i];
                            let value = binding.child.value;
                            let unpacked = service.unpackIRI(value);
                            let display;
                            if (unpacked.prefix) {
                                display = `${unpacked.prefix}:${unpacked.localName}`;
                            }

                            let label = '(no label)';
                            if (binding.label) {
                                label = binding.label.value;
                            }

                            let desc = '(no description)';
                            if (binding.desc) {
                                desc = binding.desc.value;
                            } else if (binding.oboDescription) {
                                desc = binding.oboDescription.value;
                            }
                            result.push({value, label, desc, display});
                        }
                        resolve(result);
                    }
                },
                error() {
                    resolve(null);
                }
            });
       });
    },

    getInfoForEntity(iri) {
        let service = this;
        if (iri.startsWith("http://")) {
            iri = "<" + iri + ">";
        }

        let prefixes = '';
        let nsList = this.get('nsList');
        for (let i = 0, ii = nsList.length; i < ii; i++) {
            let thing = nsList[i];
            prefixes += `PREFIX ${thing.prefix}: <${thing.ns}>\n`;
        }

        let query = [`${prefixes}`,
            `select ?label ?desc ?oboDescription `,
            `where { `,
            `    graph <${this.get('ontologyGraphURI')}> { `,
            `      optional { ${iri} rdfs:label ?label } `,
            `      optional { ${iri} cco:definition ?desc } `,
            `      optional { ${iri} <http://purl.obolibrary.org/obo/IAO_0000600> ?oboDescription } `,
            `    } `,
            `  } `,
            `limit 1`
        ].join(' \n ');
        return new RSVP.Promise(function(resolve/*, reject*/) {
            $.ajax({
                url: service.get('queryEndpoint'),
                type: 'POST',
                data: { query },
                dataType: 'json',
                success(data) {
                    let bindings = data.results.bindings;
                    if (!bindings.length) {
                        resolve(null);
                    } else {
                        let binding = bindings[0];
                        let label = '(no label)';
                        if (binding.label) {
                            label = binding.label.value;
                        }

                        let desc = '(no description)';
                        if (binding.desc) {
                            desc = binding.desc.value;
                        } else if (binding.oboDescription) {
                            desc = binding.oboDescription.value;
                        }
                        resolve({label, desc});
                    }
                },
                error() {
                    resolve(null);
                }
            });
        });
    },

    getSuperClassChain(uri) {
        return this.__getSuperClass(uri, []);
    },

    /**
     * Retrieve the superclass of the given class, null if none.
     * @private
     */
    __getSuperClass(uri, acc) {
        let baseSuperClassQuery = this.get('baseSuperClassQuery');
        if (uri.startsWith("http://")) {
            uri = "<" + uri + ">";
        }

        let query = baseSuperClassQuery.replace('${subject}', uri);
        let service = this;
        return new RSVP.Promise(function(resolve/*, reject*/) {
            $.ajax({
                url: service.get('queryEndpoint'),
                type: 'POST',
                data: {
                    query: query
                },
                dataType: 'json',
                success(data) {
                    let bindings = data.results.bindings;
                    if (!bindings.length) {
                        resolve(null);
                    } else {
                        let binding = bindings[0];
                        let value = binding.object.value;
                        let unpacked = service.unpackIRI(value);
                        let display;
                        if (unpacked.prefix) {
                            display = `${unpacked.prefix}:${unpacked.localName}`;
                        }

                        let label = binding.label ? binding.label.value : '(no label)';

                        let description = binding.description || binding.oboDescription;
                        if (description) {
                            description = description.value || '(no description)';
                        } else {
                            description = '(no description)';
                        }

                        resolve({value, label, description, display});
                    }
                },
                error() {
                    resolve(null);
                }
            });
        }).then(function(data) {
            if (data) {
                acc.push(data);
                return service.__getSuperClass(data.value, acc);
            } else {
                return RSVP.Promise.resolve(acc);
            }
        });
    },

    unpackIRI(iri) {
        let reverseNs = this.get('ns_reverse');
        let lastHash = iri.lastIndexOf('#');
        let lastSlash = iri.lastIndexOf('/');
        let delimIndex = Math.max(lastHash, lastSlash) + 1;
        return {
            ns: iri.substring(0, delimIndex),
            prefix: reverseNs[iri.substring(0, delimIndex)],
            localName: iri.substring(delimIndex)
        };
    },

    performEntityQuery(entityID) {
        let subjectVarQuery = this.get('subjectVarQuery');
        // todo better!
        if (entityID.startsWith("http://") || entityID.startsWith("urn:")) {
            entityID = "<" + entityID + ">";
        }

        let query = subjectVarQuery.replace('${subject}', entityID);
        let service = this;
        return new RSVP.Promise(function(resolve, reject) {
            $.ajax({
                url: service.get('queryEndpoint'),
                type: 'POST',
                data: {
                    query: query
                },
                dataType: 'json',
                success: function(data) {
                    resolve({
                        id: entityID,
                        result: service.preprocess(data)
                    });
                },
                error: function(xhr) {
                    console.warn("error while querying for entity:", xhr);

                    if (xhr.status === 400) {
                        // need to catch query failures, specifically
                        // unresolved prefixed name
                        if (xhr.responseText.indexOf(service.get('ERROR_NOT_FOUND')) > -1) {
                            reject(new Error('Entity not found: ' + entityID));
                        }
                        // lexical error
                        else if (xhr.responseText.indexOf(service.get('LEXICAL_ERROR')) > -1) {
                            reject(new Error('Lexical error in search term "' + entityID + '". Is the prefix correct?'));
                        }

                        else {
                            reject(new Error('Syntax error: please query for a prefixed name or URI'));
                        }
                    } else if (xhr.status === 404) {
                        reject(new Error('Cannot connect to query endpoint: 404 Not Found'));
                    } else if (xhr.status === 500) {
                        reject(new Error('Cannot connect to query endpoint: 500 Server Error'));
                    } else if (xhr.status === 0) {
                        reject(new Error('Cannot connect to query endpoint: Connection failed/refused'));
                    }

                    reject(new Error("subject `" + entityID + "` query failed with status: [" + xhr['status'] + "]"));
                }
            });
        });
    },

    /**
     * Initially, data holds the following form:
     * {
     *      head: { vars: ['predicate', 'object'] },
     *      results: {
     *          bindings: [
     *              {
     *                  predicate: {
     *                      type: 'uri',
     *                      value: 'http:// ... '
     *                  },
     *                  object: {
     *                      type: 'uri' | 'literal'
     *                      value: 'http:// ... '
     *                  }
     *              }
     *          ]
     *      }
     * }
     *
     * This needs to
     * - split all URIs into package and local name
     * - replace packages with namespaces
     * - group all objects by predicate
     * - construct links for multi-valued objects. todo might just do a dropdown, maybe query param for predicate isolation?
     * - construct ontoview entity search links for URIs. todo need to consider where the ontology itself is going
     *
     **/
    preprocess(data) {
        // console.log("pre-process data", data);
        let objectLookup = {};
        let predicateLookup = {};
        for (let i = 0, ii = data.results.bindings.length; i < ii; i++) {
            let binding = data.results.bindings[i];
            // console.log("binding", binding);

            // 1. split into package and local name
            // 2. replace package with namespace
            // 3. construct ontoview entity search links for URIs
            [binding.predicate.package, binding.predicate.localName] = this.getChunks(binding.predicate.value);
            binding.predicate.ns = this.findNamespace(binding.predicate.package);
            binding.predicate.displayText = this.constructDisplayText(binding.predicate);

            if (binding.object.type === 'uri') {
                [binding.object.package, binding.object.localName] = this.getChunks(binding.object.value);
                binding.object.ns = this.findNamespace(binding.object.package);
                if (binding.predicate.displayText === 'rdfs:seeAlso') {
                    console.log("adding external link");
                    binding.object.externalLink = true;
                } else {
                    binding.object.link = this.constructOntoviewLink(binding.object);
                }
            }
            binding.object.displayText = this.constructDisplayText(binding.object);

            // 4. group objects by predicate
            if (!objectLookup[binding.predicate.value]) {
                objectLookup[binding.predicate.value] = [];
                predicateLookup[binding.predicate.value] = binding.predicate;
            }
            objectLookup[binding.predicate.value].push(binding.object);
        }

        let result = [];
        for (let j = 0, jj = Object.keys(objectLookup).length; j < jj; j++) {
            let key = Object.keys(objectLookup)[j];
            let tmp1 = predicateLookup[key];
            let tmp2 = objectLookup[key];
            // 5. construct links for multi-valued objects todo

            // 6. done
            result.push({
                predicate: tmp1,
                object: tmp2
            });
        }
        return result;
    },

    /**
     * Extracts package and local name from a URI. The URI may choose either / or # as a delimiter.
     * If the URI is a URN, it may end with ':'.
     * todo sync with known prefixes
     */
    getChunks(uri) {
        let hash = uri.lastIndexOf('#');
        let slash = uri.lastIndexOf('/');
        let colon = uri.lastIndexOf(':');
        let index = Math.max(hash, slash, colon) + 1;
        return [uri.substr(0, index), uri.substr(index)];
    },

    findNamespace(pkg) {
        return this.get('ns_reverse')[pkg];
    },

    constructOntoviewLink(object) {
        if (object.ns) {
            return encodeIRI(object.ns + ":" + object.localName);
        } else {
            return encodeIRI(object.value);
        }
    },

    constructDisplayText(container) {
        if (container.ns) {
            return container.ns + ':' + container.localName;
        } else {
            return container.value;
        }
    },

    // errors
    ERROR_NOT_FOUND: 'Unresolved prefixed name',
    LEXICAL_ERROR: 'Lexical error'
});
