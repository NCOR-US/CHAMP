import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
    configs: service(),
    classNames: ['ov-footer'],

    showCommitNumber: computed('configs.appInfo.buildVersion', function() {
        let buildVersion = this.get('configs.appInfo.buildVersion') || '';
        return buildVersion.includes('alpha');
    })
});
