module.exports = {
    extends: [
        'eslint:recommended',
        'plugin:ember/recommended'
    ],
    rules: {
        // override rules' settings here
        'no-console': 'off',
        'ember/named-functions-in-promises': [2, {
            allowSimpleArrowFunction: true
        }],
        'ember/use-ember-get-and-set': 'off'
    }
};
