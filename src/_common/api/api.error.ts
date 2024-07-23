
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
    
    //wallet
    static readonly NO_FREE_WALLET_EXISTS = new ApiError(1001, "There is no free wallet exists.");

    //transaction
    static readonly TRANSACTION_NOT_EXISTS = new ApiError(2001, "There is not exist transaction.");
    static readonly TRANSACTION_REQUEST_ID_EXISTS = new ApiError(2002, "There is a transaction using request id.");

}