import { computed } from '@ember/object';
import Component from '@ember/component';
import { encodeIRI } from 'ontoview/data/data-utils';

export default Component.extend({
    noSearchValue: computed('searchValue', function() {
        if (!this.get('searchValue')) {
            return true;
        }
        return null;
    }),

    encodedSearchValue: computed('searchValue', function() {
        let searchValue = this.get('searchValue');
        if (searchValue && searchValue.trim) {
            return encodeIRI(searchValue.trim());
        }
    }),

    actions: {
        doSearch() {
            this.$('#entityLookupAnchor').click();
        }
    }
});