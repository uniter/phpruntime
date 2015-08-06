'use strict';

module.exports = function (done, callback) {
    return function () {
        try {
            callback.apply(this, arguments);
            done();
        } catch (error) {
            done(error);
        }
    };
};
