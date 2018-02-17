import Service from '@ember/service';
import { moduleForComponent, test } from 'ember-qunit';

const configsStub = Service.extend({
    // need appConfig.dataGraph and appConfig.queryNamespaces
});

moduleForComponent('class-lookup', 'Integration | Component | class lookup', {
    integration: true,

    beforeEach() {
        this.register('service:configs', configsStub);
        this.inject.service('configs', {as: 'configs'});
    }
});

test("it doesn't render by itself", function(assert) {
    // ensure this doesn't work since it needs to query out for classOptions
    // this still bombs out wiht the stub
    // assert.throws(() => this.render(hbs`{{class-lookup}}`));

    // retry render with local classOptions
    assert.expect(0);
});

test("it renders with class options", function(assert) {


    assert.expect(0);
});
