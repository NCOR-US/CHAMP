import EmberObject, { computed, get, set } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
    // tagName: 'table',
    // classNames: ['result-table'],

    /**
     * Each datum is structure as follows:
     * predicate: {localName, ns, package, type, value}
     * object: {link, localName, ns, package, type, value} || {type, value}
     **/
    viewData: computed('data', 'selectedProperty', function() {
        let data = this.get('data');
        let selectedProperty = this.get('selectedProperty');
        let result = [];
        for (let i = 0, ii = data.length; i < ii; i++) {
            let datum = data[i];
            datum.expandResults = true;
            if (selectedProperty) {
                if (datum.predicate.displayText === selectedProperty) {
                    result.push(EmberObject.create(datum));
                    break;
                }
            } else {
                result.push(EmberObject.create(datum));
            }
        }

        return result;
    }),

    actions: {
        toggleExpandResults(row) {
            set(row, "expandResults", !get(row, 'expandResults'));
        },

        drillDown(row) {
            console.log("row", row);
        }
    }
});