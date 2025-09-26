#!/usr/bin/env python3
import argparse
import os
import re
import sys
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional, Tuple

import pdfplumber  # type: ignore
import psycopg2  # type: ignore
import psycopg2.extras  # type: ignore
from dateutil import parser as dateparser  # type: ignore
import uuid

Row = Dict[str, Any]

HEADER_PRIMARY_KEYS = {
    "sl": ["sl", "s1", "si", "sl."],
    "date": ["date", "received date", "received"],
    "dealer": ["dealer", "brand"],
    "batt_type": ["batt type", "battery type", "type", "batt", "battery"],
    "customer_name": ["customer name", "customer", "name"],
    "contact": ["contact", "phone", "mobile"],
    "serial": ["serial", "serail", "serial number", "serial no", "sr no", "srno"],
    "comments": ["comments", "remark", "remarks", "notes"],
    "delivered_date": ["delivered date", "delivered", "delivery date"],
}

HEADER_PRICE_KEYS = {
    "sl": ["sl", "s1", "si", "sl."],
    "price": ["price", "amount", "est", "estimated"],
    "status": ["status"],
    "dion_comments": ["dion - comments", "dion comments", "dion", "external comments"],
    "ewheels_comments": ["e-wheels comments", "e wheels comments", "ewheels comments", "internal comments"],
}

STATUS_MAP = {
    "delivered": "delivered",
    "completed": "completed",
    "in progress": "in_progress",
    "in_progress": "in_progress",
    "diagnosed": "diagnosed",
    "received": "received",
    "cancelled": "cancelled",
    "on hold": "on_hold",
    "on_hold": "on_hold",
}

BATTERY_TYPE_DEFAULT = "li-ion"

PHONE_RE = re.compile(r"(?<!\d)(?:\+?91[- ]?)?(\d{10})(?!\d)")
VOLT_CAP_RE = re.compile(r"(?i)(\d{2,3}(?:\.\d+)?)\s*V[ ,]*\s*(\d{1,2}(?:\.\d+)?)\s*A?H")
CELL_TYPE_RE = re.compile(r"(?i)(18650|21700|prismatic|pouch)")
ROWS_REPLACED_RE = re.compile(r"(?i)(\d+)\s*row(s)?\s*(?:changed|week|weak|replaced|need to change)")
CELLS_REPLACED_RE = re.compile(r"(?i)(\d+)\s*cells?\s*(?:need to change|changed)")
BMS_FAULTY_RE = re.compile(r"(?i)BMS\s*(?:not\s*ok|faulty|no output|no\s*output)")
BMS_REPLACED_RE = re.compile(r"(?i)BMS\s*(?:changed|replaced)")
NMC_RE = re.compile(r"(?i)\bNMC\b")
LFP_RE = re.compile(r"(?i)\bLFP\b")
LI_ION_RE = re.compile(r"(?i)\bLI[- ]?ION\b|\bli-?on\b")

CURRENCY_RE = re.compile(r"(?i)[₹rs$€£, ]")


def normalize(s: Optional[str]) -> str:
    if s is None:
        return ""
    return re.sub(r"\s+", " ", s).strip()


def parse_price(s: str) -> Optional[Decimal]:
    s = normalize(s)
    if not s:
        return None
    # Remove currency symbols and commas
    cleaned = CURRENCY_RE.sub("", s)
    # Handle cases like 0.00 or 0
    try:
        if cleaned == "":
            return None
        return Decimal(cleaned)
    except InvalidOperation:
        return None


def parse_status(s: str) -> Optional[str]:
    s = normalize(s).lower()
    if not s:
        return None
    for k, v in STATUS_MAP.items():
        if k in s:
            return v
    return None


def parse_date(s: str, default_year: int = 2025) -> Optional[datetime]:
    s = normalize(s)
    if not s:
        return None
    # If year missing, append default year
    try:
        dt = dateparser.parse(s, dayfirst=True, yearfirst=False, default=datetime(default_year, 1, 1))
        return dt
    except Exception:
        return None


def detect_battery_fields(batt_type: str, comments_joined: str) -> Tuple[Optional[Decimal], Optional[Decimal], Optional[str], Optional[str]]:
    v = c = None
    battery_type = None
    cell_type = None
    text = " ".join([batt_type or "", comments_joined or ""])  # search both

    m = VOLT_CAP_RE.search(text)
    if m:
        try:
            v = Decimal(m.group(1))
            c = Decimal(m.group(2))
        except InvalidOperation:
            pass

    if NMC_RE.search(text):
        battery_type = "nmc"
    elif LFP_RE.search(text):
        battery_type = "lfp"
    elif LI_ION_RE.search(text):
        battery_type = "li-ion"

    m2 = CELL_TYPE_RE.search(text)
    if m2:
        cell_type = m2.group(1).lower()

    return v, c, battery_type, cell_type


