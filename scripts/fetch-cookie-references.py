"""Download public WordPress source references for static inspection, not activation."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import hashlib
import io
import json
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1] / "reference-plugins"
SNAPSHOT = ROOT.parent / "docs/research/plugin-reference-manifest.json"


def download(metadata):
    # Reuse the reviewed versions rather than accumulating a new copy every run.
    slug = metadata["slug"]
    version = metadata["version"]
    url = metadata["download"]
    if not url.startswith("https://downloads.wordpress.org/plugin/"):
        raise ValueError("Unexpected source host")
    target = ROOT / (slug + "-" + version)
    marker = target / "REFERENCE-PACKAGE.json"
    if not marker.exists():
        with urllib.request.urlopen(url, timeout=90) as response:
            data = response.read()
        if hashlib.sha256(data).hexdigest() != metadata["sha256"]:
            raise ValueError("Source package digest differs from the reviewed snapshot")
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            # Validate all names before writing the package.
            for member in archive.infolist():
                name = Path(member.filename)
                if name.is_absolute() or ".." in name.parts:
                    raise ValueError("Invalid archive path")
            for member in archive.infolist():
                if member.is_dir():
                    continue
                path = target.joinpath(*Path(member.filename).parts[1:])
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(archive.read(member))
        marker.write_text(json.dumps({
            "slug": slug, "version": version, "download": url,
            "sha256": hashlib.sha256(data).hexdigest(),
        }, indent=2) + "\n")
    package = json.loads(marker.read_text())
    if package["sha256"] != metadata["sha256"]:
        raise ValueError("Cached package marker differs from the reviewed snapshot")
    license_lines = [
        line.lstrip("* ").split(":", 1)[1].strip()
        for line in (target / "readme.txt").read_text(errors="replace").splitlines()
        if line.lstrip("* ").startswith("License:")
    ]
    return {
        **package,
        "path": str(target.relative_to(ROOT.parent)),
        "homepage": metadata["homepage"],
        "license": license_lines[0] if license_lines else "See source headers",
        "size": sum(path.stat().st_size for path in target.rglob("*") if path.is_file()),
    }


if __name__ == "__main__":
    ROOT.mkdir(exist_ok=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        result = list(pool.map(download, json.loads(SNAPSHOT.read_text())))
    (ROOT / "manifest.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))
