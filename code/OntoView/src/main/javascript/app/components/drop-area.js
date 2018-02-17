import { get } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
    classNames: ['drop-area'],

    dragOver(e) {
        e.preventDefault();
        this.$().addClass('ui-drag-hover');
    },

    dragEnd() {
        this.$().removeClass('ui-drag-hover');
    },

    dragLeave() {
        this.$().removeClass('ui-drag-hover');
    },

    drop(e) {
        this.$().removeClass('ui-drag-hover');
        let data = e.dataTransfer.getData('text/data');
        let dataName = get(this, 'dataName');
        let callback = get(this, 'callback');
        if (!callback) {
            return;
        }

        if (dataName) {
            let dataName = get(this, 'dataName');
            callback(dataName, data);
        } else {
            callback(data);
        }
    }
});
