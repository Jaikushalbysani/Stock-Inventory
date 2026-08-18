export type TxnType = "inward" | "outward";
export type Kind = "bag" | "loose";

export interface Dealer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  bill_no: number;
  txn_date: string;
  type: TxnType;
  dealer_id: string;
  kind: Kind;
  bag_weight_kg: number | null;
  quantity: number;
  total_kg: number;
  notes: string | null;
  created_at: string;
}

/** Transaction row with joined dealer details. */
export interface TransactionRow extends Transaction {
  dealers: { name: string; phone: string | null; address: string | null } | null;
}

/** Row from the `stock_by_weight` view. */
export interface StockByWeightRow {
  kind: Kind;
  bag_weight_kg: number | null;
  in_qty: number;
  out_qty: number;
  balance_qty: number;
  balance_kg: number;
}

/** Row from the `dealer_stock` view. */
export interface DealerStockRow {
  dealer_id: string;
  dealer_name: string;
  in_kg: number;
  out_kg: number;
  balance_kg: number;
}

/** Single row from the `current_stock` view. */
export interface CurrentStock {
  total_bags: number;
  total_kg: number;
}

export interface ActivityRow {
  id: string;
  action: "created" | "deleted";
  transaction_id: string | null;
  bill_no: number | null;
  txn_type: TxnType | null;
  txn_date: string | null;
  dealer_name: string | null;
  kind: Kind | null;
  bag_weight_kg: number | null;
  quantity: number | null;
  total_kg: number | null;
  notes: string | null;
  at: string;
}
