"""Refresh HTML asset URLs when local CSS/JavaScript content changes.

Run before publication. Stable content hashes prevent a cached stylesheet from
being combined with newer HTML; query versions also work when opening the ZIP.
"""
from pathlib import Path
import hashlib
import re

ROOT = Path(__file__).resolve().parents[1]
pattern = re.compile(r'\b(src|href)="([^"?]+\.(?:css|js))(?:\?[^" ]*)?"')
versions = {}

def version(match):
    attribute, relative = match.groups()
    if relative.startswith(('http:', 'https:', '//')):
        return match.group(0)
    asset = ROOT / relative
    assert asset.is_file(), f'Missing asset: {relative}'
    digest = hashlib.sha256(asset.read_bytes()).hexdigest()[:12]
    versions[relative] = digest
    return f'{attribute}="{relative}?v={digest}"'

for page in ROOT.glob('*.html'):
    original = page.read_text(encoding='utf-8')
    updated = pattern.sub(version, original)
    if updated != original:
        page.write_text(updated, encoding='utf-8')
print(f'Versioned {len(versions)} local assets across all five pages.')
