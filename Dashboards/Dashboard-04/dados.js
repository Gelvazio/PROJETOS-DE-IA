/** CSV embutido (colunas: data,cliente,receita,custo). Substitua o conteúdo para trocar os dados. */
const DADOS_CSV = `data,cliente,receita,custo
2024-01-01,Oficina Mecânica Norte,5957,4411
2024-01-03,Supermercado Econômico,33861,22884
2024-01-04,Auto Peças Veloz,24606,20590
2024-01-06,Construtora Alvorada,6096,4462
2024-01-07,Farmácia Saúde Total,15622,10553
2024-01-07,Livraria Página Viva,8766,5917
2024-01-08,Clínica Vida Plena,10123,7973
2024-01-10,Clínica Vida Plena,22875,16777
2024-01-10,Escola Horizonte,10725,8576
2024-01-11,Livraria Página Viva,5991,4050
2024-01-12,Agropecuária Campo Verde,10860,9379
2024-01-14,Farmácia Saúde Total,10773,7683
2024-01-17,Móveis Lar Doce,20685,14682
2024-01-20,Mercado Boa Vista,11901,7805
2024-01-20,Transportes Rota Sul,4172,3583
2024-01-22,Construtora Alvorada,6897,4674
2024-01-23,Hotel Praia Azul,8249,5680
2024-01-23,Supermercado Econômico,18953,13707
2024-01-26,Indústria Metalúrgica Forte,11485,10136
2024-01-26,Transportes Rota Sul,6311,5261
2024-01-28,Auto Peças Veloz,22284,18477
2024-01-28,Pet Shop Amigo Fiel,30019,23372
2024-02-02,Clínica Vida Plena,19772,15534
2024-02-02,Construtora Alvorada,5934,4186
2024-02-04,Hotel Praia Azul,5051,3713
2024-02-10,Pet Shop Amigo Fiel,32902,26387
2024-02-12,Hotel Praia Azul,8191,6144
2024-02-13,Farmácia Saúde Total,13509,9258
2024-02-14,Padaria Pão Dourado,7972,6587
2024-02-17,Agropecuária Campo Verde,16277,14710
2024-02-19,Oficina Mecânica Norte,10407,7914
2024-02-21,Escola Horizonte,14186,10360
2024-02-21,Farmácia Saúde Total,9154,6006
2024-02-22,Transportes Rota Sul,3333,2749
2024-02-24,Escola Horizonte,16479,12156
2024-02-26,Indústria Metalúrgica Forte,22188,19158
2024-02-28,Supermercado Econômico,32660,23066
2024-03-04,Padaria Pão Dourado,11089,9294
2024-03-05,Construtora Alvorada,8136,5702
2024-03-05,Escola Horizonte,19210,14073
2024-03-07,Auto Peças Veloz,19871,16991
2024-03-07,Clínica Vida Plena,18420,13483
2024-03-07,Móveis Lar Doce,29165,20210
2024-03-07,Restaurante Sabor Caseiro,21256,17415
2024-03-08,Mercado Boa Vista,14956,9845
2024-03-09,Oficina Mecânica Norte,7619,5410
2024-03-12,Indústria Metalúrgica Forte,17326,15558
2024-03-13,Academia Corpo Ativo,30077,23562
2024-03-13,Clínica Vida Plena,12577,9353
2024-03-13,Hotel Praia Azul,10391,7654
2024-03-18,Farmácia Saúde Total,18099,11947
2024-03-22,Escola Horizonte,10175,8059
2024-03-23,Oficina Mecânica Norte,8643,6740
2024-03-25,Transportes Rota Sul,7739,6662
2024-03-26,Pet Shop Amigo Fiel,18310,14435
2024-04-03,Auto Peças Veloz,19599,16311
2024-04-07,Academia Corpo Ativo,18405,14901
2024-04-07,Padaria Pão Dourado,14547,12652
2024-04-08,Construtora Alvorada,10787,7404
2024-04-08,Farmácia Saúde Total,25331,16600
2024-04-11,Padaria Pão Dourado,17081,14060
2024-04-12,Pet Shop Amigo Fiel,40589,31019
2024-04-14,Móveis Lar Doce,21667,14898
2024-04-14,Pet Shop Amigo Fiel,26314,20114
2024-04-21,Escola Horizonte,12181,9806
2024-04-22,Supermercado Econômico,32726,22696
2024-04-25,Livraria Página Viva,6614,4650
2024-04-28,Hotel Praia Azul,7907,5845
2024-04-28,Transportes Rota Sul,4987,4176
2024-05-08,Mercado Boa Vista,12447,8259
2024-05-09,Agropecuária Campo Verde,29021,25708
2024-05-10,Construtora Alvorada,5936,4069
2024-05-11,Padaria Pão Dourado,17080,13937
2024-05-12,Oficina Mecânica Norte,10234,7866
2024-05-13,Livraria Página Viva,11875,8544
2024-05-16,Clínica Vida Plena,26938,21439
2024-05-16,Construtora Alvorada,7300,4847
2024-05-18,Escola Horizonte,12291,9808
2024-05-20,Farmácia Saúde Total,13253,9641
2024-05-23,Auto Peças Veloz,24551,20005
2024-05-23,Farmácia Saúde Total,19262,13091
2024-05-24,Hotel Praia Azul,8292,6012
2024-05-26,Oficina Mecânica Norte,8558,6026
2024-06-02,Construtora Alvorada,7620,5181
2024-06-02,Mercado Boa Vista,17568,12734
2024-06-05,Móveis Lar Doce,28672,19576
2024-06-10,Clínica Vida Plena,15036,11135
2024-06-10,Indústria Metalúrgica Forte,19811,17431
2024-06-11,Agropecuária Campo Verde,26382,23531
2024-06-11,Restaurante Sabor Caseiro,28437,23100
2024-06-13,Construtora Alvorada,6386,4703
2024-06-13,Transportes Rota Sul,5195,4256
2024-06-15,Academia Corpo Ativo,22878,18180
2024-06-16,Transportes Rota Sul,7791,6335
2024-06-17,Livraria Página Viva,8250,5699
2024-06-17,Oficina Mecânica Norte,14267,11174
2024-06-19,Oficina Mecânica Norte,7043,5110
2024-06-22,Supermercado Econômico,44935,32657
2024-06-25,Escola Horizonte,22029,17400
2024-06-25,Hotel Praia Azul,10868,7692
2024-06-25,Mercado Boa Vista,16701,11413
2024-06-26,Farmácia Saúde Total,16824,12189
2024-07-02,Farmácia Saúde Total,24338,16349
2024-07-04,Construtora Alvorada,10425,7352
2024-07-05,Academia Corpo Ativo,45752,36605
2024-07-07,Mercado Boa Vista,17804,12752
2024-07-07,Supermercado Econômico,49433,33983
2024-07-13,Construtora Alvorada,6091,4048
2024-07-13,Farmácia Saúde Total,15532,10320
2024-07-14,Auto Peças Veloz,41346,35244
2024-07-15,Livraria Página Viva,11410,8458
2024-07-21,Indústria Metalúrgica Forte,21260,18468
2024-07-25,Transportes Rota Sul,9605,8017
2024-07-28,Escola Horizonte,14736,10910
2024-08-06,Hotel Praia Azul,12117,8666
2024-08-09,Pet Shop Amigo Fiel,40444,31105
2024-08-09,Transportes Rota Sul,4739,3995
2024-08-10,Clínica Vida Plena,24064,18674
2024-08-10,Livraria Página Viva,6289,4441
2024-08-11,Construtora Alvorada,9929,7101
2024-08-13,Móveis Lar Doce,31496,23109
2024-08-15,Indústria Metalúrgica Forte,18058,15658
2024-08-15,Mercado Boa Vista,15582,10846
2024-08-17,Supermercado Econômico,43261,31065
2024-08-18,Padaria Pão Dourado,12402,10933
2024-08-19,Pet Shop Amigo Fiel,33198,25571
2024-08-27,Oficina Mecânica Norte,11427,8700
2024-08-28,Restaurante Sabor Caseiro,33673,26948
2024-09-07,Oficina Mecânica Norte,11777,8335
2024-09-08,Indústria Metalúrgica Forte,19972,18064
2024-09-09,Auto Peças Veloz,24242,19695
2024-09-12,Agropecuária Campo Verde,26812,24315
2024-09-13,Academia Corpo Ativo,19356,15539
2024-09-14,Construtora Alvorada,8985,6387
2024-09-20,Móveis Lar Doce,25670,17987
2024-09-21,Agropecuária Campo Verde,23207,19822
2024-09-21,Indústria Metalúrgica Forte,10553,8875
2024-09-24,Construtora Alvorada,6163,4288
2024-09-24,Hotel Praia Azul,9788,7266
2024-09-25,Hotel Praia Azul,11386,8054
2024-09-26,Academia Corpo Ativo,19448,15438
2024-09-28,Farmácia Saúde Total,17813,12795
2024-09-28,Oficina Mecânica Norte,8192,6348
2024-10-03,Farmácia Saúde Total,8963,6389
2024-10-03,Indústria Metalúrgica Forte,22070,18636
2024-10-04,Escola Horizonte,17301,13938
2024-10-05,Pet Shop Amigo Fiel,38724,29785
2024-10-12,Mercado Boa Vista,13512,9521
2024-10-14,Farmácia Saúde Total,10675,6999
2024-10-15,Oficina Mecânica Norte,9751,7564
2024-10-16,Auto Peças Veloz,17294,14968
2024-10-17,Escola Horizonte,17924,13527
2024-10-17,Padaria Pão Dourado,11622,9974
2024-10-19,Padaria Pão Dourado,7010,5915
2024-10-21,Livraria Página Viva,5476,4052
2024-10-23,Oficina Mecânica Norte,8567,6568
2024-10-26,Indústria Metalúrgica Forte,16589,14210
2024-10-28,Auto Peças Veloz,21111,17294
2024-10-28,Mercado Boa Vista,14999,9849
2024-10-28,Móveis Lar Doce,12373,9296
2024-10-28,Transportes Rota Sul,4465,3837
2024-11-01,Transportes Rota Sul,4678,3921
2024-11-02,Agropecuária Campo Verde,19991,17497
2024-11-02,Oficina Mecânica Norte,10325,7950
2024-11-15,Indústria Metalúrgica Forte,14587,12579
2024-11-15,Móveis Lar Doce,23854,17168
2024-11-16,Escola Horizonte,9273,7699
2024-11-16,Mercado Boa Vista,10451,7641
2024-11-17,Construtora Alvorada,4712,3483
2024-11-17,Oficina Mecânica Norte,6532,5014
2024-11-18,Hotel Praia Azul,5967,4230
2024-11-20,Pet Shop Amigo Fiel,23291,20165
2024-12-01,Escola Horizonte,8429,6375
2024-12-01,Mercado Boa Vista,13607,9056
2024-12-02,Supermercado Econômico,20244,15171
2024-12-05,Hotel Praia Azul,5754,4156
2024-12-07,Restaurante Sabor Caseiro,27072,21324
2024-12-08,Academia Corpo Ativo,31852,24420
2024-12-08,Construtora Alvorada,6800,4980
2024-12-08,Restaurante Sabor Caseiro,13099,10391
2024-12-12,Clínica Vida Plena,13960,10876
2024-12-12,Farmácia Saúde Total,15440,10932
2024-12-13,Móveis Lar Doce,16744,12505
2024-12-14,Livraria Página Viva,4567,3322
2024-12-16,Padaria Pão Dourado,12235,10243
2024-12-17,Supermercado Econômico,23799,16229
2024-12-25,Auto Peças Veloz,25031,20380
2024-12-26,Pet Shop Amigo Fiel,27263,21626
2024-12-27,Hotel Praia Azul,4065,2849
2024-12-28,Livraria Página Viva,8786,6289
2025-01-04,Transportes Rota Sul,6013,4792
2025-01-06,Academia Corpo Ativo,16018,12178
2025-01-06,Escola Horizonte,14485,10836
2025-01-09,Hotel Praia Azul,5516,4008
2025-01-14,Auto Peças Veloz,22610,19367
2025-01-16,Móveis Lar Doce,21712,15289
2025-01-18,Hotel Praia Azul,5495,3846
2025-01-22,Mercado Boa Vista,10461,7240
2025-01-23,Livraria Página Viva,8681,6213
2025-01-26,Escola Horizonte,12529,9581
2025-01-28,Clínica Vida Plena,15218,11301
2025-01-28,Construtora Alvorada,5707,4005
2025-01-28,Farmácia Saúde Total,14828,10461
2025-01-28,Indústria Metalúrgica Forte,17221,15339
2025-02-02,Farmácia Saúde Total,18344,12289
2025-02-08,Pet Shop Amigo Fiel,29991,24758
2025-02-11,Livraria Página Viva,7578,5336
2025-02-11,Livraria Página Viva,9051,6206
2025-02-15,Auto Peças Veloz,31201,26515
2025-02-21,Supermercado Econômico,39845,26882
2025-02-24,Auto Peças Veloz,21505,18324
2025-02-25,Indústria Metalúrgica Forte,17886,15110
2025-02-26,Oficina Mecânica Norte,12491,9378
2025-02-27,Clínica Vida Plena,22353,17904
2025-02-27,Padaria Pão Dourado,7679,6509
2025-02-28,Escola Horizonte,13862,10348
2025-03-01,Mercado Boa Vista,17729,12922
2025-03-01,Pet Shop Amigo Fiel,39956,32415
2025-03-03,Agropecuária Campo Verde,15900,13791
2025-03-10,Auto Peças Veloz,27832,23611
2025-03-12,Móveis Lar Doce,20454,15327
2025-03-18,Escola Horizonte,11097,8308
2025-03-19,Padaria Pão Dourado,7738,6265
2025-03-21,Oficina Mecânica Norte,6735,5088
2025-03-22,Clínica Vida Plena,21915,16945
2025-03-24,Hotel Praia Azul,7967,6008
2025-03-25,Academia Corpo Ativo,34616,27175
2025-03-25,Construtora Alvorada,8465,5755
2025-03-28,Oficina Mecânica Norte,12129,9015
2025-04-03,Móveis Lar Doce,15897,11496
2025-04-06,Auto Peças Veloz,38136,32972
2025-04-06,Supermercado Econômico,38157,25832
2025-04-07,Escola Horizonte,23107,17473
2025-04-08,Indústria Metalúrgica Forte,16641,14174
2025-04-08,Oficina Mecânica Norte,13126,10062
2025-04-10,Pet Shop Amigo Fiel,51608,42134
2025-04-13,Restaurante Sabor Caseiro,41410,32568
2025-04-14,Mercado Boa Vista,10469,6944
2025-04-14,Padaria Pão Dourado,9968,8039
2025-04-15,Supermercado Econômico,46220,33940
2025-04-18,Escola Horizonte,16085,12463
2025-04-20,Agropecuária Campo Verde,16993,14583
2025-04-25,Academia Corpo Ativo,32474,25709
2025-05-04,Farmácia Saúde Total,27075,18119
2025-05-04,Mercado Boa Vista,18951,13313
2025-05-12,Escola Horizonte,13123,9671
2025-05-13,Agropecuária Campo Verde,30581,25604
2025-05-14,Livraria Página Viva,7635,5148
2025-05-15,Livraria Página Viva,7408,5281
2025-05-18,Mercado Boa Vista,17651,12495
2025-05-21,Transportes Rota Sul,10640,8721
2025-05-24,Escola Horizonte,25696,19957
2025-05-25,Auto Peças Veloz,48317,40670
2025-05-26,Móveis Lar Doce,24156,17925
2025-06-02,Pet Shop Amigo Fiel,46897,37119
2025-06-03,Construtora Alvorada,10283,6896
2025-06-08,Restaurante Sabor Caseiro,29270,23488
2025-06-08,Supermercado Econômico,54178,38343
2025-06-09,Oficina Mecânica Norte,11547,8431
2025-06-13,Clínica Vida Plena,38130,27914
2025-06-15,Agropecuária Campo Verde,18231,16202
2025-06-15,Farmácia Saúde Total,19564,14091
2025-06-21,Academia Corpo Ativo,30359,23951
2025-06-21,Agropecuária Campo Verde,27101,24043
2025-06-23,Hotel Praia Azul,12322,8812
2025-06-25,Indústria Metalúrgica Forte,28776,23977
2025-06-27,Mercado Boa Vista,22280,16033
2025-06-27,Supermercado Econômico,57732,40311
2025-07-04,Hotel Praia Azul,6981,4795
2025-07-09,Móveis Lar Doce,36243,26511
2025-07-09,Restaurante Sabor Caseiro,24716,18619
2025-07-12,Auto Peças Veloz,39557,33034
2025-07-12,Padaria Pão Dourado,15415,12842
2025-07-13,Construtora Alvorada,7652,5398
2025-07-13,Supermercado Econômico,55309,40885
2025-07-16,Móveis Lar Doce,30482,22306
2025-07-17,Academia Corpo Ativo,42581,31838
2025-07-18,Padaria Pão Dourado,17534,14596
2025-07-24,Livraria Página Viva,13151,9041
2025-07-25,Escola Horizonte,14097,11025
2025-07-26,Oficina Mecânica Norte,14906,11483
2025-08-01,Agropecuária Campo Verde,37668,31682
2025-08-04,Livraria Página Viva,6342,4693
2025-08-10,Farmácia Saúde Total,25151,17617
2025-08-11,Oficina Mecânica Norte,9758,7513
2025-08-13,Indústria Metalúrgica Forte,29333,26070
2025-08-14,Móveis Lar Doce,36541,26316
2025-08-17,Padaria Pão Dourado,10260,8996
2025-08-19,Oficina Mecânica Norte,8472,6108
2025-08-20,Móveis Lar Doce,28336,19473
2025-08-22,Transportes Rota Sul,4320,3494
2025-08-23,Hotel Praia Azul,9059,6649
2025-08-25,Transportes Rota Sul,6163,4994
2025-08-27,Construtora Alvorada,9158,6519
2025-08-28,Academia Corpo Ativo,19845,16094
2025-09-01,Escola Horizonte,13676,10242
2025-09-01,Escola Horizonte,21855,16396
2025-09-01,Padaria Pão Dourado,14819,12713
2025-09-03,Construtora Alvorada,5067,3433
2025-09-03,Mercado Boa Vista,16103,11164
2025-09-03,Móveis Lar Doce,30983,21794
2025-09-07,Auto Peças Veloz,24746,21984
2025-09-08,Oficina Mecânica Norte,10836,8047
2025-09-11,Farmácia Saúde Total,19077,12595
2025-09-12,Mercado Boa Vista,15587,11287
2025-09-15,Supermercado Econômico,31188,22631
2025-09-19,Indústria Metalúrgica Forte,23629,20702
2025-09-20,Construtora Alvorada,5616,4081
2025-09-23,Agropecuária Campo Verde,15391,13132
2025-09-25,Oficina Mecânica Norte,11780,8455
2025-10-02,Restaurante Sabor Caseiro,41017,30978
2025-10-06,Farmácia Saúde Total,25464,18332
2025-10-07,Móveis Lar Doce,19695,13428
2025-10-09,Livraria Página Viva,10256,7181
2025-10-10,Pet Shop Amigo Fiel,32734,25097
2025-10-12,Livraria Página Viva,11114,7686
2025-10-13,Supermercado Econômico,39855,29916
2025-10-14,Supermercado Econômico,35166,25107
2025-10-16,Pet Shop Amigo Fiel,32019,24582
2025-10-19,Oficina Mecânica Norte,7210,5547
2025-10-20,Auto Peças Veloz,41805,34912
2025-10-21,Transportes Rota Sul,3760,2972
2025-10-22,Móveis Lar Doce,25704,17912
2025-10-22,Padaria Pão Dourado,16609,13804
2025-10-26,Escola Horizonte,12817,9595
2025-10-27,Agropecuária Campo Verde,15082,13569
2025-10-28,Escola Horizonte,13301,9972
2025-11-02,Restaurante Sabor Caseiro,20770,16866
2025-11-03,Agropecuária Campo Verde,22834,20398
2025-11-03,Escola Horizonte,16424,12708
2025-11-08,Livraria Página Viva,8726,6580
2025-11-08,Padaria Pão Dourado,9656,8517
2025-11-09,Agropecuária Campo Verde,13407,11727
2025-11-14,Oficina Mecânica Norte,8288,6509
2025-11-17,Livraria Página Viva,6677,5001
2025-11-20,Supermercado Econômico,20352,14431
2025-11-21,Pet Shop Amigo Fiel,33665,26767
2025-11-21,Supermercado Econômico,35890,26573
2025-11-23,Indústria Metalúrgica Forte,17295,15191
2025-11-24,Clínica Vida Plena,19795,16455
2025-11-25,Oficina Mecânica Norte,10699,7980
2025-12-04,Construtora Alvorada,7077,4704
2025-12-05,Pet Shop Amigo Fiel,17265,13876
2025-12-09,Móveis Lar Doce,19105,13474
2025-12-10,Oficina Mecânica Norte,12116,8680
2025-12-11,Livraria Página Viva,9658,6559
2025-12-12,Escola Horizonte,10047,7876
2025-12-12,Indústria Metalúrgica Forte,13170,11673
2025-12-16,Clínica Vida Plena,13283,10566
2025-12-17,Móveis Lar Doce,27885,20341
2025-12-19,Oficina Mecânica Norte,9548,7403
2025-12-20,Academia Corpo Ativo,27718,21976
2025-12-23,Escola Horizonte,11498,9233
2025-12-28,Academia Corpo Ativo,16030,12122
`;
