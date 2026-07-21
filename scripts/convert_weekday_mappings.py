from __future__ import annotations

import json
from pathlib import Path

import pandas as pd


WORKBOOK_NAME = "115年序號牌卡對照表.xlsx"

SHEET_KEY_MAP = {
    "星期一對照表": "monday",
    "星期二對照表": "tuesday",
    "星期三對照表": "wednesday",
    "星期四對照表": "thursday",
    "星期五對照表": "friday",
    "星期六對照表": "saturday",
    "星期日對照表": "sunday",
}


def convert_workbook(workbook_path: Path) -> dict[str, list[dict[str, int | str]]]:
    workbook = pd.ExcelFile(workbook_path)
    output: dict[str, list[dict[str, int | str]]] = {}

    for sheet_name, output_key in SHEET_KEY_MAP.items():
      df = pd.read_excel(workbook, sheet_name=sheet_name)
      df = df.rename(
          columns={
              "序號": "sequence",
              "牌號": "cardNumber",
              "牌名": "cardName",
          }
      )[["sequence", "cardNumber", "cardName"]]

      records = []
      for row in df.to_dict(orient="records"):
          records.append(
              {
                  "sequence": int(row["sequence"]),
                  "cardNumber": int(row["cardNumber"]),
                  "cardName": str(row["cardName"]).strip(),
              }
          )

      output[output_key] = records

    return output


def main() -> None:
    project_root = Path(__file__).resolve().parent.parent
    workbook_path = project_root / WORKBOOK_NAME
    output_path = project_root / "src" / "data" / "weekdayMappings.json"

    mappings = convert_workbook(workbook_path)
    output_path.write_text(
        json.dumps(mappings, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Converted workbook to {output_path}")


if __name__ == "__main__":
    main()
