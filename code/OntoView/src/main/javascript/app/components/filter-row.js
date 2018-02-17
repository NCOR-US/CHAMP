import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
    textView: computed('exprView', function() {
        let exprView = this.get('exprView');
        return `FILTER ${exprView} .`;
    }),

    node: computed("row", function() {
        let query = this.get('query');
        return query.getNode(this.get('row.target'));
    }),

    expr: computed('node', function() {
        return this.get('node').getFilter(this.get('row.filter'));
    }),

    exprView: computed('expr', function() {
        return this.get("expr").toString();
    }),

    actions: {
        startEditing() {
            this.set('oldExpr', this.get('expr'));
            this.set('editing', true);
        },

        stopEditing() {
            this.set('editing', false);
            // invalidate exprView
            this.notifyPropertyChange('expr');
        }
    }
});
