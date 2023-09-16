#!/usr/bin/env python
from __future__ import annotations

if __name__ == '__main__':
    from doit.launcher import set_doit_path
    set_doit_path()
    from cli import cli
    cli()
