from pathlib import Path
import fitz
import shutil

SOURCE = Path("/workspace/scratch/38b2a16b0046/upload/49381320-f03c-4e5e-8c4c-09d3a3f727dd(1).pdf")
PUBLIC = Path("/workspace/sites/aerolex-analisador/public")
ORIGINAL = PUBLIC / "documento-original.pdf"
ANNOTATED = PUBLIC / "documento-analisado-marcado.pdf"

PUBLIC.mkdir(parents=True, exist_ok=True)
shutil.copy2(SOURCE, ORIGINAL)

doc = fitz.open(SOURCE)

MARKS = [
    ("citacao", "Ocorre que o voo foi cancelado pela companhia aérea", "Citação: fato gerador do pedido."),
    ("citacao", "O transporte somente foi concluído em", "Citação: delimitação do atraso de aproximadamente 24h30."),
    ("citacao", "O Autor perdeu reunião profissional previamente agendada", "Citação: consequências concretas do cancelamento."),
    ("prova", "conforme comprovantes anexos", "Prova mencionada: bilhete e comprovantes do itinerário. Não constam neste PDF."),
    ("prova", "o Autor suportou despesas no valor de R$ 1.284,60", "Prova mencionada: recibos das despesas materiais. Não constam neste PDF."),
    ("prova", "protocolo nº", "Prova mencionada: reclamação administrativa PROTOCOLO-SUPRIMIDO."),
    ("tese", "A responsabilidade é objetiva", "Tese: responsabilidade objetiva por falha na prestação do serviço."),
    ("tese", "Tais eventos, quando relacionados à própria organização da atividade", "Tese: fortuito interno não exclui a responsabilidade."),
    ("tese", "Os danos materiais correspondem às despesas", "Tese: ressarcimento integral dos danos materiais."),
    ("tese", "No presente caso, a duração de aproximadamente 24 horas", "Tese: dano moral individualizado pelas circunstâncias concretas."),
]

COLORS = {
    "tese": (0.35, 0.68, 1.0),
    "prova": (0.35, 0.82, 0.58),
    "citacao": (1.0, 0.82, 0.28),
}

counts = {"tese": 0, "prova": 0, "citacao": 0}
for kind, needle, note in MARKS:
    for page in doc:
        rects = page.search_for(needle)
        if not rects:
            continue
        annot = page.add_highlight_annot(rects)
        annot.set_colors(stroke=COLORS[kind])
        annot.set_info(title=f"AeroLex · {kind.capitalize()}", content=note)
        annot.set_opacity(0.48)
        annot.update()
        counts[kind] += 1
        break

metadata = doc.metadata
metadata["title"] = "Documento analisado e marcado pelo AeroLex"
metadata["subject"] = "Destaques: azul para teses, verde para provas e amarelo para citações"
doc.set_metadata(metadata)
if ANNOTATED.exists():
    ANNOTATED.unlink()
doc.save(ANNOTATED, garbage=4, deflate=True)
doc.close()

if counts != {"tese": 4, "prova": 3, "citacao": 3}:
    raise RuntimeError(f"Marcações incompletas: {counts}")

print(counts)
