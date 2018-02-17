import Service from '@ember/service';
import RSVP from 'rsvp';
import $ from 'jquery';
import { toEmberObject } from 'process-workflow/utilities/ember-utils';
import config from '../config/environment';

export default Service.extend({
    initialize() {
        return RSVP.hashSettled({
            appInfo: this.__initAppInfo()
        });
    },

    __initAppInfo() {
        let service = this;
        return new RSVP.Promise(function(resolve, reject) {
            $.getJSON(config.rootURL + 'app-info', function(data) {
                service.set('appInfo', toEmberObject(data));
                resolve();
            }, function(xhr) {
                console.error("xhr:", xhr);
                reject("error getting app info: " + xhr.statusText);
            });
        });
    }
});
