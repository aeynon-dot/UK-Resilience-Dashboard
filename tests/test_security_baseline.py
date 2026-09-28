import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

SENSITIVE_FILENAMES = {
    ".env",
    ".git",
    ".aws",
    "credentials.json",
    "gcloud-service-key.json",
    "server.env",
}


class SecurityBaselineTests(unittest.TestCase):
    def test_no_sensitive_files_are_tracked_in_public_tree(self):
        offenders = []
        for path in ROOT.rglob("*"):
            if ".git" in path.parts:
                continue
            if path.is_file() and (
                path.name in SENSITIVE_FILENAMES
                or path.name.startswith(".env.")
                or path.name.endswith((".pem", ".key", ".p12", ".pfx"))
            ):
                offenders.append(str(path.relative_to(ROOT)))
        self.assertEqual(offenders, [], f"Sensitive files in public tree: {offenders}")

    def test_public_bundle_allowlist_is_documented(self):
        workflow = ROOT / ".github" / "workflows" / "cloudflare-pages.yml"
        text = workflow.read_text(encoding="utf-8")
        for required in ("index.html", "404.html", "style.css", "app.js", "data/current.json"):
            self.assertIn(required, text)
        self.assertIn("test -s dist/index.html", text)
        self.assertIn("test -s dist/404.html", text)


if __name__ == "__main__":
    unittest.main()