def detect_bms_status(text: str) -> Optional[str]:
    txt = text or ""
    if BMS_REPLACED_RE.search(txt):
        return "replaced"
    if BMS_FAULTY_RE.search(txt):
        return "faulty"
    return None


def detect_rows_cells(text: str) -> Tuple[Optional[int], Optional[int]]:
    rows = None
    cells = None
    m = ROWS_REPLACED_RE.search(text or "")
    if m:
        try:
            rows = int(m.group(1))
        except Exception:
            pass
    m2 = CELLS_REPLACED_RE.search(text or "")
    if m2:
        try:
            cells = int(m2.group(1))
        except Exception:
            pass
    # Also capture patterns like "2 x 15" (rows x cells per row)
    mx = re.search(r"(?i)(\d+)\s*x\s*(\d+)", text or "")
    if mx and rows is None:
        try:
            rows = int(mx.group(1))
        except Exception:
            pass
    return rows, cells


def header_index_map(header: List[str], dictionary: Dict[str, List[str]]) -> Dict[str, int]:
    mapping: Dict[str, int] = {}
    norm = [normalize(h).lower() for h in header]
    for key, aliases in dictionary.items():
        for i, h in enumerate(norm):
            if any(alias == h or alias in h for alias in aliases):
                mapping[key] = i
                break
    return mapping


def extract_tables(pdf_path: str) -> Tuple[Dict[int, Row], Dict[int, Row]]:
    primary: Dict[int, Row] = {}
    price: Dict[int, Row] = {}

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            try:
                tables = page.extract_tables()
            except Exception:
                tables = []
            for tbl in tables:
                if not tbl or len(tbl) < 2:
                    continue
                header = [normalize(c) for c in (tbl[0] or [])]
                # Skip empty headers
                if all(not h for h in header):
                    continue
                prim_idx = header_index_map(header, HEADER_PRIMARY_KEYS)
                price_idx = header_index_map(header, HEADER_PRICE_KEYS)

                # Decide table type by which mapping is richer
                is_primary = len(prim_idx) >= 4 and ("date" in prim_idx or "batt_type" in prim_idx)
                is_price = (len(price_idx) >= 2 and ("price" in price_idx or "status" in price_idx)) and not is_primary

                if not (is_primary or is_price):
                    # Try fuzzy detection by presence of 'Price' or 'Status' in header
                    joined_header = " ".join(header).lower()
                    if "price" in joined_header or "status" in joined_header:
                        is_price = True
                    else:
                        is_primary = True

                for r in tbl[1:]:
                    cells = [normalize(c) for c in (r or [])]
                    # pad row to header length
                    if len(cells) < len(header):
                        cells += [""] * (len(header) - len(cells))

                    def get(idx_map: Dict[str, int], key: str) -> str:
                        i = idx_map.get(key, -1)
                        return cells[i] if 0 <= i < len(cells) else ""

                    sl_str = get(prim_idx if is_primary else price_idx, "sl")
                    if not sl_str:
                        # sometimes first col blank; try to infer by counting
                        continue
                    # Extract integer from Sl (may include backticks or symbols)
                    m_sl = re.search(r"(\d+)", sl_str)
                    if not m_sl:
                        continue
                    sl_no = int(m_sl.group(1))

                    if is_primary:
                        primary[sl_no] = {
                            "sl": sl_no,
                            "date": get(prim_idx, "date"),
                            "dealer": get(prim_idx, "dealer"),
                            "batt_type": get(prim_idx, "batt_type"),
                            "customer_name": get(prim_idx, "customer_name"),
                            "contact": get(prim_idx, "contact"),
                            "serial": get(prim_idx, "serial"),
                            "comments": get(prim_idx, "comments"),
                            "delivered_date": get(prim_idx, "delivered_date"),
                        }
                    else:
                        price[sl_no] = {
                            "sl": sl_no,
                            "price": get(price_idx, "price"),
                            "status": get(price_idx, "status"),
                            "dion_comments": get(price_idx, "dion_comments"),
                            "ewheels_comments": get(price_idx, "ewheels_comments"),
                        }

    return primary, price


def merge_rows(primary: Dict[int, Row], price: Dict[int, Row]) -> List[Row]:
    keys = sorted(set(primary.keys()) | set(price.keys()))
    rows: List[Row] = []
    for k in keys:
        p = primary.get(k, {})
        q = price.get(k, {})
        merged = {**p, **q}
        # If status missing but delivered date present, infer delivered
        if not merged.get("status") and merged.get("delivered_date"):
            merged["status"] = "Delivered"
        rows.append(merged)
    return rows


