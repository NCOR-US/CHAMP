import Service, { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import $ from 'jquery';

export default Service.extend({
    utils: service('utilities'),

    initialize() {
        return RSVP.hashSettled({
            config: this.__initAppConfig(),
            appInfo: this.__initAppInfo(),
            functionRef: this.__initFunctionReference()
        });
    },

    reloadConfig() {
        return this.__initAppConfig();
    },

    saveConfig() {
        let config = this.get('appConfig');
        return $.post({
            url: '/ontoview/config',
            data: JSON.stringify(config),
            contentType: 'application/json'
        });
    },

    restoreDefaultConfig() {
        let service = this;
        return $.ajax({
            method: 'DELETE',
            url: '/ontoview/config',
            success() {
                service.__initAppConfig();
            }
        });
    },

    __initAppConfig() {
        let service = this;
        let utils = this.get('utils');
        return new RSVP.Promise(function(resolve, reject) {
            $.getJSON('/ontoview/config', function(data) {
                service.set('appConfig', utils.toEmberObject(data));
                resolve();
            }, function(xhr) {
                console.error("xhr:", xhr);
                reject("error getting settings: " + xhr.statusText);
            });
        });
    },

    __initAppInfo() {
        let service = this;
        let utils = this.get('utils');
        return new RSVP.Promise(function(resolve, reject) {
            $.getJSON('/ontoview/app-info', function(data) {
                service.set('appInfo', utils.toEmberObject(data));
                resolve();
            }, function(xhr) {
                console.error("xhr:", xhr);
                reject("error getting app info: " + xhr.statusText);
            });
        });
    },

    __initFunctionReference() {
        let service = this;
        let utils = this.get('utils');

        return new RSVP.Promise(function(resolve, reject) {
            $.getJSON('/ontoview/function-reference', function(response) {
                if (response.data) {
                    service.set('functionReference', utils.toEmberObject(response.data));
                    resolve();
                } else {
                    reject(`Didn't receive data with response: ${response}`);
                }
            }, function(xhr) {
                console.error("xhr:", xhr);
                reject("error getting function reference document: " + xhr.statusText);
            });
        });
    }
});
