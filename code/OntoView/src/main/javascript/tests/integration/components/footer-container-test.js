import Service from '@ember/service';
import { moduleForComponent, test } from 'ember-qunit';

// todo consider doing this as a mixin?
const configsStub = Service.extend({
    // need appConfig.dataGraph and appConfig.queryNamespaces
});

moduleForComponent('footer-container', 'Integration | Component | footer container', {
    integration: true,

    beforeEach() {
        this.register('service:configs', configsStub);
        this.inject.service('configs', {as: 'configs'});
    }
});

// this needs quite a bit from a canned query

test('it renders', function(assert) {
    // this.render(hbs`{{bgp-row}}`);
    // assert.equal(this.$().text().trim(), '');
    assert.expect(0);
});

test("it toggles editing mode", function(assert) {


    assert.expect(0);
});
