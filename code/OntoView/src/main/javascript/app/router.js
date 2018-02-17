import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
    location: config.locationType,
    rootURL: config.rootURL
});

Router.map(function() {
    this.route('search-result', {path: '/result/:entity_id'});
    this.route('query-builder', {path: '/query/build'});
    this.route('settings');
    this.route('ontology-tree');
});

export default Router;
