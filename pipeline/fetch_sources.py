#!/usr/bin/env python3
"""
Downloads the large upstream sources into pipeline/build/cache (not committed), pinned to the
commits recorded in sources/NOTICE.md. Only needed to regenerate the Catechism index, the Fathers
starter set or the Fathers pack; the Bible and lectionary sources are vendored in sources/.
"""

import subprocess
import sys
import urllib.request
from pathlib import Path

CACHE = Path(__file__).resolve().parent / "build" / "cache"

CCC_JSON = "https://github.com/nossbigg/catechism-ccc-json/releases/download/v0.0.2/ccc.json"
FATHERS_REPO = "https://github.com/HistoricalChristianFaith/Commentaries-Database.git"
FATHERS_COMMIT = "8e8082b5f541e7e4105f48692f973956caa72dcd"


def main() -> int:
    CACHE.mkdir(parents=True, exist_ok=True)
    ccc = CACHE / "ccc-v0.0.2.json"
    if not ccc.exists():
        print("Downloading", CCC_JSON)
        urllib.request.urlretrieve(CCC_JSON, ccc)
    fathers = CACHE / "Commentaries-Database"
    if not fathers.exists():
        print("Cloning", FATHERS_REPO)
        subprocess.run(["git", "clone", "--filter=blob:none", FATHERS_REPO, str(fathers)], check=True)
    subprocess.run(["git", "-C", str(fathers), "checkout", "-q", FATHERS_COMMIT], check=True)
    print("Sources ready in", CACHE)
    return 0


if __name__ == "__main__":
    sys.exit(main())
