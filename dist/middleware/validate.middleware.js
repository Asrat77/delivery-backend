"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
function replaceObjectContents(target, value) {
    if (!target || typeof target !== "object")
        return;
    if (!value || typeof value !== "object")
        return;
    // Express 5 exposes some request properties via getters (read-only setters).
    // To avoid `TypeError: ... has only a getter`, mutate the existing object in-place.
    for (const key of Object.keys(target)) {
        delete target[key];
    }
    Object.assign(target, value);
}
function defineRequestProperty(req, key, value) {
    // Express 5 may expose req.query/req.params via getters only.
    // Defining an own property on the request instance safely shadows the getter.
    try {
        Object.defineProperty(req, key, {
            value,
            writable: true,
            enumerable: true,
            configurable: true,
        });
        return true;
    }
    catch {
        return false;
    }
}
function validate(schemas) {
    return (req, _res, next) => {
        if (schemas.body) {
            // req.body is writable in typical Express setups
            req.body = schemas.body.parse(req.body);
        }
        if (schemas.params) {
            const parsedParams = schemas.params.parse(req.params);
            if (!defineRequestProperty(req, "params", parsedParams)) {
                replaceObjectContents(req.params, parsedParams);
            }
        }
        if (schemas.query) {
            const parsedQuery = schemas.query.parse(req.query);
            if (!defineRequestProperty(req, "query", parsedQuery)) {
                replaceObjectContents(req.query, parsedQuery);
            }
        }
        next();
    };
}
