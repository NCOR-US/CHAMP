import { set } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
    classNames: ['recursive-list'],

    actions: {
        collapse(datum) {
            set(datum, 'isCollapsed', true);
        },
        expand(datum) {
            set(datum, 'isCollapsed', false);
        }
    }
});
