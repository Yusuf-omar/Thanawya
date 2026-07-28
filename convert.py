import json
import openpyxl
import sys
import os

# Fix console encoding
sys.stdout.reconfigure(encoding='utf-8')

def excel_to_json(xlsx_path, json_path):
    print(f"Reading: {os.path.basename(xlsx_path)}")
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    ws = wb.active
    
    rows = ws.iter_rows(values_only=True)
    headers = [str(h).strip().lower() if h else '' for h in next(rows)]
    print(f"  Headers: {headers}")
    
    # Build column index map
    col = {}
    for i, h in enumerate(headers):
        if 'seating' in h: col['seat'] = i
        elif 'arabic' in h or 'name' in h: col['name'] = i
        elif 'total' in h or 'degree' in h: col['degree'] = i
        elif 'case_desc' in h: col['desc'] = i
    
    print(f"  Mapped columns: {col}")
    
    records = []
    for row in rows:
        seat = row[col.get('seat', 0)]
        name = row[col.get('name', 1)]
        if seat is None or name is None:
            continue
        
        degree = row[col.get('degree', 2)] if col.get('degree') is not None else 0
        desc = row[col.get('desc', 3)] if col.get('desc') is not None and row[col['desc']] else ''
        
        records.append({
            "s": int(seat),
            "n": str(name).strip(),
            "d": float(degree) if degree else 0.0,
            "c": str(desc).strip() if desc else ''
        })
    
    wb.close()
    
    print(f"  Records: {len(records)}")
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(records, f, ensure_ascii=False, separators=(',', ':'))
    
    size_kb = os.path.getsize(json_path) / 1024
    print(f"  Output: {json_path} ({size_kb:.0f} KB)")

data_dir = r'd:\Programming\Projects\Thanwya\data'

excel_to_json(
    os.path.join(data_dir, '\u0646\u062a\u064a\u062c\u0629 \u062b\u0627\u0646\u0648\u064a\u0629 \u0639\u0627\u0645\u0629 \u0646\u0638\u0627\u0645 \u062d\u062f\u064a\u062b.xlsx'),
    os.path.join(data_dir, 'modern.json')
)

excel_to_json(
    os.path.join(data_dir, '\u0646\u062a\u064a\u062c\u0629 \u062b\u0627\u0646\u0648\u064a\u0629 \u0639\u0627\u0645\u0629 \u0646\u0638\u0627\u0645 \u0642\u062f\u064a\u0645.xlsx'),
    os.path.join(data_dir, 'old.json')
)

print("Done!")
