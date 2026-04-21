#!/usr/bin/env python3
"""
Convertisseur Markdown vers PDF avec mise en forme
Utilise markdown2 + weasyprint pour une conversion de qualité

Les blocs ```mermaid ... ``` ne peuvent pas être rendus par WeasyPrint (pas de JS).
Ils sont pré-rendus via l’API Kroki avant conversion MD→HTML :
  - par défaut : **PNG** (https://kroki.io/mermaid/png) — les SVG Mermaid utilisent
    souvent <foreignObject>, mal supporté par WeasyPrint : le PDF pouvait sembler vide ;
  - secours : SVG Kroki, puis mermaid-cli (mmdc) en PNG puis SVG.
Variable d’environnement KROKI_URL : URL complète d’endpoint (ex. .../mermaid/png).
"""

import base64
import html as html_module
import os
import re
import shutil
import subprocess
import tempfile
import urllib.error
import urllib.request

import markdown2
from weasyprint import HTML, CSS
from pathlib import Path

MERMAID_BLOCK = re.compile(
    r"^```mermaid\s*\n(.*?)```",
    re.MULTILINE | re.DOTALL,
)


def _kroki_mermaid_url(output_format: str) -> str:
    """output_format: 'png' | 'svg'."""
    custom = os.environ.get("KROKI_URL", "").strip()
    if custom:
        if custom.endswith("/mermaid/svg") and output_format == "png":
            return custom[: -len("svg")] + "png"
        if custom.endswith("/mermaid/png") and output_format == "svg":
            return custom[: -len("png")] + "svg"
        return custom
    return f"https://kroki.io/mermaid/{output_format}"


# Template HTML avec style
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{title}</title>
</head>
<body>
    {content}
</body>
</html>
"""

# Style CSS pour un rendu professionnel
CSS_STYLE = """
@page {
    size: A4;
    margin: 2cm;
}

body {
    font-family: 'DejaVu Sans', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #333;
}

h1 {
    color: #2c3e50;
    font-size: 24pt;
    margin-top: 20pt;
    margin-bottom: 12pt;
    border-bottom: 2px solid #3498db;
    padding-bottom: 6pt;
}

h2 {
    color: #34495e;
    font-size: 18pt;
    margin-top: 16pt;
    margin-bottom: 10pt;
}

h3 {
    color: #555;
    font-size: 14pt;
    margin-top: 12pt;
    margin-bottom: 8pt;
}

p {
    margin-bottom: 10pt;
    text-align: justify;
}

code {
    background-color: #f4f4f4;
    padding: 2pt 4pt;
    border-radius: 3pt;
    font-family: 'DejaVu Sans Mono', monospace;
    font-size: 10pt;
    word-wrap: break-word;
    overflow-wrap: break-word;
    white-space: pre-wrap;
}

pre {
    background-color: #f8f8f8;
    border: 1px solid #ddd;
    border-radius: 4pt;
    padding: 10pt;
    margin: 10pt 0;
    overflow: visible;
    word-wrap: break-word;
    overflow-wrap: break-word;
    white-space: pre-wrap;
    max-width: 100%;
    box-sizing: border-box;
    page-break-inside: auto;
    font-size: 9pt;
    line-height: 1.4;
}

pre code {
    background-color: transparent;
    padding: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    display: block;
    width: 100%;
}

blockquote {
    border-left: 4px solid #3498db;
    padding-left: 12pt;
    margin-left: 0;
    color: #555;
    font-style: italic;
}

table {
    border-collapse: collapse;
    width: 100%;
    margin: 12pt 0;
}

th, td {
    border: 1px solid #ddd;
    padding: 8pt;
    text-align: left;
}

th {
    background-color: #3498db;
    color: white;
    font-weight: bold;
}

tr:nth-child(even) {
    background-color: #f9f9f9;
}

ul, ol {
    margin-left: 20pt;
    margin-bottom: 10pt;
}

li {
    margin-bottom: 4pt;
}

a {
    color: #3498db;
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}

img {
    max-width: 100%;
    height: auto;
}

hr {
    border: none;
    border-top: 1px solid #ddd;
    margin: 20pt 0;
}

