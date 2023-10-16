class PDF_Root extends PDF_DictionaryObject {
    /** @param {PDF_IndirectObject<PDF_Pages>} pagesObject */
    constructor(pagesObject) {
        super(
            ['Type', new PDF_NameObject('Catalog')],
            ['Pages', pagesObject.getReference()]
        );
    }
}


class _PDF_Page_Node extends PDF_DictionaryObject {
    /** @type {PDF_IndirectObjectReference<PDF_Page>[]} */
    #children = [];

    constructor() {
        super(['Type', new PDF_NameObject('Pages')]);
    }

    /** @protected */
    get children(){
        return this.#children;
    }

    /**
     * @param {PDF_IndirectObject<PDF_Page>} page
     */
    addChild(page){
        this.#children.push(page.getReference());
    }

    generate() {
        this.#children.forEach(i => i.object._setParent(this.indirectObject.getReference()));
        this.setEntry('Kids', new PDF_ListObject(this.#children));
        this.setEntry('Count', new PDF_NumberObject(this.#children.length));
        return super.generate();
    }
}

class FontResource extends PDF_RawObject {
    constructor() {
        super('<</F1 << /Type /Font /Subtype /Type1 /Name /F1 /BaseFont /Helvetica >> >>');
    }
}

class BasicPDF_Page_Resources extends PDF_DictionaryObject {
    constructor() {
        super(
            ['ProcSet', new PDF_RawObject('[ /PDF /Text ]')],
            ['Font', new FontResource()]
        );
    }

    addFont(reference) {

    }
}

class PDF_Pages extends _PDF_Page_Node {
    /** @param {PDF_IndirectObjectReference<BasicPDF_Page_Resources>} resources */
    constructor(resources) {
        super();
        this.setEntry('MediaBox', new PDF_RawObject('[ 0 0 612 792 ]'));
        this.setEntry('Resources', resources);
    }

    /**
     * @param {PDF_IndirectObject<PDF_Page>} page
     */
    addPage(page){
        this.children.push(page.getReference());
    }

    generate() {
        // TODO: create balanced tree for performance
        return super.generate();
    }
}

class PDF_Page extends PDF_DictionaryObject {
    #parent;

    constructor() {
        super(['Type', new PDF_NameObject('Page')]);
    }

    /** @param {PDF_IndirectObjectReference<PDF_Pages>} parent */
    _setParent(parent) {
        this.#parent = parent;
        this.setEntry('Parent', parent);
    }

    /** @param {PDF_DirectObject} obj */
    setContent(obj){
        this.setEntry('Content', obj);
    }

    generate() {
        return super.generate();
    }
}