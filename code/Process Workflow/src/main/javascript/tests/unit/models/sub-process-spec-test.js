import { moduleForModel, test, skip } from 'ember-qunit';
import { run } from '@ember/runloop'
import { detachStep } from 'process-workflow/utilities/process-utils';

import { modelList } from "../../helpers/constants";

moduleForModel('sub-process-spec', 'Unit | Model | sub process spec', {
    needs: modelList
});

test('it exists', function(assert) {
    let model = this.subject();
    assert.ok(!!model);
});

test('should detach the last step in a two-step process', function(assert) {
    assert.expect(4);

    let done = assert.async();
    let store = this.store();

    run(() => {
        let process = store.createRecord('process', { id: 'process-123' });
        let firstStep = store.createRecord('sub-process-spec', { id: 'sub-process-1' });
        let secondStep = store.createRecord('sub-process-spec', { id: 'sub-process-2' });

        process.set('firstStep', firstStep);
        firstStep.set('parentPlan', process);
        firstStep.set('nextSubProcess', secondStep);
        secondStep.set('previousSubProcess', firstStep);

        let promise = detachStep(process, secondStep, (newCurrentStepId) => {
            assert.equal(newCurrentStepId, firstStep.get('id'), "current step should be set to first.id");
        });

        assert.ok(promise);

        // eslint-disable-next-line
        promise
            .then(() => process.get('firstStep'))
            .then(step => {
                assert.equal(step.get('id'), firstStep.get('id'), "first step should be unchanged");
                return step;
            })
            .then(step => step.get('nextSubProcess'))
            .then(nothing => assert.notOk(nothing));

        done();
    });
});

test('should detach the first step in a two-step process', function(assert) {
    assert.expect(4);

    let done = assert.async();
    let store = this.store();

    run (() => {
        let process = store.createRecord('process', { id: 'process-123' });
        let firstStep = store.createRecord('sub-process-spec', { id: 'sub-process-1' });
        let secondStep = store.createRecord('sub-process-spec', { id: 'sub-process-2' });

        process.set('firstStep', firstStep);
        firstStep.set('parentPlan', process);
        firstStep.set('nextSubProcess', secondStep);
        secondStep.set('previousSubProcess', firstStep);

        let promise = detachStep(process, firstStep, (newCurrentStepId) => {
            assert.equal(newCurrentStepId, secondStep.get('id'), "current step should be set to second.id");
        });

        assert.ok(promise);

        // eslint-disable-next-line
        promise
            .then(() => process.get('firstStep'))
            .then(step => {
                assert.equal(step.get('id'), secondStep.get('id'), "second step should be promoted to first");
                return step;
            })
            .then(step => step.get('nextSubProcess'))
            .then(nothing => assert.notOk(nothing));

        done();
    });
});

skip('should detach the first step with children in a two-step process', function(assert) {
    assert.expect(0);
});

skip('should detach the second step with children in a three-step process', function(assert) {
    assert.expect(0);
});

skip('should detach a child step with children in a two-step process', function(assert) {
    assert.expect(0);
});
