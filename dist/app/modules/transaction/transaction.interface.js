"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionStatus = exports.TransactionType = void 0;
var TransactionType;
(function (TransactionType) {
    TransactionType["ADD_MONEY"] = "add_money";
    TransactionType["SEND_MONEY"] = "send_money";
    TransactionType["CASH_IN"] = "cash_in";
    TransactionType["CASH_OUT"] = "cash_out";
    TransactionType["ADMIN_PROFIT"] = "admin_profit";
    TransactionType["COMMISSION"] = "commission";
    TransactionType["ADMIN_WITHDRAW"] = "admin_withdraw";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["APPROVED"] = "approved";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
