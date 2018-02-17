import Route from '@ember/routing/route';

export default Route.extend({
    model(params) {
        console.log("got param:", params.process_id);
        return {};
    },

    serialize(slug, params) {
        console.log("serializing", slug, params);
        return {};
    },

    setupController(controller, model) {
        console.log("setting up controller");
        controller.set('model', model);
    }
});
