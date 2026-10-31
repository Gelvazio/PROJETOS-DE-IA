/**
 * Dados embutidos para funcionar por file:// (sem servidor).
 * Para trocar os dados, substitua o conteúdo dos CSVs abaixo (veja o README.md).
 */
const DATA_REFERENCIA = '2026-10-31';

const CSV_ESTOQUE = `produto,categoria,quantidade_atual,quantidade_minima,ultima_venda,custo_unitario
Café Torrado 500g,Mercearia,48,30,2026-10-28,18.90
Açúcar Refinado 1kg,Mercearia,120,60,2026-10-29,4.20
Arroz Tipo 1 5kg,Mercearia,35,40,2026-10-30,22.50
Feijão Carioca 1kg,Mercearia,18,50,2026-10-29,7.80
Óleo de Soja 900ml,Mercearia,75,40,2026-10-26,6.90
Macarrão Espaguete 500g,Mercearia,90,45,2026-10-27,3.60
Farinha de Trigo 1kg,Mercearia,55,35,2026-10-25,4.90
Molho de Tomate 340g,Mercearia,140,70,2026-10-28,2.40
Azeite Extra Virgem 500ml,Mercearia,22,15,2026-10-19,34.90
Sal Refinado 1kg,Mercearia,64,30,2026-10-22,2.10
Leite Integral 1L,Laticínios,200,120,2026-10-30,4.60
Queijo Mussarela kg,Laticínios,14,20,2026-10-29,39.90
Iogurte Natural 170g,Laticínios,80,60,2026-10-29,2.90
Manteiga 200g,Laticínios,26,25,2026-10-24,11.50
Requeijão Cremoso 220g,Laticínios,9,24,2026-10-28,8.30
Creme de Leite 200g,Laticínios,70,40,2026-10-26,3.20
Leite Condensado 395g,Laticínios,48,30,2026-10-17,6.40
Queijo Parmesão 100g,Laticínios,30,12,2026-07-28,14.80
Refrigerante Cola 2L,Bebidas,150,80,2026-10-30,6.90
Suco de Uva Integral 1L,Bebidas,42,30,2026-10-25,11.20
Água Mineral 1,5L,Bebidas,260,150,2026-10-30,1.90
Cerveja Lata 350ml,Bebidas,310,200,2026-10-29,3.40
Energético 250ml,Bebidas,12,40,2026-10-27,7.50
Vinho Tinto 750ml,Bebidas,28,15,2026-10-13,42.00
Chá Mate Gelado 1,5L,Bebidas,55,30,2026-10-23,5.80
Whisky 12 anos 1L,Bebidas,6,4,2026-08-14,119.00
Licor de Amarula 750ml,Bebidas,8,3,2026-07-11,58.00
Detergente Líquido 500ml,Limpeza,110,60,2026-10-28,2.30
Sabão em Pó 1,6kg,Limpeza,40,30,2026-10-26,17.90
Amaciante 2L,Limpeza,33,25,2026-10-22,12.60
Desinfetante 1L,Limpeza,16,35,2026-10-27,5.90
Água Sanitária 2L,Limpeza,60,35,2026-10-25,4.50
Esponja Multiuso (pct),Limpeza,85,50,2026-10-29,3.80
Saco de Lixo 100L (pct),Limpeza,44,25,2026-10-21,13.90
Limpa Vidros 500ml,Limpeza,20,10,2026-06-19,8.70
Cera Líquida 750ml,Limpeza,11,8,2026-08-04,15.40
Shampoo 350ml,Higiene,52,30,2026-10-27,13.90
Condicionador 350ml,Higiene,47,30,2026-10-25,14.50
Sabonete (un),Higiene,210,120,2026-10-30,1.70
Creme Dental 90g,Higiene,95,60,2026-10-28,4.40
Papel Higiênico 12 rolos,Higiene,38,40,2026-10-29,19.90
Desodorante Aerosol,Higiene,29,20,2026-10-20,12.90
Fio Dental 50m,Higiene,15,20,2026-10-26,6.20
Escova Dental,Higiene,60,30,2026-10-24,5.30
Hidratante Corporal 400ml,Higiene,13,10,2026-08-20,22.90
Protetor Solar FPS 50,Higiene,9,8,2026-06-03,39.90
Pão de Forma 500g,Padaria,45,40,2026-10-30,6.80
Biscoito Recheado 130g,Padaria,180,100,2026-10-29,2.50
Bolo Pronto 300g,Padaria,10,18,2026-10-29,9.90
Torrada Integral 160g,Padaria,34,20,2026-10-18,5.20
Cereal Matinal 300g,Padaria,27,20,2026-10-15,9.40
Barra de Cereal (cx),Padaria,50,25,2026-10-11,11.90
Peito de Frango kg,Carnes,40,50,2026-10-30,17.90
Carne Moída kg,Carnes,32,30,2026-10-30,32.50
Linguiça Toscana kg,Carnes,18,15,2026-10-28,21.40
Bacon Fatiado 250g,Carnes,24,15,2026-10-26,14.90
Hambúrguer Bovino (cx),Carnes,30,20,2026-10-23,18.70
Filé de Tilápia kg,Carnes,7,10,2026-10-29,34.90
Presunto Fatiado kg,Carnes,16,12,2026-10-27,28.90
Salsicha kg,Carnes,25,15,2026-08-26,12.30
Pilha AA (cartela),Utilidades,40,20,2026-10-21,9.90
Lâmpada LED 9W,Utilidades,65,30,2026-10-09,7.50
Vela Aromática,Utilidades,14,6,2026-04-29,16.90
Fósforo (pct),Utilidades,100,50,2026-09-26,1.40
`;

const CSV_MOVIMENTACAO = `mes,entradas,saidas
2025-11,820,760
2025-12,1150,1240
2026-01,640,590
2026-02,580,610
2026-03,720,690
2026-04,760,735
2026-05,810,790
2026-06,700,745
2026-07,860,820
2026-08,790,850
2026-09,900,870
2026-10,840,915
`;
