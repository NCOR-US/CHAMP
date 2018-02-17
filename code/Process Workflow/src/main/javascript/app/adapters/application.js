import DS from 'ember-data';

export default DS.JSONAPIAdapter.extend({
    // todo sync namespace with web.xml
    namespace: 'process-workflow/data',

    // todo going to need something like this
    // headers: {
    //     'API_KEY': 'some key',
    // }

    // todo or this
    // session: Ember.inject.service('session'),
    // headers: Ember.computed('session.authToken', function() {
    //     return {
    //         'API_KEY': this.get('session.authToken'),
    //         'ANOTHER_HEADER': 'Some header value'
    //     };
    // })

    /**
     * Deletes a record by sending the record ID in the request payload. This is to avoid
     * encoded forward slashes in the URL.
     */
    deleteRecord(store, type, snapshot) {
        let url = this.buildURL(type.modelName, snapshot.id, snapshot, 'deleteRecord');
        return this.ajax(url, "DELETE", {
            data: {
                data: {
                    id: snapshot.id
                }
            }
        });
    },

    findRecord(store, type, id, snapshot) {
        let url = this.buildURL(type.modelName, id, snapshot, 'findRecord');
        let query = this.buildQuery(snapshot);
        // if (!query.data) {
        //     query.data = {};
        // }

        if (query && !query.id) {
            query.id = id;
        }

        return this.ajax(url, 'GET', { data: query });
    },

    updateRecord(store, type, snapshot) {
        let data = {};
        let serializer = store.serializerFor(type.modelName);

        serializer.serializeIntoHash(data, type, snapshot);

        let id = snapshot.id;
        if (data.data && !data.data.id) {
            data.data.id = id;
        }
        let url = this.buildURL(type.modelName, id, snapshot, 'updateRecord');

        return this.ajax(url, "PUT", { data: data });
    },

    /**
     * Build all URLs without using the ID. This is to avoid
     * encoded forward slashes in the URL.
     */
    buildURL(modelName, id, snapshot, requestType, query) {
        return this._super(modelName, null, snapshot, requestType, query);
    }
});
