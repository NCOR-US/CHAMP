import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
    pageSize: 20,
    currentPage: 0,

    currentPageDisplay: computed('currentPage', {
        get() {
            return this.get('currentPage') + 1;
        },
        set(name, value/*, oldValue*/) {
            this.set('currentPage', value - 1);
        }
    }),

    paginatedData: computed('data.[]', 'pageSize', function() {
        let result = [];
        let data = JSON.parse(JSON.stringify(this.get('data')))
            .sort(
                // sort by displayText, but also shift bad values to the end
                function(a, b) {
                    if (!b || !(b.displayText)) {
                        return -1;
                    }
                    if (!a || !(a.displayText)) {
                        return 1;
                    }

                    if (a.displayText < b.displayText) {
                        return -1;
                    }

                    else if (a.displayText === b.displayText) {
                        return 0;
                    }

                    else if (a.displayText > b.displayText) {
                        return 1;
                    }
                }
            );
        let pageSize = this.get('pageSize');

        while (data.length > pageSize) {
            result.push(data.splice(0, pageSize));
        }
        result.push(data);

        return result;
    }),

    totalPages: computed('paginatedData', function() {
        return this.get('paginatedData').length;
    }),

    lastPage: computed('paginatedData', function() {
        return this.get('paginatedData').length - 1;
    }),

    currentPaginatedData: computed('paginatedData', 'currentPage', 'totalPages', function() {
        let paginatedData = this.get('paginatedData');
        let currentPage = this.get('currentPage');
        let totalPages = this.get('totalPages');

        if (currentPage < 0) {
            console.warn('attempting to access paged data at page < 0');
            currentPage = 0;
        }

        if (currentPage >= paginatedData.length || currentPage >= totalPages) {
            console.warn('attempting to access paged data beyond upper limit');
            currentPage = totalPages - 1;
        }
        return paginatedData[currentPage];
    }),

    hasPrevious: computed('currentPage', function() {
        return this.get('currentPage') > 0;
    }),

    hasNext: computed('currentPage', 'totalPages', function() {
        return this.get('currentPage') < (this.get('totalPages') - 1);
    }),

    init() {
        this._super(...arguments);
        this.set('data', []);
    },

    actions: {
        goToFirst() {
            this.set('currentPage', 0);
        },

        goToPage(pos) {
            this.set('currentPage', pos);
        },

        goToLast() {
            this.set('currentPage', this.get('lastPage'));
        },

        incrementPage() {
            if (this.get('hasNext')) {
                this.set('currentPage', this.get('currentPage') + 1);
            }
        },

        decrementPage() {
            if (this.get('hasPrevious')) {
                this.set('currentPage', this.get('currentPage') - 1);
            }
        }
    }
});
