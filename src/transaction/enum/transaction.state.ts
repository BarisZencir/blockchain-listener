export enum TransactionState {
    REQUESTED = "REQUESTED",
    PROCESSED = "PROCESSED",
    CANCELLED = "CANCELLED", //buna bakacaz.
    COMPLATED = "COMPLATED",
    ERROR_OCCURED = "ERROR_OCCURED"
}

export enum TransactionType {
    WITHDRAW = "WITHDRAW",
    DEPOSITE = "DEPOSITE"
}