#!/usr/bin/env python
from __future__ import annotations
import sys

SIDD_MODULE_PATH = "doit/sidd/scripts/doit"

if __name__ == '__main__':
    from doit.launcher import run_module, get_study_root_dir
    session_dir = get_study_root_dir()
    run_module(
        "cli",
        [str(session_dir / SIDD_MODULE_PATH)],
        sys.argv[1:],
    )
