import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
    utilities: service(),
    configs: service(),

    actions: {
        save() {
            this.get('configs').saveConfig()
                .then(() => alert('Settings saved.'))
                .fail((xhr) => alert("Save failed: " + xhr.statusText));
        },

        restoreDefaults() {
            this.get('configs').restoreDefaultConfig()
                .then(() => alert('Default settings restored'))
                .fail((xhr) => alert("Could not restore default settings: " + xhr.statusText));
        },

        removeNS(index) {
            this.get('configs.appConfig.queryNamespaces').removeAt(index);
        },

        addNS() {
            this.get('configs.appConfig.queryNamespaces').pushObject({
                prefix: '', namespace: ''
            });
        }
    }
});
