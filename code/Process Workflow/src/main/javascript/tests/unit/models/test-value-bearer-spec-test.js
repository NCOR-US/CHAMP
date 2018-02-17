import { moduleForModel, test } from 'ember-qunit';

moduleForModel('test-value-bearer-spec', 'Unit | Model | test value bearer spec', {
  // Specify the other units that are required for this test.
  needs: []
});

test('it exists', function(assert) {
  let model = this.subject();
  // let store = this.store();
  assert.ok(!!model);
});
