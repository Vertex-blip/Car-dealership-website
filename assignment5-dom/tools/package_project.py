"""Package the verified, standalone assignment without nested archives or build caches."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "Assignment-5-Project.zip"
FOLDER = "Apex-Motors-Assignment-5"
REQUIRED = [
    "index.html", "styles.css", "js/site.js", "js/inventory.js",
    "js/booking.js", "assets/chime.wav",
    "Assignment-5-Report.pdf", "README.md", "REQUIREMENTS.md",
    "DEFENSE-GUIDE.md", "screenshots/test-results.json",
    "test-results-live.json", "deployment.json",
]


def main():
    for name in REQUIRED:
        if not (ROOT / name).is_file():
            raise FileNotFoundError(f"Required deliverable is missing: {name}")

    files = [
        item for item in sorted(ROOT.rglob("*"))
        if item.is_file()
        and item.suffix not in {".zip", ".pyc"}
        and item.name != ".gitignore"
        and not {"tmp", "__pycache__", ".git"}.intersection(item.relative_to(ROOT).parts)
    ]
    with ZipFile(OUTPUT, "w", ZIP_DEFLATED, compresslevel=9) as archive:
        for item in files:
            archive.write(item, f"{FOLDER}/{item.relative_to(ROOT).as_posix()}")

    with ZipFile(OUTPUT) as archive:
        assert archive.testzip() is None, "The archive failed its CRC check."
        assert len(archive.namelist()) == len(files)
        # Confirm every packaged byte matches the verified project on disk.
        for item in files:
            name = f"{FOLDER}/{item.relative_to(ROOT).as_posix()}"
            assert archive.read(name) == item.read_bytes(), f"Stale archive entry: {name}"

    digest = hashlib.sha256(OUTPUT.read_bytes()).hexdigest()
    print(f"Verified archive: {OUTPUT}")
    print(f"Files: {len(files)}; size: {OUTPUT.stat().st_size:,} bytes")
    print(f"SHA-256: {digest}")


if __name__ == "__main__":
    main()
