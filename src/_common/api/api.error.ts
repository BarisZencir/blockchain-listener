
//Her hatanın bir sebebi vardır...(Baran Basaran)
export class ApiError {

    constructor(private readonly errorCode: number, private readonly message: string) { }

    public getErrorCode(): number {
        return this.errorCode;
    }

    public getMessage(): string {
        return this.message;
    }

    //auth
    static readonly TOKEN_ERROR = new ApiError(101, "Token error.");

    //user
    static readonly NOT_AUTHORIZED = new ApiError(210, "You are not authorized.");
    static readonly INVALID_FIELDS = new ApiError(504, "Invalid fields.");

}