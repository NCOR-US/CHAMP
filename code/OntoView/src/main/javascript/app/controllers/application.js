import { reads } from '@ember/object/computed';
import Controller from '@ember/controller';

export default Controller.extend({
    // see eslint-plugin-ember/docs/rules/alias-model-in-controller.md
    entityQueryService: reads('model.entityQueryService'),
    configService: reads('model.configService')
});
