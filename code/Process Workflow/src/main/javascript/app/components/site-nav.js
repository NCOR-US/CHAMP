import { computed } from '@ember/object';
import Component from '@ember/component';
import $ from 'jquery';

export default Component.extend({
    tagName: 'nav',
    elementId: 'pw-top',
    classNameBindings: [':top-bar'],
    attributeBindings: ['data-topbar', 'role', 'data-options'],
    'data-topbar': '',
    role: 'navigation',
    'data-options': 'is_hover: false',

    highlightHome: computed('currentPath', function() {
        let currentPath = this.get('currentPath') || '';
        return currentPath.startsWith('index');
    }),

    highlightProcesses: computed('currentPath', function() {
        let currentPath = this.get('currentPath') || '';
        return currentPath.startsWith('processes');
    }),

    highlightInventory: computed('currentPath', function() {
        let currentPath = this.get('currentPath') || '';
        return currentPath.startsWith('inventory');
    }),

    highlightQuery: computed('currentPath', function() {
        let currentPath = this.get('currentPath') || '';
        return currentPath.startsWith('query');
    }),

    highlightDataInput: computed('currentPath', function() {
        let currentPath = this.get('currentPath') || '';
        return currentPath.startsWith('data-input');
    }),

    highlightAdmin: computed('currentPath', function() {
        let currentPath = this.get('currentPath') || '';
        return currentPath.startsWith('admin');
    }),

    didInsertElement() {
        try {
            $(document).foundation('topbar', 'reflow')
        } catch (e) {
            // squash
        }
    }
});
