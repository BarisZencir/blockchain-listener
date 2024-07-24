export enum TransactionState {
    REQUESTED = "REQUESTED",
    CANCELLED = "CANCELLED", //buna bakacaz.
    COMPLATED = "COMPLATED",
}

export enum TransactionType {
    NOT_KNOWN = "NOT_KNOWN",
    WITHDRAW = "WITHDRAW",
    VIRMAN = "VIRMAN",
    DEPOSIT = "DEPOSIT"
}