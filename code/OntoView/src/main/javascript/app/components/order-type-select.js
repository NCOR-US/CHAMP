import { run } from '@ember/runloop';
import Component from '@ember/component';

export default Component.extend({
    didInsertElement() {
        let callback = this.get('callback');
        this.$('.order-select')
            .chosen({width: '100%', disable_search: true})
            .on('change', function(e, changed) {
                run(() => {
                    let change = changed.selected;
                    if (callback) {
                        console.log("calling back");
                        callback(change);
                    } else {
                        console.log("no callback");
                    }
                });
            });
    }
});
