from __future__ import annotations
import click


@click.command()
def cli():
    from doit.session import SessionManager
    session = SessionManager.new_session()
    click.secho(session.curr_doit_revision)

    import doit.session

    print(doit.session.__file__)
