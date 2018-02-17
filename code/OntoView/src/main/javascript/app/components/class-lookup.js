import { computed } from '@ember/object';
import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import RSVP from 'rsvp';
import DS from 'ember-data';
import $ from 'jquery';
import { encodeIRI } from 'ontoview/data/data-utils';

export default Component.extend({
    configs: service(),
    graphIRI: alias('configs.appConfig.dataGraph'),
    namespaceLookup: alias('configs.appConfig.queryNamespaces'),

    classOptionQuery: computed('graphIRI', function() {
        let graphIRI = this.get('graphIRI');
        let query = "select * where { ";
        if (graphIRI) {
            query += `graph <${graphIRI}> { `;
        }
        query += "?s <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?o . ";
        if (graphIRI) {
            query += "} ";
        }
        query += "} ";

        return query;
    }),

    classOptions: computed('classOptionQuery', 'configs', function() {
        let configs = this.get('configs');

        let query = this.get('classOptionQuery');
        let service = this;
        return DS.PromiseArray.create({
            promise: new RSVP.Promise((resolve/*, reject*/) => {
                $.ajax({
                    url: configs.get('appConfig.queryLocation'),
                    type: 'POST',
                    data: {
                        query: query
                    },
                    dataType: 'json',
                    success(data) {
                        resolve(service.buildClassOptions(data));
                    },
                    error(xhr) {
                        console.warn("error while querying for entity:", xhr);
                        resolve([]);
                    }
                });
            })
        });
    }),

    instanceList: computed('selectedClass', 'classOptions.content.[]', function() {
        let selectedClass = this.get('selectedClass');
        let classOptions = this.get('classOptions');
        if (!selectedClass || !classOptions) {
            return [];
        }

        let content = classOptions.get('content');

        let index = content.map(entry => selectedClass === entry.id).indexOf(true);
        if (index > -1) {
            return content[index].instanceList;
        } else {
            return [];
        }
    }),

    /**
     * Convert the supplied data into an array of
     * { id, display } .
     */
    buildClassOptions(data) {
        let namespaceLookup = this.get('namespaceLookup');
        let bindings = data.results.bindings;

        let result = [];
        bindings.forEach(bindingSet => {
            let c = bindingSet.o.value;

            let delim = Math.max(c.lastIndexOf('#'), c.lastIndexOf('/')) + 1;
            let localName = c.substring(delim);

            let instance = bindingSet.s.value;
            let iDisplay = instance;
            let maybeLookup = namespaceLookup.filter(nsl => instance.startsWith(nsl.ns)).pop();
            if (maybeLookup) {
                iDisplay = `${maybeLookup.prefix}:${instance.split(maybeLookup.ns)[1]}`;
            }

            let instanceObj = {
                classIri: c,
                instanceIri: instance,
                encodedInstanceIri: encodeIRI(instance),
                display: iDisplay
            };

            let maybeIndex = result.map(r => r.id === c).lastIndexOf(true);
            if (maybeIndex > -1) {
                result[maybeIndex].instanceList.push(instanceObj);
            } else {
                result.push({
                    id: c,
                    display: localName,
                    instanceList: [instanceObj]
                });
            }
        });

        result.sort((a, b) => a.id.localeCompare(b.id));

        return result;
    }
});
