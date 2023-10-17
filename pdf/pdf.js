class PDF {
    /** @type {boolean} */
    static smallerOutput = false;

    /** @type {PDF_IndirectObject[]} */
    #indirectObjects = [];
    #index = new Counter();
    /** @type {PDF_IndirectObject<PDF_Root>} */
    #rootObject;
    /** @type {PDF_IndirectObject<PDF_Pages>} */
    #pagesObject;

    constructor() {
        let resources = new BasicPDF_Page_Resources();
        resources.addFont(this.addObject(new PDF_BasicFontObject('F:Arial', 'Arial')));
        resources.addFont(this.addObject(new PDF_BasicFontObject('F:Helvetica', 'Helvetica')));

        this.#pagesObject = this.addObject(new PDF_Pages(this.addObject(resources).getReference()));
        this.#rootObject = this.addObject(new PDF_Root(this.#pagesObject));
    }

    /**
     * @return {PDF_Pages}
     */
    get pages() {
        return this.#pagesObject.object;
    }

    /**
     * @return {PDF_Root}
     */
    get root() {
        return this.#rootObject.object;
    }

    /**
     * @param {T} object
     * @return {PDF_IndirectObject<T>}
     * @template {PDF_DirectObject} T
     */
    addObject(object) {
        const indirectObject = new PDF_IndirectObject(object, this.#index);
        this.#indirectObjects.push(indirectObject);
        return indirectObject;
    }

    generate() {
        /** @type {Map<number, number>} */
        const xRefsMap = new Map;
        let maxIndex = 0;

        const header = '%PDF-2.0\n%μμμμ';
        let currByteIndex = stringLengthInBytes(header);

        let body = '';

        for(let indirectObject of this.#indirectObjects) {
            xRefsMap.set(indirectObject.index, currByteIndex);
            const string = `${indirectObject.toString()}\n`;
            body += string;
            currByteIndex += stringLengthInBytes(string);
            maxIndex = Math.max(maxIndex, indirectObject.index);
        }

        const xRefTable = `xref\n0 ${maxIndex}\n${
            new Array(maxIndex+1).fill('').map((_, i) => {
                return xRefsMap.has(i) 
                    ? `${xRefsMap.get(i).toString().padStart(10, '0')} 00000 n` 
                    : '0000000000 65535 f';
            }).join('\n')
        }\n`;

        const trailer = `trailer ${
            new PDF_DictionaryObject(
                ['Size', new PDF_NumberObject(maxIndex)],
                ['Root', this.#rootObject.getReference()]
            )
        }\n`

        const footer = '%%EOF';

        return header + body + xRefTable + trailer + footer;
    }
}

