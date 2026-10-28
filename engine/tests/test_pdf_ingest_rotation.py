"""Text-layer word boxes are published in the frame of ``page.rect`` (the page turned by /Rotate)."""
import fitz
import numpy as np
import pytest

from system_a.perception.pdf_ingest import page_text_and_words, words_from_text_layer


def _pdf(rotation: int) -> bytes:
    doc = fitz.open()
    page = doc.new_page(width=842, height=1191)
    page.insert_text((100, 200), "HELLO", fontsize=20)
    page.set_rotation(rotation)
    return doc.tobytes()


def _ink_norm(data: bytes):
    """Normalised bbox of the dark pixels on the page as rendered (the ground truth a viewer shows)."""
    with fitz.open(stream=data, filetype="pdf") as pdf:
        pix = pdf[0].get_pixmap(dpi=72)
    a = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)[..., 0]
    ys, xs = np.where(a < 128)
    return xs.min() / pix.w, ys.min() / pix.h, xs.max() / pix.w, ys.max() / pix.h


@pytest.mark.parametrize("rotation", [0, 90, 180, 270])
@pytest.mark.parametrize("reader", ["page_text_and_words", "words_from_text_layer"])
def test_word_box_covers_the_rendered_ink(rotation, reader):
    data = _pdf(rotation)
    words = page_text_and_words(data)[0]["words"] if reader == "page_text_and_words" else words_from_text_layer(data, "D")
    x, y, w, h = words[0]["bbox"]
    ix0, iy0, ix1, iy1 = _ink_norm(data)
    tol = 0.01
    assert x - tol <= ix0 and y - tol <= iy0, (rotation, words[0]["bbox"], (ix0, iy0, ix1, iy1))
    assert x + w + tol >= ix1 and y + h + tol >= iy1, (rotation, words[0]["bbox"], (ix0, iy0, ix1, iy1))
