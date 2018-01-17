define([
    'lodash'
], function(_) {
    var checkKeys = (data, keys, exception=false, origin='') => {
        _.each(keys, (key) => {
            var value = _.get(data, key, null);
            if (value === null || value === '' ) {
                if (exception) {
                    throw `[${origin}] Data is missing "${key}" key.`;
                } else {
                    return false;
                }
            }
        });

        return true;
    }

    return {
        checkKeys: checkKeys,
    }
});
