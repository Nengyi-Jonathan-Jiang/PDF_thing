/**
 * Converts a number to a string, without using scientific notation
 * @param {number} x
 */
const numberToString = x => x.toLocaleString('en-US', {useGrouping: false, maximumFractionDigits: 10});

/**
 * @param {string} str
 * @returns {number} The length of the string in bytes
 */
const stringLengthInBytes = str => stringLengthInBytes.encoder.encode(str).length
stringLengthInBytes.encoder = new TextEncoder();

/** @param {string} str */
const aggressiveStrip = str => str.trim().split('\n').map(i => i.trim()).join('\n');

class Counter {
    /** @type {number} */
    #value;

    /** @param {number} value The initial value */
    constructor(value=1) { this.#value = value }

    /** @return {number} The current value of the counter */
    get value() { return this.#value }

    /**
     * @param {number} [amount] The amount to increment by
     * @return {number} The value of the counter before incrementing
     */
    increment(amount=1) {
        const currValue = this.#value;
        this.#value += amount;
        return currValue;
    }
}