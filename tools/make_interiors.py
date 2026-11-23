"""Draws the classroom and office interiors in the same look as apt.png:
dark-brown outline, cream striped wallpaper, parquet floor, chunky 3px pixels.
Draws at 160x150 'logical' pixels, then scales x3 (nearest) -> 480x450."""
from PIL import Image
import sys

W, H, S = 160, 150, 3

OUT = "#4a2008"
WOOD_D = "#723b12"
WOOD = "#8a552b"
WOOD_L = "#a8703a"
WOOD_LL = "#c98f52"
WALL = "#f3e8cc"
WALL_S = "#e6d8b0"
GREEN = "#1f6b45"
GREEN_L = "#2f8a5b"
GREEN_D = "#154a30"
CREAM = "#fff8e9"
RED = "#843731"
RED_L = "#a84a43"
GOLD = "#d9a93c"
GOLD_D = "#b98a28"
GREY = "#cfc6b0"
GREY_D = "#9a9078"
SCREEN = "#8fd0d8"
SCREEN_D = "#5aa6b0"
BLUE = "#4d8fcb"
BLUE_D = "#2f6e96"
BLACK = "#2b1a10"


def new():
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))


def hexc(c):
    c = c.lstrip("#")
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


def R(im, x0, y0, x1, y1, c):
    px = im.load()
    for y in range(max(0, y0), min(H, y1 + 1)):
        for x in range(max(0, x0), min(W, x1 + 1)):
            px[x, y] = hexc(c)


def P(im, x, y, c):
    if 0 <= x < W and 0 <= y < H:
        im.putpixel((x, y), hexc(c))


def box(im, x0, y0, x1, y1, fill, hi=None, lo=None, outline=OUT):
    R(im, x0, y0, x1, y1, outline)
    R(im, x0 + 1, y0 + 1, x1 - 1, y1 - 1, fill)
    if hi:
        R(im, x0 + 1, y0 + 1, x1 - 1, y0 + 1, hi)
    if lo:
        R(im, x0 + 1, y1 - 1, x1 - 1, y1 - 1, lo)


# ---------- tiny 3x5 pixel font for chalkboard / signs ----------
FONT = {
    "A": ["010", "101", "111", "101", "101"],
    "B": ["110", "101", "110", "101", "110"],
    "C": ["011", "100", "100", "100", "011"],
    "1": ["010", "110", "010", "010", "111"],
    "2": ["110", "001", "010", "100", "111"],
    "3": ["110", "001", "010", "001", "110"],
    "E": ["111", "100", "110", "100", "111"],
    "W": ["101", "101", "101", "111", "101"],
    "S": ["011", "100", "010", "001", "110"],
    "T": ["111", "010", "010", "010", "010"],
}


def text(im, x, y, s, c):
    for ch in s:
        for r, row in enumerate(FONT[ch]):
            for k, v in enumerate(row):
                if v == "1":
                    P(im, x + k, y + r, c)
        x += 4


