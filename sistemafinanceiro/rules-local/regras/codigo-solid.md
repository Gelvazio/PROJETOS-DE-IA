# 🧱 Código — Princípios SOLID

Todo arquivo de programação criado ou modificado (JavaScript, Python, HTML, CSS…) aplica SOLID,
de forma **pragmática**: sem abstração desnecessária em script pequeno. Em código existente, seguir
o padrão do projeto e aplicar SOLID nas partes criadas ou alteradas.
Limites, nomes e legibilidade: `codigo-limites-nomes.md`.

## Os 5 princípios

| Letra | Princípio | Regra prática |
|-------|-----------|---------------|
| **S** | Single Responsibility | Cada função/classe/módulo/arquivo tem **uma** responsabilidade |
| **O** | Open/Closed | Estender sem modificar: mapas de estratégia, composição — não `if/else` crescente |
| **L** | Liskov Substitution | Implementações substituem a base sem quebrar o contrato |
| **I** | Interface Segregation | Módulos pequenos e específicos; ninguém depende do que não usa |
| **D** | Dependency Inversion | Depender de abstrações; **injetar** cliente de banco, API, storage |

## Por tecnologia

**JavaScript / Python**
- ✅ Separar regra de negócio, acesso a dados (repository/service) e UI/DOM
- ✅ Injetar dependências por construtor ou parâmetro (cliente de banco, `fetch`, repositório)
- ✅ Trocar cadeias de `if/switch` por tipo por mapas de estratégia ou polimorfismo
- ✅ Um arquivo por responsabilidade (`aula.servico.js`, `aula.repositorio.js`, `aula.tela.js`)
- ✅ Python: `abc.ABC`/`Protocol` quando houver mais de uma implementação
- ❌ Arquivo "faz-tudo" (validação + banco + DOM + formatação juntos)

**HTML**
- ✅ Estrutura semântica (`header`, `main`, `section`, `article`, `nav`, `footer`)
- ✅ Sem `style=""` e sem JavaScript inline (`onclick`)
- ✅ Blocos reutilizáveis e independentes

**CSS**
- ✅ Classes de responsabilidade única (layout ≠ tema ≠ componente ≠ utilitário)
- ✅ Estender por modificador (BEM: `.cartao--destaque`) em vez de editar a classe base
- ✅ Tokens em `:root { --cor-primaria }`; componentes usam tokens, não valores fixos
- ❌ Seletores acoplados à estrutura (`div > ul > li > a`) e `!important` desnecessário

## Checklist SOLID

```
☐ Cada função/classe/arquivo tem uma única responsabilidade?
☐ Dá para adicionar um caso novo sem alterar código existente?
☐ Implementações podem ser trocadas sem quebrar quem as usa?
☐ Módulos enxutos?
☐ Dependências externas injetadas, não instanciadas no meio da lógica?
☐ HTML, CSS e JS separados?
```
