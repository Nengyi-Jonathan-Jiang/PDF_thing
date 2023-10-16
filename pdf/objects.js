/** @abstract */
class PDF_Object {
    /**
     * @abstract
     * @returns {string}
     */
    generate() {
    }

    toString() {
        return aggressiveStrip(this.generate())
    }
}

/** @abstract */
class PDF_DirectObject extends PDF_Object {
    /**@type {PDF_IndirectObject<PDF_DirectObject>} */
    #indirectObject = null;

    /**
     * @return {PDF_IndirectObject<PDF_DirectObject>}
     */
    get indirectObject(){
        if(this.#indirectObject === null) throw new Error('Tried to access non-existent indirect object');
        return this.#indirectObject;
    }

    /** @param {PDF_IndirectObject<PDF_DirectObject>} indirectObject */
    set _indirectObject(indirectObject) {
        this.#indirectObject = indirectObject;
    }
}

class PDF_RawObject extends PDF_DirectObject {
    /** @type {string} */
    #object;

    constructor(object) {
        super();
        this.#object = object;
    }

    generate() {
        return this.#object;
    }
}

/** @template {PDF_DirectObject} T */
class PDF_IndirectObjectReference extends PDF_DirectObject {
    /** @type {PDF_IndirectObject<T>} */
    #object;

    /**
     * @param {PDF_IndirectObject} indirectObject
     */
    constructor(indirectObject) {
        super();
        this.#object = indirectObject;
    }

    /** @returns {T} */
    get object(){
        return this.#object.object;
    }

    get index() {
        return this.#object.index;
    }

    generate() {
        return `${this.index} 0 R`
    }
}


/** @template {PDF_DirectObject} T */
class PDF_IndirectObject extends PDF_Object {
    /** @type {T} */
    #object;

    /** @type {number} */
    #index;

    /**
     * @param {PDF_DirectObject} object
     * @param {Counter} index
     */
    constructor(object, index) {
        super();
        this.#object = object;
        this.#object._indirectObject = this;
        this.#index = index.increment();
    }

    /** @returns {T} */
    get object() { return this.#object }
    get index() { return this.#index }

    generate() {
        return `${this.index} 0 obj
            ${this.#object}
        endobj`
    }

    getReference() {
        return new PDF_IndirectObjectReference(this);
    }
}

class PDF_DictionaryObject extends PDF_DirectObject {
    /** @type {Map<string, PDF_DirectObject>} */
    #entries;

    /** @param {[string, PDF_DirectObject][]} entries... */
    constructor(...entries) {
        super();
        this.#entries = new Map(entries ?? []);
    }


    /** @return {Map<string, PDF_DirectObject>} */
    get entries() {
        return new Map(this.#entries);
    }

    /** @param {string} key */
    deleteEntry(key) {
        this.#entries.delete(key);
    }

    /**
     * @param {string} key
     * @param {PDF_DirectObject} value
     */
    setEntry(key, value) {
        this.#entries.set(key, value);
    }

    /** @param {string} key */
    hasEntry(key) {
        return this.#entries.has(key);
    }

    generate() {
        return `<<
            ${[...this.#entries.entries()].map(([key, value]) => `/${key} ${value}`).join('\n')}
        >>`
    }
}

class PDF_ListObject extends PDF_DirectObject {
    /** @type {PDF_DirectObject[]}*/
    #entries;

    /** @param {PDF_DirectObject[]} entries */
    constructor(entries) {
        super();
        this.#entries = entries;
    }

    get entries() {
        return this.#entries;
    }

    generate() {
        return `[
            ${this.#entries.map(object => object.toString()).join('\n')}
        ]`
    }
}

class PDF_NumberObject extends PDF_DirectObject {
    /** @type {number} */
    #value;

    /** @param {number} value */
    constructor(value) {
        super();
        this.#value = value;
    }

    get value() {
        return this.#value;
    }

    generate() {
        return numberToString(this.#value)
    }
}

class PDF_BooleanObject extends PDF_DirectObject {
    /** @type {boolean} */
    #value;

    /** @param {boolean} value */
    constructor(value) {
        super();
        this.#value = value;
    }

    get value() {
        return this.#value;
    }

    generate() {
        return this.#value ? 'true' : 'false'
    }
}

class PDF_StringObject extends PDF_DirectObject {
    /** @type {string} */
    #value;

    /** @param {string} value */
    constructor(value) {
        super();
        this.#value = value;
    }

    get value() {
        return this.#value;
    }

    generate() {
        return `(${this.#value
            .replaceAll(/\n/g, '\\n')
            .replaceAll(/[()\\]/g, '\\$&')})`;
    }
}

class PDF_NameObject extends PDF_DirectObject {
    /** @type {string} */
    #name;

    /** @param {string} value */
    constructor(value) {
        super();
        this.#name = value;
    }

    get name() {
        return this.#name;
    }

    generate() {
        return `/${this.#name
            .replaceAll(/#/g, '#23')
            .replaceAll(/\(/g, '#28')
            .replaceAll(/\)/g, '#29')
            .replaceAll(/ /g, '#20')}`;
    }
}

class PDF_StreamObject extends PDF_DirectObject {
    /** @type {string} */
    #data;
    /** @type {number} */
    #length;

    /** @param {string} data */
    constructor(data) {
        super();
        data = aggressiveStrip(data);
        this.#data = data;
        this.#length = stringLengthInBytes(data);
    }

    generate() {
        return `
        <<
            /Length ${this.#length}
        >>
        stream
        ${this.#data}
        endstream
        `;
    }
}