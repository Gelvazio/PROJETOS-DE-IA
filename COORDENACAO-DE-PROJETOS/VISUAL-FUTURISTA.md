# Prompt: visual futurista (cyberpunk) para dashboards

Prompt de design reutilizável, usado no painel de coleta do projeto `web-scrapping`
(`C:\fontes\web-scrapping\dashboard`). Serve para qualquer projeto que precise de uma interface
com estética futurista.

## Prompt original (inglês)

```text
A futuristic and sleek UI/UX web design dashboard for a high-tech data extraction and web scraping website. Cyberpunk aesthetic. The screen features complex data streams, digital node networks, glowing charts, connectivity maps, and progress telemetry bars. Dominant dark mode background with vibrant electric cyan, magenta, and deep violet neon glowing accent lights. Clean holographic layout, professional tech interfaces, digital typography, glowing data mining elements, 8k resolution, photorealistic, cinematic lighting, octane render, trending on ArtStation
```

## Como aplicar em código (HTML/CSS)

Os termos de imagem (8k, octane, photorealistic) não geram interface. Traduza assim:

| Ideia do prompt | Aplicação em CSS/HTML |
|---|---|
| Fundo escuro dominante | `--cor-fundo: #05030d` e gradientes radiais violeta/magenta no `body` |
| Neon ciano, magenta e violeta | Variáveis em `:root` e `box-shadow` com `rgba` brilhante |
| Layout holográfico | Cartões com `background` semitransparente, `backdrop-filter: blur` e borda neon |
| Redes de nós | SVG com `line` tracejada e `circle` pulsando (animação `stroke-dashoffset`) |
| Telemetria | Barra de varredura animada (`@keyframes`) enquanto um processo roda |
| Gráficos e medidores | Elemento `<progress>` estilizado com `::-webkit-progress-value` e `::-moz-progress-bar` |
| Tipografia digital | Fontes Google: Orbitron (títulos) e Share Tech Mono (dados e logs) |
| Efeito de grade | Pseudo-elemento fixo com `linear-gradient` em linhas finas |

## Regras de acessibilidade a manter

- Animações desligadas com `@media (prefers-reduced-motion: reduce)`.
- Contraste mínimo de texto: use `--cor-texto` claro sobre o fundo escuro, e o neon só em destaques.
- Foco visível em botões: `outline` magenta com `:focus-visible`.
- Layout de uma coluna em telas até 720 px, sem rolagem horizontal da página.

## Referência

Implementação de origem: `C:\fontes\web-scrapping\dashboard\coletor\static\coletor\painel.css`.
