import { htmlSafe } from '@ember/string';
import { computed, set, observer } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

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
                    let paramList = [];
                    let paramString = "";
                    if (fr.params) {
                        fr.params.forEach((param) => {
                            paramList.push(`<em>${param.type}</em> ${param.name}`);
                        });
                        paramString = htmlSafe(paramList.join(', '));
                    }
                    set(fr, 'paramString', paramString);
                }
                result[fnName] = fr;
            });
        });

        return result;
    }),

    // todo this warning still has to be addressed
    __watchSelectedOpt: observer('selectedOpt', function() { // eslint-disable-line ember/no-observers
        let selectedOpt = this.get('selectedOpt');
        let component = this;

        // need to find the proper function group, since selectedOpt is just the name
        let functions = this.get('functions');
        let tmp = null;
        Object.keys(functions).forEach((key) => {
            if (functions[key][selectedOpt]) {
                tmp = `${key}:${selectedOpt}`;
            }
        });

        if (!tmp) {
            // couldn't find. what do?
            console.warn(`Couldn't find function ${selectedOpt} in registry ${functions}`);
            return;
        }

        component.$('.function-select').val(tmp);
        component.$('.function-select').trigger('chosen:updated');
    }),

    didInsertElement() {
        let component = this;
        component.$('.function-select')
            .chosen({
                width: '100%',
                inherit_select_classes: true,
                include_group_label_in_selected: true
            })
            .on('change', function(e, changed) {
                component.sendAction('callback', changed);
            });

        // hopefully there is a better way of doing this
        // this.$().on('mouseenter', '.active-result', function(/*e*/) {
        //     // todo show documentation
        // });
    }
});
