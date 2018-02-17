import { computed, get } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
    textView: computed('exprView', 'variable', function() {
        let exprView = this.get('exprView');
        let variable = this.get('variable');
        return `BIND(${exprView} as ?${variable}) .`;
    }),

    node: computed("row", function() {
        let query = this.get('query');
        return query.getNode(this.get('row.target'));
    }),

    expr: computed('node', function() {
        return this.get("node.expr");
    }),

    exprView: computed('expr', function() {
        return this.get("expr").toString();
    }),

    variable: computed('row', function() {
        let query = this.get('query');
        let node = query.getNode(this.get('row.target'));
        return get(node, 'variable');
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
