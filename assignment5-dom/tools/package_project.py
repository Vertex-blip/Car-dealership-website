"""Package the revised multipage assignment and verify every archived byte.

Run after current browser evidence and Assignment-5-Report.pdf have been built.
Historical one-page test records and working design dependencies are excluded.
"""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json
import os


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "Assignment-5-Project.zip"
FOLDER = "Apex-Motors-Assignment-5"
PAGES = ["index.html", "inventory.html", "showroom.html", "inquiry.html", "about.html"]
APPLICATION_JS = ["data.js", "theme-init.js", "site.js", "inventory.js", "booking.js", "gallery.js"]
REQUIRED = PAGES + [
    "styles.css", *[f"js/{name}" for name in APPLICATION_JS],
    "Assignment-5-Report.pdf", "README.md", "REQUIREMENTS.md",
    "DEFENSE-GUIDE.md", "screenshots/test-results.json",
    "screenshots/test-results-chrome-file.json",
    "screenshots/report-evidence.json",
]
RESOURCE_DIRS = ["images", "assets", "fonts"]
SKIP_DIRS = {"node_modules", "__pycache__", ".git", "tmp", "design", "vendor", "models"}


def resource_files(directory):
    """Prune caches before descending instead of walking dependency trees."""
    base = ROOT / directory
    if not base.is_dir():
        return
    for current, directories, names in os.walk(base):
        directories[:] = [name for name in directories if name not in SKIP_DIRS]
        for name in names:
            path = Path(current) / name
            if path.suffix.lower() not in {".zip", ".pyc", ".tmp", ".map"}:
                yield path


def main():
    for name in REQUIRED:
        if not (ROOT / name).is_file():
            raise FileNotFoundError(f"Current deliverable is missing: {name}")

    evidence = json.loads((ROOT / "screenshots/report-evidence.json").read_text(encoding="utf-8"))
    if evidence.get("source_version") != "revised-photographic":
        raise ValueError("Build the current photographic report before packaging.")
    for name, expected in evidence.get("source_hashes", {}).items():
        path = ROOT / name
        actual = hashlib.sha256(path.read_bytes()).hexdigest()
        if actual != expected:
            raise ValueError(f"Source changed after report generation; rebuild the report: {name}")
    files = {ROOT / name for name in REQUIRED}
    for directory in RESOURCE_DIRS:
        files.update(resource_files(directory))
    files.update(ROOT.glob("*.svg"))
    files.update(ROOT.glob("*.md"))
    files.update(ROOT.glob("*.txt"))
    files.update(ROOT.glob("LICENSE*"))
    for name in ["verify.cjs", "build_report.py", "package_project.py"]:
        path = ROOT / "tools" / name
        if path.is_file():
            files.add(path)
    for name in evidence["files"]:
        path = (ROOT / name).resolve()
        if not path.is_relative_to(ROOT) or not path.is_file():
            raise ValueError(f"Invalid evidence file: {name}")
        files.add(path)
    # deployment.json may explicitly record that this working copy awaits release.
    # Preserve that honest status; historical live test files are not current proof.
    deployment = ROOT / "deployment.json"
    if deployment.is_file():
        files.add(deployment)

    files = sorted(files, key=lambda path: path.relative_to(ROOT).as_posix())
    temporary = OUTPUT.with_suffix(".zip.tmp")
    with ZipFile(temporary, "w", ZIP_DEFLATED, compresslevel=9) as archive:
        for path in files:
            archive.write(path, f"{FOLDER}/{path.relative_to(ROOT).as_posix()}")
    with ZipFile(temporary) as archive:
        assert archive.testzip() is None, "Archive CRC verification failed."
        assert len(archive.namelist()) == len(files), "Duplicate archive paths."
        for path in files:
            name = f"{FOLDER}/{path.relative_to(ROOT).as_posix()}"
            assert archive.read(name) == path.read_bytes(), f"Stale archive entry: {name}"
        for page in PAGES:
            assert f"{FOLDER}/{page}" in archive.namelist()
        assert not any("node_modules/" in name for name in archive.namelist())
        assert not any(name.endswith(".zip") for name in archive.namelist())
        assert not any("/assets/vendor/" in name or "/models/" in name for name in archive.namelist())
        assert not any(name.endswith(("/mercedes.css", "/mercedes.js", "/showroom.js", "/main-test-results.json"))
                       for name in archive.namelist())
    temporary.replace(OUTPUT)
    print(f"Verified archive: {OUTPUT}")
    print(f"Files: {len(files)}; size: {OUTPUT.stat().st_size:,} bytes")
    print(f"SHA-256: {hashlib.sha256(OUTPUT.read_bytes()).hexdigest()}")


if __name__ == "__main__":
    main()
