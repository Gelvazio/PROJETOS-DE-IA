# 🔘 CSS — Todo checkbox é uma chave ON/OFF

Decidido em 2026-11-02 (pedido do usuário). Vale para **todas as IAs e todos os projetos**, em
qualquer tecnologia (HTML, React, Vue, Svelte, etc.). A regra do projeto só pode **acrescentar**
(cores, tamanho), não contradizer.

## A regra

- ✅ **Sempre que a IA criar ou alterar um campo checkbox** (`<input type="checkbox">`, ou
  componente que gera um), ele **deve ser uma chave ON/OFF**, como no modelo abaixo.
- ⛔ **Proibido** o checkbox quadrado do navegador, o quadrado com "V" desenhado e a biblioteca de
  checkbox que mantenha o visual quadrado.
- ✅ O estado aparece **no texto** dentro da chave (**OFF** desligado, **ON** ligado) e **na cor**
  (verde = ligado), com o botão deslizante.
- ✅ Vale para qualquer lugar: formulário, lista de opções, filtro, tabela e cartão.
- ✅ O rótulo (`<label>`) continua ao lado da chave e descreve o que liga ou desliga.
- ✅ A chave desabilitada fica com `opacity` menor e cursor `not-allowed`.
- ✅ Respeitar `prefers-reduced-motion` (sem animação para quem pediu).
- ✅ Acessibilidade: continuar sendo `input[type="checkbox"]` (leitor de tela, teclado com
  Espaço, `:focus-visible` visível). Não trocar por `div` ou `button` falso.

## Como aplicar

1. **Uma regra global no CSS base do projeto**, no seletor `input[type="checkbox"]` (nunca uma
   classe por tela). Se o projeto já tem o CSS base, a IA **acrescenta o modelo lá**; se não tem,
   cria um arquivo de CSS base e o liga em todas as páginas.
2. **Reaproveitar**: antes de criar, procurar no projeto a regra existente e **usá-la**. ⛔ Não
   duplicar o estilo por classe (`.chave`, `.filtros__checkbox`…); classe própria só para **margem**
   ou **tamanho** de um contexto específico.
3. **Checkbox já existente** que a IA encontrar fora do modelo, na tela que ela está alterando:
   trocar para o modelo (apagar o estilo quadrado antigo).
4. Cores: usar os tokens do projeto (`--cor-borda`, `--cor-texto-suave`, `--cor-ciano`) e, onde não
   existirem, os valores do modelo.

## Modelo (CSS)

```css
input[type="checkbox"] {
  appearance: none;
  position: relative;
  flex: none;
  box-sizing: border-box;
  width: 3rem;
  height: 1.5rem;
  margin: 0;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--cor-borda, #4a5568);
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
}

input[type="checkbox"]::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0.2rem;
  width: 1.05rem;
  height: 1.05rem;
  background: var(--cor-texto-suave, #9aa3b5);
  border-radius: 50%;
  transform: translateY(-50%);
  transition: left 0.2s, background 0.2s;
}

input[type="checkbox"]::after {
  content: "OFF";
  position: absolute;
  top: 50%;
  right: 0.4rem;
  transform: translateY(-50%);
  color: var(--cor-texto-suave, #9aa3b5);
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1;
}

input[type="checkbox"]:checked {
  background: rgba(129, 230, 160, 0.35);
  border-color: #81e6a0;
  box-shadow: 0 0 6px rgba(129, 230, 160, 0.55);
}

input[type="checkbox"]:checked::before {
  left: calc(100% - 1.25rem);
  background: #81e6a0;
}

input[type="checkbox"]:checked::after {
  content: "ON";
  right: auto;
  left: 0.45rem;
  color: #d9fbe4;
}

input[type="checkbox"]:focus-visible {
  outline: 2px solid var(--cor-ciano, #4fc3f7);
  outline-offset: 2px;
}

input[type="checkbox"]:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (prefers-reduced-motion: reduce) {
  input[type="checkbox"],
  input[type="checkbox"]::before {
    transition: none;
  }
}
```

Implementação de referência: `dashboard/assets/css/base.css` do `rules-ai`.

## Marcação

```html
<label class="chave">
  <input type="checkbox" id="mostrar-concluidas">
  <span>Mostrar concluídas</span>
</label>
```

- Texto do rótulo **ao lado** da chave, sem `<br>` nem quadrado desenhado por fora.
- Em framework, o componente deve renderizar um `input[type="checkbox"]` por baixo (o CSS acima
  vale para ele).

## Checklist antes de entregar

```
☐ Todo checkbox criado ou alterado usa a chave ON/OFF (não o quadrado)?
☐ O estilo está no seletor global input[type="checkbox"], sem copiar por classe?
☐ Existe o texto OFF/ON e a cor verde quando ligado?
☐ Continua sendo um input[type="checkbox"] com foco visível e rótulo?
☐ Respeita prefers-reduced-motion e tem estado desabilitado?
```
