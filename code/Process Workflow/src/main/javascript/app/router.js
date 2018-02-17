import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
    location: config.locationType,
    rootURL: config.rootURL
});

Router.map(function() {
    this.route('processes', function() {
        this.route('edit', {path: ':name'});
        this.route('new');
    });

    this.route('inventory');
    this.route('query');
    this.route('data-input');
    this.route('admin');

    this.route('settings');
});

export default Router;
