from pathlib import Path
from doit.launcher import get_study_root_dir

TEMPLATE_PATH = get_study_root_dir() / "doit/sidd/src/codebook.html"


def render_sidd(bundle_yaml_path: Path):
    from stats import HtmlReportObject
    from doit.bundle import RenderedBundle

    rendered_bundle = RenderedBundle.read_file(bundle_yaml_path)

    raw_text = TEMPLATE_PATH.read_text()

    report_obj = HtmlReportObject.encode(rendered_bundle)

    escaped_text = report_obj.model_dump_json().replace("'", r"\'")

    report_text = raw_text.replace(
        '"{{}}"', f"'{escaped_text}'"
    )

    bundle_yaml_path.with_suffix(
        f".{TEMPLATE_PATH.name}"
    ).write_text(report_text)