def customer_upsert(conn, name: str, contact: str) -> uuid.UUID:
    name = normalize(name)
    contact = normalize(contact)
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id FROM customers
            WHERE name = %s AND COALESCE(contact, '') = %s
            LIMIT 1
            """,
            (name, contact),
        )
        row = cur.fetchone()
        if row:
            return row[0]
        cur.execute(
            """
            INSERT INTO customers (id, name, contact)
            VALUES (uuid_generate_v4(), %s, %s)
            RETURNING id
            """,
            (name, contact),
        )
        cid = cur.fetchone()[0]
        return cid


def upsert_battery_record(conn, data: Row, created_by: uuid.UUID) -> Optional[uuid.UUID]:
    serial_number = normalize(data.get("serial"))
    if not serial_number:
        return None

    # Build mapped fields
    received_date = parse_date(data.get("date") or "")
    delivered_date = parse_date(data.get("delivered_date") or "")

    # Customer
    customer_name = normalize(data.get("customer_name")) or "Unknown"
    contact = normalize(data.get("contact"))
    # Try to extract a phone from comments if contact empty
    if not contact and data.get("comments"):
        m = PHONE_RE.search(data.get("comments"))
        if m:
            contact = m.group(1)

    customer_id = customer_upsert(conn, customer_name, contact)

    # Battery details
    comments_joined = " ".join(
        [normalize(data.get("comments")), normalize(data.get("dion_comments")), normalize(data.get("ewheels_comments"))]
    ).strip()

    v, c, battery_type, cell_type = detect_battery_fields(normalize(data.get("batt_type")), comments_joined)
    if battery_type is None:
        battery_type = BATTERY_TYPE_DEFAULT

    bms_status = detect_bms_status(comments_joined)
    rows_replaced, cells_replaced = detect_rows_cells(comments_joined)

    price_val = parse_price(data.get("price") or "")
    status_text = parse_status(data.get("status") or "") or ("delivered" if delivered_date else None) or "received"

    # Decide costs
    estimated_cost = None
    final_cost = None
    if price_val is not None:
        if status_text == "delivered":
            final_cost = price_val
        else:
            estimated_cost = price_val

    brand = normalize(data.get("dealer")) or "E-Wheels"

    # Notes
    repair_notes = normalize(data.get("ewheels_comments")) or normalize(data.get("comments"))
    technician_notes = normalize(data.get("dion_comments"))

    # Insert or update by serial_number
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO battery_records (
                serial_number, brand, model, battery_type, voltage, capacity, cell_type,
                customer_id, received_date, delivered_date, status,
                initial_voltage, load_test_result, ir_values, cell_voltages, bms_status,
                repair_type, cells_replaced, rows_replaced, repair_notes, technician_notes,
                estimated_cost, final_cost, parts_cost, labor_cost,
                created_by, updated_by
            ) VALUES (
                %(serial_number)s, %(brand)s, NULL, %(battery_type)s, %(voltage)s, %(capacity)s, %(cell_type)s,
                %(customer_id)s, %(received_date)s, %(delivered_date)s, %(status)s,
                NULL, NULL, NULL, NULL, %(bms_status)s,
                NULL, %(cells_replaced)s, %(rows_replaced)s, %(repair_notes)s, %(technician_notes)s,
                %(estimated_cost)s, %(final_cost)s, NULL, NULL,
                %(created_by)s, %(created_by)s
            )
            ON CONFLICT (serial_number)
            DO UPDATE SET
                brand = EXCLUDED.brand,
                battery_type = EXCLUDED.battery_type,
                voltage = COALESCE(EXCLUDED.voltage, battery_records.voltage),
                capacity = COALESCE(EXCLUDED.capacity, battery_records.capacity),
                cell_type = COALESCE(EXCLUDED.cell_type, battery_records.cell_type),
                customer_id = EXCLUDED.customer_id,
                received_date = COALESCE(EXCLUDED.received_date, battery_records.received_date),
                delivered_date = COALESCE(EXCLUDED.delivered_date, battery_records.delivered_date),
                status = EXCLUDED.status,
                bms_status = COALESCE(EXCLUDED.bms_status, battery_records.bms_status),
                cells_replaced = COALESCE(EXCLUDED.cells_replaced, battery_records.cells_replaced),
                rows_replaced = COALESCE(EXCLUDED.rows_replaced, battery_records.rows_replaced),
                repair_notes = CASE WHEN EXCLUDED.repair_notes <> '' THEN EXCLUDED.repair_notes ELSE battery_records.repair_notes END,
                technician_notes = CASE WHEN EXCLUDED.technician_notes <> '' THEN EXCLUDED.technician_notes ELSE battery_records.technician_notes END,
                estimated_cost = COALESCE(EXCLUDED.estimated_cost, battery_records.estimated_cost),
                final_cost = COALESCE(EXCLUDED.final_cost, battery_records.final_cost),
                updated_by = %(created_by)s,
                updated_at = NOW()
            RETURNING id
            """,
            {
                "serial_number": serial_number,
                "brand": brand,
                "battery_type": battery_type,
                "voltage": v,
                "capacity": c,
                "cell_type": cell_type,
                "customer_id": customer_id,
                "received_date": received_date,
                "delivered_date": delivered_date,
                "status": status_text,
                "bms_status": bms_status,
                "cells_replaced": cells_replaced,
                "rows_replaced": rows_replaced,
                "repair_notes": repair_notes,
                "technician_notes": technician_notes,
                "estimated_cost": estimated_cost,
                "final_cost": final_cost,
                "created_by": created_by,
            },
        )
        bid = cur.fetchone()[0]
        return bid


