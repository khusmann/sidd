from __future__ import annotations
from pathlib import Path
import click


@click.command()
@click.argument("bundle_yaml_path", type=click.Path(exists=True))
def cli(bundle_yaml_path: str | Path) -> None:
    from render import render_sidd
    bundle_yaml_path = Path(bundle_yaml_path)
    render_sidd(bundle_yaml_path)
