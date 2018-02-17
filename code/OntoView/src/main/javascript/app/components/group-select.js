import EmberObject, { computed, get } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
    aggregateOptions: computed('query.aggregates.[]', function() {
        let query = get(this, 'query');
        let aggregates = get(query, 'aggregates');

        let result = [];
        aggregates.forEach((a) => {
            get(a, 'groups').forEach((g) => {
                result.push(EmberObject.create({
                    aggregate: a,
                    value: g,
                    text: '?' + g,
                    selected: true
                }));
            });
        });

        return result;
    }),

    didInsertElement() {
        let component = this;
        this.$('.group-select').chosen({width: '100%'})
            .on('change', function(e, changed) {
                console.log("changed", changed);
                let change = changed.selected || changed.deselected;
                let isSelected = change === changed.selected;
                let query = get(component, 'query');
                let affected = query.getAggregate(change);
                // console.log("affected", affected);
                let groups = get(affected, 'groups');
                console.log("affected groups", groups);

                let aggregate = get(component, 'aggregateOptions')
                    .filter((opt) => get(opt, 'value') === change)
                    .map((opt) => get(opt, 'aggregate'))
                    .pop();

                if (aggregate) {
                    // console.log("aggregate", aggregate);
                    let groups = get(aggregate, 'groups');
                    let target = get(aggregate, 'target');
                    // console.log("groups", groups);
                    // console.log("target", target);
                    if (isSelected) {
                        groups.pushObject(target);
                    } else {
                        console.log(`removing ${change} from ${groups}`);
                        let index = groups.indexOf(target);
                        if (index > -1) {
                            groups.removeAt(index);
                        }
                    }
                }
            });
    }
});
