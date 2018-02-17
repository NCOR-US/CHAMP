import { run } from '@ember/runloop';
import { union } from '@ember/object/computed';
import EmberObject, {
  computed,
  get,
  observer
} from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
    variableOptions: union('nodeOptions', 'aggregateOptions'),

    nodeOptions: computed('query.{nodes, ordering}.[]', function() {
        let query = this.get('query');
        let nodes = get(query, 'nodes');
        let orders = get(query, 'ordering');

        return nodes
            .filter((n) => n.isUsingVariable())
            .map((n) => {
                return EmberObject.create({
                    value: get(n, 'id'),
                    text: '?' + n.getVariable(),
                    selected: !!orders.find((elem) => get(elem, 'src') === get(n, 'id'))
                });
            });
    }),

    aggregateOptions: computed('query.{aggregates,ordering}.[]', function() {
        let query = this.get('query');
        let aggregates = get(query, 'aggregates');
        let orders = get(query, 'ordering');

        return aggregates.map((a) => {
            let value = get(a, 'id');
            let text = '?' + get(a, 'target');

            return EmberObject.create({
                value, text,
                selected: !!orders.find((elem) => get(elem, 'src') === get(a, 'id'))
            });
        });
    }),

    displayedOptions: computed('order.src', 'variableOptions.[]', 'disabledOptions.[]', function() {
        let orderID = get(this, 'order.src');
        let variableOptions = get(this, 'variableOptions');
        let disabledOptions = get(this, 'disabledOptions').map(d => get(d, 'src'));

        return variableOptions.filter(opt => !disabledOptions.includes(opt.id) || orderID === opt.id);
    }),

    // todo the warning still has to be addressed
    __watchDisplayed: observer('displayedOptions.[]', function() { // eslint-disable-line ember/no-observers
        console.log("displayed: {}", this.get('displayedOptions'));
    }),

    didInsertElement() {
        let component = this;
        this.$('.variable-select')
            .chosen({
                width: '100%',
                single_backstroke_delete: false
            })
            .on('change', (e, changed) => {
                run(() => {
                    // todo move to generic callback
                    component.get('order').set('src', changed.selected);
                });
            });
    }
});
