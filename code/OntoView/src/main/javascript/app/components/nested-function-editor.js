import { htmlSafe } from '@ember/string';
import EmberObject, { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import QueryFunction from 'ontoview/data/query-function';

export default Component.extend({
    configs: service(),

    functionRef: computed('configs.functionReference', function() {
        let result = {};
        let functions = this.get('configs.functionReference.functions');

        Object.keys(functions).forEach((category) => {
            let group = functions[category];
            Object.keys(group).forEach((fnName) => {
                let fr = group[fnName];
                if (fr) {
                    let defn = fr.definition;
                    if (fr.links) {
                        fr.links.forEach((link) => {
                            defn = defn.replace(link.text, `<a target="_blank" href=${link.url}>${link.text}</a>`);
                        });
                        defn = htmlSafe(defn);
                    }
                    fr.set('definitionWithLinks', defn);
                    // todo this is not consistent
                    // fr.set('exampleLink', `https://www.w3.org/TR/sparql11-query/#func-${fr.name}`);
                }
                result[fnName] = fr;
            });
        });

        return result;
    }),

    exprArgs: computed('currentlyEditing.{args,numArgs,numOptional}', function() {
        let expr = this.get('currentlyEditing');
        let args = expr.get('args');
        let numArgs = expr.get('numArgs');
        let numOptional = expr.get('numOptional');

        // make an array of numArgs long, populate with actual args
        let tmp = new Array(numArgs);
        for (let i = 0; i < numArgs; i++) {
            // mark last numOptional as optional
            tmp[i] = EmberObject.create({
                value: args[i],
                isFn: args[i] instanceof QueryFunction,
                isOptional: numArgs - numOptional <= i
            });
        }

        return tmp;
    }),

    init(...args) {
        this._super(args);
        this.set('currentlyEditing', this.get('expr'));

        // todo this could be better
        this.set('changeArgText', {
            true: 'Change to value',
            false: 'Change to function'
        });

        // initial values for "parent chaining"
        this.set('currentlyEditingArgLevel', { level: 0 });
    },

    actions: {
        // todo this is really ugly. refactor so it makes more sense
        changeArgType(argument, argIndex) {
            let functions = this.get('functions');
            let isFn = argument.get("isFn");
            if (confirm('Are you sure you want to convert? The old value will be lost.')) {
                if (isFn) {
                    argument.set('value', '');
                } else {
                    argument.set('value', functions['RDF']['UUID'].create());
                }
                argument.set('isFn', !isFn);
                this.send('saveArg', argument, argIndex);
            }
        },

        // todo this is really ugly. refactor so it makes more sense
        saveArg(arg, argIndex) {
            let argLevel = this.get('currentlyEditingArgLevel');

            let flattened = this._flatMapChain(argLevel, argIndex).reverse();
            let expr = this.get('expr');
            for (let i = 0, ii = flattened.length; i < ii; i++) {
                let f = flattened[i];

                if (i === ii - 1) {
                    expr.get('args').replace(f.argIndex, 1, arg.get('value'));
                } else {
                    expr = expr.get('args').objectAt(f.argIndex);
                }
            }

            this.get('currentlyEditing').get('args').replace(argIndex, 1, arg.get("value"));
        },

        changeExpr(change) {
            let id = change.selected;
            let chunks = id.split(':');
            let group = chunks[0];
            let name = chunks[1];
            let expr = this.get('functions')[group][name];
            let fn = expr.create();

            let oldExpr = this.get('currentlyEditing');
            // fn.set('args', oldExpr.get('args'));

            // overwrite old expr
            ['name', 'numArgs', 'numOptional'].forEach((prop) => oldExpr.set(prop, fn.get(prop)));
        },

        setCurrentlyEditing(data) {
            this.set('currentlyEditing', data.expr);
            this.set('currentlyEditingArgLevel', data.argLevel);
        }
    },

    _flatMapChain(chain, index) {
        let acc = [];
        acc.push({level: chain.level, argIndex: index});
        if (chain.parentChain) {
            acc.push(this._flatMapChain(chain.parentChain, chain.argIndex));
        }
        return Array.prototype.concat.apply([], acc);
    }
});
