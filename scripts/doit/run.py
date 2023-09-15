#!/usr/bin/env python
from __future__ import annotations
from pathlib import Path


def find_upwards(cwd: Path, filename: str) -> Path | None:
    if cwd == Path(cwd.root) or cwd == cwd.parent:
        return None

    fullpath = cwd / filename

    return fullpath if fullpath.exists() else find_upwards(cwd.parent, filename)


def set_doit_path():
    import sys
    study_yaml = find_upwards(Path.cwd(), "study.yaml")

    if not study_yaml:
        print()
        print("Error: Could not find study.yaml file in current directory or any parent directory")
        print()
        sys.exit(1)

    study_root_dir = study_yaml.parent

    local_doit_module = study_root_dir / "doit" / "src"

    sys.path.insert(0, str((local_doit_module.absolute())))


if __name__ == '__main__':
    set_doit_path()
    from cli import cli
    cli()
