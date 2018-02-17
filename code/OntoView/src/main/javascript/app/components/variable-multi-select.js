import { run } from '@ember/runloop';
import { union } from '@ember/object/computed';
import EmberObject, { computed, get } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
    variableOptions: union('nodeOptions', 'aggregateOptions'),

    nodeOptions: computed('query.nodes.[]', 'selected.[]', function() {
        let query = this.get('query');
        let nodes = query.get('nodes');
        let selected = this.get('selected');

        return nodes
            .filter((n) => n.isUsingVariable())
            .map((n) => {
                return EmberObject.create({
                    value: get(n, 'id'),
                    text: '?' + n.getVariable(),
                    selected: !!selected.find((elem) => elem === `?${get(n, 'variable')}`)
                });
            });
    }),

    aggregateOptions: computed('aggregate.target', 'query.aggregates.[]', 'selected.[]', function() {
        let query = this.get('query');
        let aggregates = query.get('aggregates');
        let selected = this.get('selected');
        let currentAggregateTarget = this.get('aggregate.target');

        return aggregates.map((a) => {
            let value = get(a, 'id');
            let target = get(a, 'target');

            if (currentAggregateTarget !== target) {

                let text = '?' + target;

                return EmberObject.create({
                    value, text,
                    selected: !!selected.find((elem) => elem === `?${get(a, 'target')}`)
                });
            }
        }).filter((a) => a);
    }),

    init() {
        this._super(...arguments);
        this.set('selected', []);
    },

    didInsertElement() {
        let component = this;
        this.$('.variable-select')
            .chosen({
                width: '100%',
                single_backstroke_delete: false
            })
            .on('change', (e, changed) => {
                let query = component.get('query');
                let id = changed.selected || changed.deselected;
                let changedNode = query.getNode(id);
                if (changedNode) {
                    changed['variable'] = get(changedNode, 'variable');
                }

                let changedAggregate = query.getAggregate(id);
                if (changedAggregate) {
                    changed['variable'] = get(changedAggregate, 'target');
                }

                run(() => component.sendAction('changeCallback', changed));
            });
    }
});
