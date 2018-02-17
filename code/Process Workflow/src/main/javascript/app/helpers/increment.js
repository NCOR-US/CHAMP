import { helper } from '@ember/component/helper';

export function increment(params/*, hash*/) {
    return params[0] + 1;
}

export default helper(increment);
