import { run } from '@ember/runloop';
import Component from '@ember/component';

export default Component.extend({
    didInsertElement() {
        let component = this;
        this.$('.function-select')
            .chosen({
                width: '100%',
                single_backstroke_delete: false
            })
            .on('change', (e, changed) => {
                run(() => component.sendAction('changeCallback', changed));
            });
    }
});