def shell(im, wall, wall_stripe, floor_tones, back_h=50):
    """room cutaway: outline, striped wallpaper, parquet, side walls, doorway gap"""
    R(im, 3, 3, 156, 146, OUT)
    # wallpaper
    R(im, 5, 5, 154, 4 + back_h, wall)
    for x in range(6, 154, 4):
        R(im, x, 5, x, 4 + back_h, wall_stripe)
    # baseboard
    R(im, 5, 5 + back_h - 3, 154, 5 + back_h - 1, WOOD_D)
    R(im, 5, 5 + back_h, 154, 5 + back_h, OUT)
    # parquet floor
    fy0 = 6 + back_h
    for y in range(fy0, 145):
        row = (y - fy0) // 6
        for x in range(5, 155):
            tone = floor_tones[((x + row * 7) // 20 + row) % len(floor_tones)]
            P(im, x, y, tone)
        if (y - fy0) % 6 == 0:
            R(im, 5, y, 154, y, "#7a4a22")
        else:
            for x in range(5, 155):
                if (x + row * 7) % 20 == 0:
                    P(im, x, y, "#7a4a22")
    # side walls (thick, like the apartment)
    R(im, 3, 3, 8, 146, OUT)
    R(im, 4, 4, 7, 145, WOOD_D)
    R(im, 4, 4, 4, 145, WOOD)
    R(im, 151, 3, 156, 146, OUT)
    R(im, 152, 4, 155, 145, WOOD_D)
    R(im, 155, 4, 155, 145, WOOD)
    # front wall with a doorway gap in the middle
    R(im, 3, 143, 156, 146, OUT)
    R(im, 4, 143, 155, 145, WOOD_D)
    # doorway gap: the floor runs out through the front wall
    for x in range(62, 99):
        for y in range(143, 147):
            if y >= 146:
                im.putpixel((x, y), (0, 0, 0, 0))
            else:
                P(im, x, y, floor_tones[0] if (x // 5) % 2 else floor_tones[1])
    # welcome mat in the doorway
    R(im, 68, 138, 92, 143, OUT)
    R(im, 69, 139, 91, 142, RED)
    R(im, 69, 139, 91, 139, RED_L)


def door(im, x, y):
    box(im, x, y, x + 17, y + 36, WOOD_D, hi=WOOD)
    R(im, x + 3, y + 4, x + 14, y + 16, WOOD)
    R(im, x + 3, y + 4, x + 14, y + 4, WOOD_L)
    R(im, x + 3, y + 20, x + 14, y + 32, WOOD)
    R(im, x + 3, y + 20, x + 14, y + 20, WOOD_L)
    R(im, x + 13, y + 19, x + 14, y + 20, GOLD)


def clock(im, cx, cy):
    box(im, cx - 6, cy - 6, cx + 6, cy + 6, CREAM, outline=OUT)
    R(im, cx - 5, cy - 5, cx + 5, cy + 5, CREAM)
    R(im, cx, cy - 4, cx, cy, OUT)
    R(im, cx, cy, cx + 3, cy, OUT)
    P(im, cx - 5, cy - 6, OUT)


def plant(im, x, y, big=False):
    # pot
    box(im, x, y + 8, x + 9, y + 15, CREAM, hi=CREAM, lo=GREY)
    R(im, x + 1, y + 8, x + 8, y + 8, GREY)
    # leaves
    for (lx, ly, w, h) in [(x - 3, y, 7, 6), (x + 5, y - 2, 8, 6), (x + 1, y - 7, 8, 7), (x - 1, y + 3, 6, 5), (x + 6, y + 3, 7, 5)]:
        R(im, lx, ly, lx + w, ly + h, OUT)
        R(im, lx + 1, ly + 1, lx + w - 1, ly + h - 1, GREEN_L)
        R(im, lx + 1, ly + h - 2, lx + w - 1, ly + h - 1, GREEN)
    P(im, x + 4, y + 7, OUT)


def desk(im, x, y, w=18):
    # top
    box(im, x, y, x + w - 1, y + 7, WOOD_LL, hi="#dba56a", lo=WOOD_L)
    # apron + legs
    R(im, x + 1, y + 8, x + w - 2, y + 9, OUT)
    R(im, x + 2, y + 8, x + w - 3, y + 8, WOOD_D)
    R(im, x + 1, y + 9, x + 2, y + 13, OUT)
    R(im, x + w - 3, y + 9, x + w - 2, y + 13, OUT)
    # chair (green, seen from behind)
    cx = x + w // 2 - 5
    box(im, cx, y + 11, cx + 9, y + 16, GREEN_L, hi="#4aa876", lo=GREEN)
    R(im, cx + 1, y + 17, cx + 2, y + 19, OUT)
    R(im, cx + 7, y + 17, cx + 8, y + 19, OUT)


def monitor(im, x, y, on=True, w=14, h=10):
    box(im, x, y, x + w - 1, y + h - 1, GREY, hi=CREAM, lo=GREY_D)
    R(im, x + 2, y + 2, x + w - 3, y + h - 4, SCREEN if on else SCREEN_D)
    R(im, x + 2, y + 2, x + w - 3, y + 2, "#bfe8ee")
    R(im, x + w // 2 - 2, y + h, x + w // 2 + 1, y + h + 1, OUT)
    R(im, x + w // 2 - 4, y + h + 2, x + w // 2 + 3, y + h + 2, OUT)
    R(im, x + w // 2 - 3, y + h, x + w // 2 + 2, y + h, GREY_D)


def laptop(im, x, y):
    box(im, x, y, x + 11, y + 7, GREY, hi=CREAM)
    R(im, x + 2, y + 2, x + 9, y + 5, SCREEN)
    R(im, x - 1, y + 8, x + 12, y + 9, OUT)
    R(im, x, y + 8, x + 11, y + 8, GREY_D)


def books(im, x, y):
    cols = [RED, GREEN, BLUE, GOLD, RED_L]
    for i, c in enumerate(cols):
        R(im, x + i * 3, y, x + i * 3 + 2, y + 7, OUT)
        R(im, x + i * 3 + 1, y + 1, x + i * 3 + 1, y + 7, c)


def shelf(im, x, y, w=22, rows=3):
    h = rows * 12 + 3
    box(im, x, y, x + w - 1, y + h - 1, WOOD_D, hi=WOOD)
    for r in range(rows):
        ry = y + 2 + r * 12
        R(im, x + 2, ry, x + w - 3, ry + 9, "#4a2008")
        books(im, x + 3, ry + 2) if r != 1 else None
        R(im, x + 2, ry + 10, x + w - 3, ry + 11, WOOD_L)
        if r == 1:
            # a little globe-ish ball + banana
            R(im, x + 4, ry + 3, x + 9, ry + 8, BLUE)
            R(im, x + 5, ry + 4, x + 7, ry + 6, GREEN_L)
            R(im, x + 12, ry + 6, x + 17, ry + 8, GOLD)


def rug(im, x0, y0, x1, y1, base=GOLD, dark=GOLD_D, border=RED):
    R(im, x0, y0, x1, y1, OUT)
    R(im, x0 + 1, y0 + 1, x1 - 1, y1 - 1, border)
    R(im, x0 + 3, y0 + 3, x1 - 3, y1 - 3, base)
    for y in range(y0 + 4, y1 - 3):
        for x in range(x0 + 4, x1 - 3):
            if (x + y) % 6 == 0:
                P(im, x, y, dark)


# =============================== CLASSROOM ===============================
def classroom():
    im = new()
    shell(im, WALL, WALL_S, [WOOD, "#84502a", "#8f5a2f"])
    door(im, 11, 14)
    # chalkboard
    box(im, 41, 11, 112, 38, WOOD_D, hi=WOOD)
    R(im, 44, 14, 109, 33, "#2e6b50")
    R(im, 44, 14, 109, 14, "#3d8566")
    text(im, 49, 17, "ABC", CREAM)
    text(im, 49, 25, "123", CREAM)
    # chalk drawing: a happy banana and a tree
    R(im, 80, 26, 92, 28, GOLD)
    R(im, 81, 25, 88, 25, GOLD)
    R(im, 90, 24, 91, 25, GOLD)
    R(im, 98, 20, 100, 30, "#a8703a")
    R(im, 95, 16, 103, 21, "#8fe0a8")
    # chalk tray
    R(im, 41, 38, 112, 40, WOOD_D)
    R(im, 41, 38, 112, 38, WOOD)
    R(im, 46, 36, 49, 37, CREAM)
    R(im, 53, 36, 55, 37, CREAM)
    # clock + posters
    clock(im, 126, 20)
    box(im, 137, 12, 147, 24, CREAM)
    R(im, 139, 15, 145, 17, GREEN_L)
    R(im, 139, 19, 143, 20, RED)
    box(im, 120, 30, 130, 41, "#fbeaa0")
    R(im, 122, 33, 128, 34, BLUE)
    R(im, 122, 37, 126, 38, RED)
    # shelf + plant on the right wall
    shelf(im, 134, 54, 15, 3)
    plant(im, 36, 52)

    # reading rug in the aisle
    rug(im, 66, 66, 94, 132)
    # teacher desk (front of board)
    box(im, 56, 52, 103, 62, WOOD_LL, hi="#dba56a", lo=WOOD_L)
    R(im, 58, 63, 101, 65, OUT)
    R(im, 59, 63, 100, 63, WOOD_D)
    R(im, 58, 63, 59, 68, OUT)
    R(im, 100, 63, 101, 68, OUT)
    monitor(im, 82, 43, on=True)
    R(im, 62, 49, 74, 53, OUT)
    R(im, 63, 50, 73, 52, CREAM)
    R(im, 64, 47, 70, 49, "#fbeaa0")
    books(im, 94, 45)
    # apple
    R(im, 77, 51, 79, 53, RED_L)
    P(im, 78, 50, GREEN)

    # student desks: two columns left, two right, three rows
    for ry in (74, 100):
        for cx in (24, 46, 98, 120):
            desk(im, cx - 9, ry)

    # recycling bin in the front-left corner (e-waste themed)
    box(im, 15, 112, 28, 128, BLUE, hi="#7fb4e0", lo=BLUE_D)
    R(im, 13, 109, 30, 112, OUT)
    R(im, 14, 110, 29, 111, BLUE_D)
    R(im, 19, 117, 25, 118, CREAM)
    R(im, 20, 119, 24, 120, CREAM)
    R(im, 21, 121, 23, 122, CREAM)
    return im


# ================================ OFFICE ================================
def office():
    im = new()
    shell(im, "#e3e8d2", "#d2d9bd", ["#7f6a52", "#7a644c", "#857058"])
    # carpet override: calm blue-grey floor like a real office, same plank rhythm
    fy0 = 56
    for y in range(fy0, 143):
        for x in range(9, 151):
            row = (y - fy0) // 6
            tone = "#6f7f91" if (x * 3 + y * 5) % 7 else "#667689"
            P(im, x, y, tone)
    # re-draw doorway mat on top of carpet
    R(im, 68, 138, 92, 143, OUT)
    R(im, 69, 139, 91, 142, RED)
    R(im, 69, 139, 91, 139, RED_L)

    door(im, 11, 14)
    # big window with a view of the jungle
    box(im, 44, 11, 96, 40, WOOD_D, hi=WOOD)
    R(im, 47, 14, 93, 37, "#9fd7e8")
    R(im, 47, 14, 93, 18, "#b8e4f0")
    R(im, 47, 28, 93, 37, "#6fb04f")
    R(im, 47, 28, 93, 29, "#4f8f3f")
    R(im, 56, 22, 66, 32, "#3e7b34")
    R(im, 74, 20, 86, 32, "#3e7b34")
    R(im, 69, 14, 70, 37, WOOD_D)
    R(im, 47, 25, 93, 26, WOOD_D)
    R(im, 44, 40, 96, 42, WOOD)
    # wall clock + corkboard
    clock(im, 108, 20)
    box(im, 118, 12, 148, 34, WOOD_L, hi=WOOD_LL)
    R(im, 120, 14, 146, 32, "#c8a06a")
    R(im, 123, 17, 131, 24, CREAM)
    R(im, 134, 16, 142, 22, "#fbeaa0")
    R(im, 126, 27, 138, 30, RED_L)
    P(im, 127, 16, RED)
    P(im, 138, 15, BLUE)
    # filing cabinet + plant on the left
    box(im, 11, 54, 28, 84, GREY, hi=CREAM, lo=GREY_D)
    for ry in (57, 67, 77):
        R(im, 13, ry, 26, ry + 7, GREY_D)
        R(im, 14, ry + 1, 25, ry + 6, GREY)
        R(im, 18, ry + 3, 21, ry + 4, OUT)
    # printer on small table at right
    box(im, 132, 66, 149, 74, WOOD_LL, hi="#dba56a", lo=WOOD_L)
    R(im, 134, 75, 135, 86, OUT)
    R(im, 146, 75, 147, 86, OUT)
    box(im, 135, 56, 148, 66, GREY, hi=CREAM, lo=GREY_D)
    R(im, 137, 59, 146, 60, OUT)
    R(im, 138, 62, 145, 62, CREAM)

    # rug in the middle (blue-ish to keep the office calm)
    rug(im, 52, 92, 108, 130, base="#a9c1d8", dark="#8fa9c3", border="#34506b")

    # two work desks with computers, chairs seen from behind
    for dx in (50, 112):
        box(im, dx - 20, 62, dx + 19, 73, WOOD_LL, hi="#dba56a", lo=WOOD_L)
        R(im, dx - 19, 74, dx + 18, 76, OUT)
        R(im, dx - 19, 74, dx + 18, 74, WOOD_D)
        R(im, dx - 19, 74, dx - 17, 82, OUT)
        R(im, dx + 16, 74, dx + 18, 82, OUT)
        monitor(im, dx - 14, 52, on=True)
        laptop(im, dx + 2, 64)
        R(im, dx - 14, 67, dx - 4, 69, OUT)
        R(im, dx - 13, 68, dx - 5, 68, CREAM)
        # chair
        box(im, dx - 5, 80, dx + 5, 88, GREEN_L, hi="#4aa876", lo=GREEN)
        R(im, dx - 4, 89, dx - 3, 92, OUT)
        R(im, dx + 3, 89, dx + 4, 92, OUT)
    # plant by the door
    plant(im, 134, 118)
    # blue recycling bin with the three-arrows sign (e-waste, like the classroom one)
    box(im, 15, 112, 28, 128, BLUE, hi="#7fb4e0", lo=BLUE_D)
    R(im, 13, 109, 30, 112, OUT)
    R(im, 14, 110, 29, 111, BLUE_D)
    R(im, 19, 117, 25, 118, CREAM)
    R(im, 20, 119, 24, 120, CREAM)
    R(im, 21, 121, 23, 122, CREAM)
    return im


def save(im, path):
    im.resize((W * S, H * S), Image.NEAREST).save(path)


if __name__ == "__main__":
    out = sys.argv[1]
    save(classroom(), f"{out}/class.png")
    save(office(), f"{out}/work.png")
    print("ok")
