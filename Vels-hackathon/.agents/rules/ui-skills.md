---
trigger: always_on
description: UI Skills MCP - Automatic design engineering and UI guidance for modern interfaces.
---

# UI Skills (ui-skills MCP)

Whenever designing, styling, building, or refining any user interface or frontend components:
1. **Always consult UI Skills first**:
   - Check available skills using `list_skills(category="<topic>")` or `get_skill(slug="<slug>")` (e.g. `glassmorphism`, `micro-interaction`, `60fps-animation`, `accessible-animation`, `fluid-functionalism`, `transitions-polish`).
   - Alternatively run `npx -y ui-skills get <slug>` to retrieve complete specification and CSS/JS code recipes.
2. **Design-Engineering Standards**:
   - Apply curated design tokens for spacing, typography, and color systems.
   - Implement layered lighting and material physics (frost, rim highlights, specular glow, and ambient depth).
   - Ensure 60/120fps compositor-friendly animations using `transform` and `opacity` with `prefers-reduced-motion` fallbacks.
