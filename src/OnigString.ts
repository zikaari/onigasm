class OnigString {
    private source: string

    constructor(content: string) {
        if (typeof content !== 'string') {
            throw new TypeError('Argument must be a string')
        }
        this.source = content
    }

    public get content(): string {
        return this.source
    }

    public get length(): number {
        return this.source.length
    }

    public substring = (start, end) => {
        return this.source.substring(start, end)
    }

    public toString = (start, end) => {
        return this.source
    }

}

export default OnigString
