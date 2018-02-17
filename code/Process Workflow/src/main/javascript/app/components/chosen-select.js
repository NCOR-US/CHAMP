import { assign } from '@ember/polyfills';
import { copy } from '@ember/object/internals';
import { later, run } from '@ember/runloop';
import { observer } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
    classNames: ['ember-chosen-select'],

    optionValueKey: 'value',
    allowSingleDeselect: false,

    __watchOptions: observer('options', 'options.[]', function() {  // eslint-disable-line ember/no-observers
        let component = this;
        later(() => component.$('select').chosen().trigger('chosen:updated'));
    }),

    __watchValue: observer('value', function() {  // eslint-disable-line ember/no-observers
        let value = this.get('value');
        let component = this;

        later(() => component.$('select').val(value).trigger('chosen:updated'));
    }),

    init() {
        this._super(...arguments);

        let defaultConfig = {
            width: '100%',
            search_contains: true,
            allow_single_deselect: this.get('allowSingleDeselect')
        };

        let placeholder = this.get('placeholder');
        if (placeholder) {
            defaultConfig['placeholder_text_single'] = placeholder;
            defaultConfig['placeholder_text_multiple'] = placeholder;
        }

        this.set('defaultConfig', defaultConfig);
    },

    didInsertElement() {
        let defaultConfig = this.get('defaultConfig');

        let overrides = this.get('config') || {};
        let config = copy(defaultConfig, true);
        assign(config, overrides);

        let $select = this.$('select');

        if (this.get('multiple') === true) {
            $select.addAttribute('multiple');
        }

        let component = this;
        $select.chosen(config)
            .on('change', function(e, params) {
                if (params && params.selected) {
                    run(() => {
                        component.set('value', params.selected);
                    });
                } else {
                    run(() => {
                        component.set('value');
                    });
                }
            });
    }
});
