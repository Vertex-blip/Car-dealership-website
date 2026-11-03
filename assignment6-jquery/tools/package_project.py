"""Package the complete standalone submission and verify every ZIP entry."""
from pathlib import Path
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'Assignment-6-Project.zip'
required = ['index.html', 'inventory.html', 'showroom.html', 'about.html', 'inquiry.html',
            'script.js', 'styles.css', 'enhancements.css', 'search.css',
            'vendor/jquery-4.0.0.min.js', 'Assignment-6-Report.pdf', 'README.md',
            'REQUIREMENTS.md', 'DEFENSE-GUIDE.md', 'deployment.json']
for filename in required:
    assert (ROOT / filename).is_file(), f'Missing required file: {filename}'
files = sorted(p for p in ROOT.rglob('*') if p.is_file() and p.suffix != '.zip'
               and '__pycache__' not in p.parts and p.name != 'package-manifest.json')
with zipfile.ZipFile(OUTPUT, 'w', zipfile.ZIP_DEFLATED, compresslevel=7) as archive:
    for file in files:
        archive.write(file, 'Apex-Motors-Assignment-6/' + file.relative_to(ROOT).as_posix())
with zipfile.ZipFile(OUTPUT) as archive:
    assert archive.testzip() is None
    assert len(archive.namelist()) == len(files)
    for file in files:
        name = 'Apex-Motors-Assignment-6/' + file.relative_to(ROOT).as_posix()
        assert archive.read(name) == file.read_bytes(), f'Content mismatch: {name}'
manifest = {'archive': OUTPUT.name, 'files_verified': len(files), 'bytes': OUTPUT.stat().st_size,
            'sha256': hashlib.sha256(OUTPUT.read_bytes()).hexdigest(), 'verified': True}
(ROOT / 'package-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps(manifest))
