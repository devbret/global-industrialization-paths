from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd


CSV_PATH = Path("data.csv")
OUT_JSON_PATH = Path("bubble_data.json")

INDICATORS = {
    "x": {
        "Item": "Gross Domestic Product",
        "Element": "Value US$ per capita",
        "Unit": "USD",
    },
    "y": {
        "Item": "Value Added (Total Manufacturing)",
        "Element": "Share of GDP US$",
        "Unit": "%",
    },
    "r": {
        "Item": "Gross Domestic Product",
        "Element": "Value US$",
        "Unit": "million USD",
    },
}

COUNTRY_CODE_COL_CANDIDATES = ["Area Code (M49)", "Area Code"]
COUNTRY_NAME_COL = "Area"
ITEM_COL = "Item"
ELEMENT_COL = "Element"
UNIT_COL = "Unit"

YEAR_MIN: Optional[int] = None
YEAR_MAX: Optional[int] = None

DROP_IF_MISSING_XY = True 
MIN_RADIUS_IF_MISSING_R = None  

TOP_N_PER_YEAR: Optional[int] = None 

def _clean_str(x) -> str:
    if pd.isna(x):
        return ""
    s = str(x).strip()
    s = s.lstrip("'").strip('"').strip()
    s = re.sub(r"\s+", " ", s)
    return s


def _find_first_existing_col(df: pd.DataFrame, candidates: List[str]) -> str:
    for c in candidates:
        if c in df.columns:
            return c
    raise KeyError(f"None of these columns exist in CSV: {candidates}")


def _year_value_columns(df: pd.DataFrame) -> List[str]:
    cols = []
    for c in df.columns:
        if re.fullmatch(r"Y\d{4}", str(c).strip()):
            cols.append(c)
    cols_sorted = sorted(cols, key=lambda x: int(x[1:]))
    return cols_sorted


def _to_number_series(s: pd.Series) -> pd.Series:
    s2 = (
        s.astype(str)
        .str.replace(",", "", regex=False)
        .str.strip()
        .replace({"": None, "nan": None, "None": None})
    )
    return pd.to_numeric(s2, errors="coerce")

def main() -> None:
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"CSV not found: {CSV_PATH.resolve()}")

    df = pd.read_csv(CSV_PATH, dtype=str, low_memory=False)

    code_col = _find_first_existing_col(df, COUNTRY_CODE_COL_CANDIDATES)
    if COUNTRY_NAME_COL not in df.columns:
        raise KeyError(f"Expected column '{COUNTRY_NAME_COL}' not found in CSV.")

    year_cols = _year_value_columns(df)
    if not year_cols:
        raise ValueError("No year value columns found (expected columns like Y1970, Y1971, ...).")

    years_all = [int(c[1:]) for c in year_cols]
    y_min = YEAR_MIN if YEAR_MIN is not None else min(years_all)
    y_max = YEAR_MAX if YEAR_MAX is not None else max(years_all)
    year_cols = [f"Y{y}" for y in range(y_min, y_max + 1) if f"Y{y}" in df.columns]
    years = [int(c[1:]) for c in year_cols]

    for c in [code_col, COUNTRY_NAME_COL, ITEM_COL, ELEMENT_COL, UNIT_COL]:
        if c in df.columns:
            df[c] = df[c].map(_clean_str)

    id_vars = [code_col, COUNTRY_NAME_COL, ITEM_COL, ELEMENT_COL, UNIT_COL]
    long_df = df.melt(
        id_vars=id_vars,
        value_vars=year_cols,
        var_name="YearCol",
        value_name="Value",
    )
    long_df["Year"] = long_df["YearCol"].str.extract(r"Y(\d{4})").astype(int)
    long_df["Value"] = _to_number_series(long_df["Value"])

    def build_mask(spec: Dict[str, str]) -> pd.Series:
        return (
            (long_df[ITEM_COL] == _clean_str(spec["Item"]))
            & (long_df[ELEMENT_COL] == _clean_str(spec["Element"]))
            & (long_df[UNIT_COL] == _clean_str(spec["Unit"]))
        )

    keep_frames = []
    for key, spec in INDICATORS.items():
        sub = long_df[build_mask(spec)].copy()
        sub["metric"] = key
        keep_frames.append(sub)

    if not keep_frames:
        raise ValueError("No rows matched your INDICATORS specs. Check Item/Element/Unit strings.")

    sub_df = pd.concat(keep_frames, ignore_index=True)

    wide = (
        sub_df.pivot_table(
            index=[code_col, COUNTRY_NAME_COL, "Year"],
            columns="metric",
            values="Value",
            aggfunc="first",
        )
        .reset_index()
    )

    if DROP_IF_MISSING_XY:
        wide = wide.dropna(subset=["x", "y"], how="any")

    if "r" not in wide.columns:
        wide["r"] = pd.NA

    if MIN_RADIUS_IF_MISSING_R is not None:
        wide["r"] = wide["r"].fillna(float(MIN_RADIUS_IF_MISSING_R))

    wide = wide[(wide["Year"] >= y_min) & (wide["Year"] <= y_max)]

    wide["code"] = wide[code_col].astype(str).str.strip()
    wide["area"] = wide[COUNTRY_NAME_COL].astype(str).str.strip()

    by_year: Dict[str, List[Dict]] = {}
    for y in years:
        frame = wide[wide["Year"] == y].copy()

        if TOP_N_PER_YEAR is not None and "r" in frame.columns:
            frame = frame.sort_values(by="r", ascending=False, na_position="last").head(TOP_N_PER_YEAR)

        records = []
        for row in frame.itertuples(index=False):
            rec = {
                "code": getattr(row, "code"),
                "area": getattr(row, "area"),
                "x": None if pd.isna(getattr(row, "x", pd.NA)) else float(getattr(row, "x")),
                "y": None if pd.isna(getattr(row, "y", pd.NA)) else float(getattr(row, "y")),
                "r": None if pd.isna(getattr(row, "r", pd.NA)) else float(getattr(row, "r")),
            }
            records.append(rec)

        by_year[str(y)] = records

    out = {"years": years, "byYear": by_year, "meta": {"indicators": INDICATORS}}

    OUT_JSON_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote: {OUT_JSON_PATH.resolve()}")
    print(f"Years: {years[0]}..{years[-1]} | Frames: {sum(len(v) for v in by_year.values()):,} points")


if __name__ == "__main__":
    main()
