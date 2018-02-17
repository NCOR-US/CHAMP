import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
    tagName: 'nav',
    elementId: 'ontoview-top',
    classNameBindings: [':top-bar'],
    attributeBindings: ['data-topbar'],
    'data-topbar': '',

    showExplore: computed('currentPath', function() {
        let currentPath = this.get('currentPath');
        return ['index', 'search-result'].includes(currentPath);
    })
});
