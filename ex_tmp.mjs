import { readFileSync } from 'node:fs';
import { lerLinhasQuadro } from 'file:///C:/fontes/rules-ai/scripts/gerenciador/quadro.mjs';
import { lerQuadro as mcp } from 'file:///C:/fontes/rules-ai/mcp/quadro.mjs';
import { lerQuadro as jev } from 'file:///C:/fontes/rules-ai/scripts/jev/estado.mjs';
for (const f of ['C:/fontes/aulasenai/tasks/STATUS.md','C:/fontes/rules-ai/tasks/STATUS.md','C:/fontes/REA-APP-CLONES/tasks/STATUS.md']) {
 const t = readFileSync(f,'utf8');
 const g = lerLinhasQuadro(t); const m = mcp(t); const j = jev(f);
 console.log(f, g.formato, g.linhas.length, m.registros.length, j.length);
 console.log(g.linhas[1], Object.keys(m.registros[1]).length, m.registros[1].codigo, m.registros[1].nivel, j[1]);
}
