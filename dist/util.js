"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNumber = exports.isObjectArray = void 0;
function isObjectArray(value) {
    if (typeof value === 'object') {
        return Object.keys(value).every((v) => isNumber(v));
    }
    return false;
}
exports.isObjectArray = isObjectArray;
function isNumber(num) {
    if (typeof num === 'number') {
        return num - num === 0;
    }
    if (typeof num === 'string' && num.trim() !== '') {
        return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
    }
    return false;
}
exports.isNumber = isNumber;
;
