export function isObjectArray(value: any) {
    if (typeof value === 'object') {
        return Object.keys(value).every((v) => isNumber(v))
    }
    return false
}
export function isNumber(num: string | number) {
    if (typeof num === 'number') {
        return num - num === 0;
    }
    if (typeof num === 'string' && num.trim() !== '') {
        return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
    }
    return false;
};