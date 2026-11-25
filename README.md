# CNC Box — Laser Cut & CNC Box Generator

**CNC Box** is a 100% client-side **HTML + CSS + Vanilla JavaScript** parametric box generator for laser cutters and CNC routers — zero external build steps, zero frameworks, interactive **WebGL 3D** preview, and true **1:1 scale SVG, AutoCAD R12 DXF, and ZIP** export.

## Box Types Included

1. **Basic Box (`basic-box.html`)** — Open or closed rectangular boxes with **Flat** and **Finger** edge joints, inside/outside dimensions, and customizable finger width.
2. **Box Lid (`lid-box.html`)** — Slip-over lids always dimensioned from the **inside** (inside width, inside length, lid height, material thickness) with Flat and Finger joints.
3. **Grid Divider Box (`divider-box.html`)** — Configurable `Rows × Columns` compartments with cross-lap interlocking dividers, custom unequal compartment resizing (`Resize Dividers`), inside/outside/cell dimension modes, and open or flat-lid options.
4. **Polygon Box (`polygon-box.html`)** — Regular 3 to 18-sided boxes (triangle, pentagon, hexagon, octagon, etc.) with dihedral-angle compensated finger joints (`2π/N`), configurable by inside diameter, outside diameter, or side length.
5. **Stackable Parts Bin (`stackable-bin.html`)** — Sloped-front parts & components organizer with trapezoidal top stacking lugs and bottom registration notches, recessed floor, tilted mortise-and-tenon front lip, optional dividers, and 3D stacked batch preview.
6. **Kerf Bent Box (`kerf-box.html`)** — Living-hinge rounded-corner box with `1`, `2`, or `4` bends, adjustable bend radius and stretch percentage, and **Open**, **Closed**, or **Custom Curved Lid (`With Lid`)** modes.

## Key Features

- **Interactive WebGL 3D Preview**: 360° orbit, zoom, pan, and animated **Exploded View** (works offline and on `file://`).
- **True 1:1 Laser & CNC Export**:
  - **SVG** (`mm` / `in`) ready for LightBurn, RDWorks, Inkscape, and Illustrator.
  - **AutoCAD R12 DXF** with separated `CUT_OUTER`, `CUT_INNER`, and `LABELS` layers ready for AutoCAD, Fusion 360, VCarve, and LibreCAD.
  - **Separate Files (.ZIP)** archive export (1 file per panel).
- **Kerf & CNC Dogbones**: Exact outward/inward kerf offset and automatic semicircular dogbone corner reliefs for round router bits.
- **8 Languages Built-In** (English default, persisted in `localStorage`): English, Português, Español, Italiano, Français, 日本語, 한국어, and 中文.

## Running Locally or on GitHub Pages

Open `index.html` directly in any modern browser, or serve statically:

```bash
python -m http.server 8123
```

Because it uses pure HTML, CSS, and JS with zero build step, you can publish it live immediately via **GitHub Pages** (`Settings → Pages → Deploy from branch: main / root`).
