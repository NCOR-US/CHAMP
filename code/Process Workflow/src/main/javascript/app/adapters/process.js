import ApplicationAdapter from 'process-workflow/adapters/application';
import moment from 'moment';

export default ApplicationAdapter.extend({
    updateRecord(store, type, snapshot) {
        let data = {};
        let serializer = store.serializerFor(type.modelName);

        serializer.serializeIntoHash(data, type, snapshot);

        let id = snapshot.id;
        if (data.data) {
            if (!data.data.id) {
                data.data.id = id;
            }

            if (!data.data.lastEdited) {
                data.data.attributes.lastEdited = moment().format();
            }
        }
        let url = this.buildURL(type.modelName, id, snapshot, 'updateRecord');

        return this.ajax(url, "PUT", { data: data });
    }
});
