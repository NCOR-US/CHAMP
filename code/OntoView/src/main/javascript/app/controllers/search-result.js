import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Controller from '@ember/controller';

export default Controller.extend({
    queryTracker: service(),

    queryParams: ['property'],
    property: null,

    // see eslint-plugin-ember/docs/rules/alias-model-in-controller.md
    searchResults: alias('model'),
});
