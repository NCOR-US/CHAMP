import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('aggregate-function-select', 'Integration | Component | aggregate function select', {
    integration: true
});

test('it renders with no aggregate functions', function(assert) {
    this.render(hbs`{{aggregate-function-select}}`);
    assert.equal(this.$('function-select').children().length, 0, "Length of options list is 0");
});
