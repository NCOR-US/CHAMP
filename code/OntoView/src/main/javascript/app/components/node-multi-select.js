import { run } from '@ember/runloop';
import EmberObject, { computed, get } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
    options: computed('query.{projections,variables}.[]', function() {
        let query = get(this, 'query');
        let variables = get(query, 'variables');
        let nodeSet = get(this, 'nodeSet');

        return variables.map((p) => {
            return EmberObject.create({
                value: p,
                text: '?'+p,
                selected: nodeSet.includes(p)
            });
        });
    }),

    didInsertElement() {
        let component = this;
        this.$('.projection-select')
            .chosen({
                width: '100%',
                single_backstroke_delete: false
            })
            .on('change', function(e, changed) {
                run(() => component.sendAction('changeGroup', changed));
            });
    }
});
