var log = require('npmlog');
var util = require('./util');

log.level = 'silly';
log.enableColor();
const HOST_CALLER_INDEX = 3;
const ENABLE = true;

Object.defineProperty(global, '__stack', {
    get: function () {
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function (_, stack) {
            return stack;
        };
        var err = new Error;
        Error.captureStackTrace(err, arguments.callee);
        var stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
});

Object.defineProperty(global, '__file', {
    get: function () {
        return __stack[HOST_CALLER_INDEX].getFileName().split('/').slice(-1)[0];
    }
});

Object.defineProperty(global, '__full_file', {
    get: function () {
        return __stack[HOST_CALLER_INDEX].getFileName();
    }
});

Object.defineProperty(global, '__line', {
    get: function () {
        return __stack[HOST_CALLER_INDEX].getLineNumber();
    }
});

function addFileAndLineInfo(args) {
    var copy = [].slice.call(args);
    copy.push('<' + __full_file + ':' + __line + '>');
    for (var i = 0; i < copy.length; ++i) {
        if (typeof copy[i] === typeof {}) {
            copy[i] = util.stringify(copy[i]);
        }
    }
    return copy;
}

function logFile() {
    if (ENABLE) {
        return true;
    }
    var js = require(__full_file);
    return js.log;
}

log.v = function () {
    if (logFile()) {
        log.verbose.apply(this, addFileAndLineInfo(arguments));
    }
};

log.s = function () {
    if (logFile()) {
        log.silly.apply(this, addFileAndLineInfo(arguments));
    }
};

log.i = function () {
    if (logFile()) {
        log.info.apply(this, addFileAndLineInfo(arguments));
    }
};

log.e = function () {
    var args = addFileAndLineInfo(arguments);
    for (var i = 0; i < args.length; ++i) {
        if (args[i]['stack']) {
            args[i] = args[i]['stack'];
        }
    }
    log.error.apply(this, args);
};

log.req = function (req) {
    // var user = req.session.passport ? req.session.passport.user : req.session.user;
    var user = req.user;
    var args = [req.method, ' ', req.url, ', user = ', user, ', body = ', req.body, ', params = ', req.params, ', headers = ', req.headers, ', passport = ', req.session.passport];
    log.http.apply(this, addFileAndLineInfo(args));
};

module.exports = log;