def main():
    parser = argparse.ArgumentParser(description="Ingest E-Wheels Battery Status PDF into Supabase (Postgres)")
    parser.add_argument("pdf_path", nargs="?", default="E-Wheels - Battery Status - 21 Aug.xlsx - MAIN.pdf", help="Path to the PDF file")
    parser.add_argument("--dry-run", action="store_true", help="Parse and show summary without writing to DB")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of rows to ingest (0 = all)")

    args = parser.parse_args()

    pdf_path = args.pdf_path
    if not os.path.isfile(pdf_path):
        print(f"Error: PDF not found at {pdf_path}", file=sys.stderr)
        sys.exit(1)

    primary, price = extract_tables(pdf_path)
    rows = merge_rows(primary, price)
    if args.limit and args.limit > 0:
        rows = rows[: args.limit]

    # DB connection
    db_url = os.environ.get("SUPABASE_DB_URL")
    if not db_url and not args.dry_run:
        print("Error: SUPABASE_DB_URL env var is required (postgres://...)", file=sys.stderr)
        sys.exit(2)

    ingest_user_env = os.environ.get("INGEST_USER_ID")
    try:
        created_by = uuid.UUID(ingest_user_env) if ingest_user_env else uuid.uuid4()
    except Exception:
        created_by = uuid.uuid4()

    print(f"Parsed rows (primary={len(primary)}, price={len(price)}), merged={len(rows)}")

    if args.dry_run:
        # Show a compact preview
        for r in rows[: min(10, len(rows))]:
            v, c, bt, ct = detect_battery_fields(normalize(r.get("batt_type")), " ".join(
                [normalize(r.get("comments")), normalize(r.get("dion_comments")), normalize(r.get("ewheels_comments"))]
            ))
            print(
                {
                    "sl": r.get("sl"),
                    "date": r.get("date"),
                    "dealer": r.get("dealer"),
                    "batt_type": r.get("batt_type"),
                    "customer": r.get("customer_name"),
                    "contact": r.get("contact"),
                    "serial": r.get("serial"),
                    "price": parse_price(r.get("price") or ""),
                    "status": parse_status(r.get("status") or ""),
                    "received_date": parse_date(r.get("date") or ""),
                    "delivered_date": parse_date(r.get("delivered_date") or ""),
                    "voltage": v,
                    "capacity": c,
                    "bat_type": bt,
                    "cell_type": ct,
                }
            )
        print("Dry run complete. No database changes.")
        return

    conn = psycopg2.connect(db_url)
    conn.autocommit = False

    inserted = 0
    skipped = 0
    errors: List[Tuple[int, str]] = []

    try:
        with conn:
            for r in rows:
                try:
                    if not normalize(r.get("serial")):
                        skipped += 1
                        errors.append((r.get("sl") or -1, "Missing serial number"))
                        continue
                    upsert_battery_record(conn, r, created_by)
                    inserted += 1
                except Exception as e:
                    conn.rollback()
                    skipped += 1
                    errors.append((r.get("sl") or -1, f"{type(e).__name__}: {e}"))
                    # continue with next row in same transaction block
        conn.commit()
    finally:
        conn.close()

    print(f"Ingestion complete. Inserted/updated: {inserted}, Skipped: {skipped}")
    if errors:
        print("Some rows were skipped:")
        for sl, err in errors[:50]:
            print(f"  Sl {sl}: {err}")
        if len(errors) > 50:
            print(f"  ... and {len(errors) - 50} more")


if __name__ == "__main__":
    main()
