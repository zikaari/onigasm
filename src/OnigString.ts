class OnigString {
    private content: string

    constructor(content: string) {
        if(typeof content !== 'string') {
            throw new TypeError('Argument must be a string')
        }
        this.content = content
    }
    
    public get length() {
        return this.content.length
    }

    public substring = (start, end) => {
        return this.content.substring(start, end)
    }

    public toString = (start, end) => {
        return this.content
    }

}

export default OnigString
