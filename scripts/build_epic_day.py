"""Build a provenance-tracked DSCOVR/EPIC day bundle from NASA endpoints.

The RGB values derived here come from contrast-adjusted natural-colour JPEGs and
are therefore visual diagnostics, not calibrated radiances. Publication science
must repeat the integration with EPIC Level-1B radiance products from ASDC.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

import numpy as np
import requests
from PIL import Image


API = "https://epic.gsfc.nasa.gov/api/natural/date/{date}"
ARCHIVE = "https://epic.gsfc.nasa.gov/archive/natural/{year}/{month}/{day}/jpg/{image}.jpg"


def build(date: str, output: Path) -> None:
    parsed = datetime.strptime(date, "%Y-%m-%d")
    response = requests.get(API.format(date=date), timeout=60)
    response.raise_for_status()
    records = response.json()
    image_dir = output / f"epic-{date}"
    image_dir.mkdir(parents=True, exist_ok=True)
    derived = []
    for record in records:
        url = ARCHIVE.format(
            year=parsed.strftime("%Y"), month=parsed.strftime("%m"),
            day=parsed.strftime("%d"), image=record["image"],
        )
        payload = requests.get(url, timeout=90).content
        digest = hashlib.sha256(payload).hexdigest()
        image = Image.open(BytesIO(payload)).convert("RGB")
        pixels = np.asarray(image, dtype=float) / 255.0
        brightness = pixels.max(axis=2)
        disk = brightness > 0.055
        rgb = np.mean(pixels[disk], axis=0)
        thumbnail = image.copy()
        thumbnail.thumbnail((640, 640), Image.Resampling.LANCZOS)
        local_name = f"{record['identifier']}.webp"
        thumbnail.save(image_dir / local_name, "WEBP", quality=84, method=6)
        derived.append({
            "identifier": record["identifier"],
            "date": record["date"],
            "image": record["image"],
            "centroidLatitude": record["centroid_coordinates"]["lat"],
            "centroidLongitude": record["centroid_coordinates"]["lon"],
            "diskRgbPreview": [round(float(value), 7) for value in rgb],
            "diskPixelFraction": round(float(disk.mean()), 7),
            "thumbnail": f"data/epic-{date}/{local_name}",
            "sourceUrl": url,
            "sourceSha256": digest,
        })
        print(record["identifier"], digest[:12])
    manifest = {
        "dataset": "DSCOVR EPIC natural-colour imagery",
        "date": date,
        "records": len(derived),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "apiUrl": API.format(date=date),
        "level1bArchive": "https://asdc.larc.nasa.gov/project/DSCOVR/DSCOVR_EPIC_L1B_3",
        "credit": "NASA EPIC Team",
        "scientificWarning": "RGB values are derived from display-adjusted natural imagery, not calibrated Level-1B radiance.",
        "observations": derived,
    }
    (output / f"epic-{date}.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", default="2024-01-01")
    parser.add_argument("--output", type=Path, default=Path("public/data"))
    arguments = parser.parse_args()
    build(arguments.date, arguments.output)
