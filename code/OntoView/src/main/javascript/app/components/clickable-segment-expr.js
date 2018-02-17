import { computed } from '@ember/object';
import Component from '@ember/component';
import QueryFunction from 'ontoview/data/query-function';

export default Component.extend({
    tagName: 'span',

    // base level is 0. child components have level nextLevel passed in as level.
    level: 0,
    nextLevel: computed('level', function() {
        return (this.get('level') || 0) + 1;
    }),

    argLevel: computed('prevLevel,level,argIndex', function() {
        return {
            parentChain: this.get('prevLevel'),
            level: this.get('level'),
            argIndex: this.get('argIndex')
        };
    }),

    exprArgs: computed('expr.{args.[],numArgs}', function() {
        let expr = this.get('expr');
        let args = expr.get('args');
        let numArgs = expr.get('numArgs');

        return args.map((arg) => {
            if (arg instanceof QueryFunction) {
                return {expr: arg};
            } else {
                return {value: arg};
            }
        }).filter((arg, index) => index < numArgs);
    }),

    lastArgPos: computed('exprArgs.[]', function() {
        return this.get('exprArgs').length - 1;
    }),

    actions: {
        setCurrentlyEditing(data) {
            let parent = this.get('parent');
            if (parent) {
                parent.send('setCurrentlyEditing', data);
            } else {
                console.warn("attempting to pass currently-editing value to parent component, but it was not passed in");
            }
        }
    }
});
