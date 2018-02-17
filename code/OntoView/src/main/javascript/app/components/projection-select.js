import { later, run } from '@ember/runloop';
import EmberObject, {
  computed,
  get,
  observer
} from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
    projectOptions: computed('query.{projections,variables}.[]', function() {
        let query = get(this, 'query');
        let projections = get(query, 'projections');
        let variables = get(query, 'variables');

        return variables.map((p) => {
            return EmberObject.create({
                value: p,
                text: '?'+p,
                selected: projections.includes(p)
            });
        });
    }),

    aggregateOptions: computed('query.aggregates.[]', function() {
        let query = get(this, 'query');
        let aggregates = get(query, 'aggregates');
        return aggregates.map((a) => {
            let value = get(a, 'target');
            let text = query.__buildAggregate(a);

            return EmberObject.create({
                value, text,
                disabled: true,
                selected: true
            });
        });
    }),

    // todo the warning still has to be addressed
    __watchOptionSources: observer('aggregateOptions.[]', 'projectOptions.[]', function() { // eslint-disable-line ember/no-observers
        let component = this;
        later(() => component.$('.projection-select').chosen().trigger('chosen:updated'));
    }),

    didInsertElement() {
        let component = this;
        this.$('.projection-select')
            .chosen({
                width: '100%',
                single_backstroke_delete: false
            })
            .on('change', function(e, changed) {
                run(() => {
                    let change = changed.selected || changed.deselected;
                    let isSelected = change === changed.selected;
                    // only change through chosen UI is with projections
                    let query = component.get('query');
                    if (isSelected) {
                        query.addProjection(change);
                    } else {
                        query.removeProjection(change);
                    }
                });
            });
    }
});
