import Component from '@ember/component';

export default Component.extend({
    tagName: 'ul',
    classNameBindings: [':side-nav', 'isIndented:indented:not-indented'],
    isIndented: false,

    actions: {
        setCurrentStep(id) {
            // we need bubbling here
            // eslint-disable-next-line ember/closure-actions
            this.sendAction('setCurrent', id);
        }
    }
});
