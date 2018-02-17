import Route from '@ember/routing/route';

export default Route.extend({
    model() {
        return this.get('store').findAll('process');
    },

    actions: {
        deleteProcess(id) {
            if (confirm("Are you sure you want to delete this process?")) {
                let record = this.get('store').peekRecord('process', id);
                record.destroyRecord();
            }
        }
    }
});