/* Diagrammes Mermaid pré-rendus en SVG */
.mermaid-diagram {
    margin: 14pt 0;
    padding: 10pt;
    border: 1px solid #e0e0e0;
    border-radius: 4pt;
    background: #fafafa;
    page-break-inside: avoid;
    overflow: visible;
}

.mermaid-diagram svg {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto;
}

/* PNG (recommandé pour WeasyPrint) */
.mermaid-diagram img {
    max-width: 100%;
    width: auto;
    height: auto;
    display: block;
    margin: 0 auto;
}

.mermaid-fallback {
    margin: 14pt 0;
    padding: 10pt;
    border: 1px dashed #f39c12;
    background: #fffbf5;
    font-size: 9pt;
}

.mermaid-fallback pre {
    margin-top: 8pt;
}
"""


_KROKI_HEADERS = {
    "Content-Type": "text/plain",
    "User-Agent": "markdown_to_pdf/1.0 (WeasyPrint; +https://github.com/)",
}


def _kroki_fetch_mermaid(code: str, output_format: str):
    """Retourne les octets (PNG ou SVG UTF-8) ou None."""
    try:
        body = code.strip().encode("utf-8")
        if not body:
            return None
        url = _kroki_mermaid_url(output_format)
        req = urllib.request.Request(
            url,
            data=body,
            headers=_KROKI_HEADERS,
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.read()
    except (urllib.error.URLError, OSError, ValueError):
        return None


def _mmdc_render_mermaid(code: str, output_format: str):
    """Secours : @mermaid-js/mermaid-cli. output_format: 'png' | 'svg'."""
    exe = shutil.which("mmdc")
    if not exe:
        return None
    ext = "png" if output_format == "png" else "svg"
    try:
        with tempfile.TemporaryDirectory() as tmp:
            inp = os.path.join(tmp, "diagram.mmd")
            outp = os.path.join(tmp, f"diagram.{ext}")
            with open(inp, "w", encoding="utf-8") as f:
                f.write(code.strip() + "\n")
            r = subprocess.run(
                [exe, "-i", inp, "-o", outp],
                capture_output=True,
                text=True,
                timeout=90,
                check=False,
            )
            if r.returncode != 0 or not os.path.isfile(outp):
                return None
            with open(outp, "rb") as f:
                return f.read()
    except (OSError, subprocess.TimeoutExpired):
        return None


def _mermaid_fallback_html(code: str) -> str:
    return (
        '<div class="mermaid-fallback">'
        "<p><em>Rendu Mermaid indisponible (réseau Kroki ou <code>mmdc</code> / mermaid-cli). "
        "Source :</em></p>"
        f"<pre><code>{html_module.escape(code.strip())}</code></pre>"
        "</div>\n"
    )


def _mermaid_code_to_html_fragment(code: str) -> str:
    """
    Insère un diagramme lisible par WeasyPrint : PNG en priorité (pas de foreignObject).
    """
    code = code.strip()
    if not code:
        return _mermaid_fallback_html("")

    # 1. Kroki PNG (meilleur rendu PDF)
    raw = _kroki_fetch_mermaid(code, "png")
    if raw and raw.startswith(b"\x89PNG\r\n\x1a\n"):
        b64 = base64.standard_b64encode(raw).decode("ascii")
        return (
            '<div class="mermaid-diagram">'
            f'<img src="data:image/png;base64,{b64}" alt="Diagramme Mermaid" />'
            "</div>\n"
        )

    # 2. Kroki SVG
    raw = _kroki_fetch_mermaid(code, "svg")
    if raw:
        try:
            svg = raw.decode("utf-8")
            if "<svg" in svg:
                return f'<div class="mermaid-diagram">\n{svg}\n</div>\n'
        except UnicodeDecodeError:
            pass

    # 3. mmdc PNG
    raw = _mmdc_render_mermaid(code, "png")
    if raw and raw.startswith(b"\x89PNG\r\n\x1a\n"):
        b64 = base64.standard_b64encode(raw).decode("ascii")
        return (
            '<div class="mermaid-diagram">'
            f'<img src="data:image/png;base64,{b64}" alt="Diagramme Mermaid" />'
            "</div>\n"
        )

    # 4. mmdc SVG
    raw = _mmdc_render_mermaid(code, "svg")
    if raw:
        try:
            svg = raw.decode("utf-8")
            if "<svg" in svg:
                return f'<div class="mermaid-diagram">\n{svg}\n</div>\n'
        except UnicodeDecodeError:
            pass

    return _mermaid_fallback_html(code)


def render_mermaid_in_markdown(contenu_md: str) -> str:
    """
    Remplace chaque bloc ```mermaid ... ``` par un div (img PNG ou SVG).
    Le HTML brut est conservé tel quel par markdown2 hors blocs de code.
    """

    def repl(match):
        return _mermaid_code_to_html_fragment(match.group(1))

    return MERMAID_BLOCK.sub(repl, contenu_md)


def markdown_vers_pdf(fichier_markdown, fichier_sortie=None, style_css=None):
    """
    Convertit un fichier Markdown en PDF
    
    Args:
        fichier_markdown: Chemin vers le fichier Markdown
        fichier_sortie: Chemin du fichier PDF (optionnel)
        style_css: CSS personnalisé (optionnel)
    
    Returns:
        str: Chemin du fichier PDF créé
    """
    # Lire le fichier Markdown
    with open(fichier_markdown, 'r', encoding='utf-8') as f:
        contenu_md = f.read()

    contenu_md = render_mermaid_in_markdown(contenu_md)

    # Convertir Markdown en HTML
    html_content = markdown2.markdown(
        contenu_md,
        extras=[
            'fenced-code-blocks',  # Blocs de code avec ```
            'tables',              # Support des tableaux
            'strike',              # Texte barré
            'task_list',           # Listes de tâches
            'header-ids',          # IDs pour les en-têtes
            'footnotes',           # Notes de bas de page
            'code-friendly'        # Meilleure gestion du code
        ]
    )
    
    # Obtenir le titre du document
    titre = Path(fichier_markdown).stem
    
    # Créer le HTML complet
    html_complet = HTML_TEMPLATE.format(
        title=titre,
        content=html_content
    )
    
    # Définir le nom du fichier de sortie
    if fichier_sortie is None:
        fichier_sortie = str(Path(fichier_markdown).with_suffix('.pdf'))
    
    # Utiliser le CSS personnalisé ou le CSS par défaut
    css = CSS(string=style_css if style_css else CSS_STYLE)
    
    # Générer le PDF
    HTML(string=html_complet).write_pdf(
        fichier_sortie,
        stylesheets=[css]
    )
    
    return fichier_sortie


def markdown_texte_vers_pdf(texte_markdown, fichier_sortie, titre="Document", style_css=None):
    """
    Convertit du texte Markdown directement en PDF (sans fichier intermédiaire)
    
    Args:
        texte_markdown: Texte Markdown (string)
        fichier_sortie: Chemin du fichier PDF
        titre: Titre du document
        style_css: CSS personnalisé (optionnel)
    """
    texte_markdown = render_mermaid_in_markdown(texte_markdown)

    # Convertir Markdown en HTML
    html_content = markdown2.markdown(
        texte_markdown,
        extras=[
            'fenced-code-blocks',
            'tables',
            'strike',
            'task_list',
            'header-ids',
            'footnotes',
            'code-friendly'
        ]
    )
    
    # Créer le HTML complet
    html_complet = HTML_TEMPLATE.format(
        title=titre,
        content=html_content
    )
    
    # Utiliser le CSS personnalisé ou le CSS par défaut
    css = CSS(string=style_css if style_css else CSS_STYLE)
    
    # Générer le PDF
    HTML(string=html_complet).write_pdf(
        fichier_sortie,
        stylesheets=[css]
    )
    
    return fichier_sortie


# Exemple d'utilisation
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python markdown_to_pdf.py fichier.md [sortie.pdf]")
        sys.exit(1)
    
    fichier_entree = sys.argv[1]
    fichier_sortie = sys.argv[2] if len(sys.argv) > 2 else None
    
    try:
        pdf_cree = markdown_vers_pdf(fichier_entree, fichier_sortie)
        print(f"✓ Conversion réussie!")
        print(f"  Fichier source: {fichier_entree}")
        print(f"  Fichier créé: {pdf_cree}")
    except Exception as e:
        print(f"✗ Erreur: {e}")
        sys.exit(1)