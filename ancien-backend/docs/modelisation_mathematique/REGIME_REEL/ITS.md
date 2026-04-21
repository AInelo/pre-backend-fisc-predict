---
title: "ITS"
source: "data/modelisation_mathematique/REGIME_REEL/ITS.pdf"
converted_date: "2025-08-11 15:27:37"
math: true
mathjax: true
---

# ITS

> **Note**: Ce document contient des formules mathématiques. Pour un rendu optimal, utilisez un visualiseur Markdown compatible avec MathJax/KaTeX.

1   D´efinition des Variables et Constantes

#### 1.1  Variables


#### S =Salaire brut mensuel (en FCFA)   (1)
#### B =Base imposable (en FCFA)         (2)
                          ITS =Impˆot sur les Traitements et Salaires (en FCFA) (3)
                         ORTB =Redevance ORTB (en FCFA)         (4)
                          T  =Total des pr´el`evements (en FCFA) (5)
#### total
#### 1.2  Constantes du Bar`eme


#### T =60000 FCFA (limite tranche 1) (6)
                                1
#### T =150000 FCFA (limite tranche 2) (7)
                                2
#### T =250000 FCFA (limite tranche 3) (8)
                                3
#### T =500000 FCFA (limite tranche 4) (9)
                                4
#### \tau =0% (taux tranche 1)          (10)
                                1
#### \tau =10% (taux tranche 2)         (11)
                                2
#### \tau =15% (taux tranche 3)         (12)
                                3
#### \tau =19% (taux tranche 4)         (13)
                                4
#### \tau =30% (taux tranche 5)         (14)
                                5
#### 1.3  Constantes ORTB
                        ORTB   =1000 FCFA                      (15)
                            mars
                        ORTB   =3000 FCFA                      (16)
                             juin
                            S  =60000 FCFA (seuil d’exon´eration ORTB juin) (17)
                            exon
#### 2   Formule G´en´erale de l’ITS
                  L’ITS se calcule par application d’un bar`eme progressif par tranches :
                                   n
#### (cid:88)
                              ITS =  \tau \times(montant de la tranche i) (18)
                                     i
                                  i=1
                                          1

















#### 3   Calcul D´etaill´e par Tranches

#### 3.1  Fonction de Calcul ITS
                         
#### 
                          \tau
                          0
                           2
                            \times(B−T
                                 1
                                  )
                                                                  s
                                                                  s
                                                                   i
                                                                   i T
                                                                    B
                                                                     1
                                                                     \leq
                                                                      <
                                                                       T
                                                                       B
                                                                       1
#### \leqT
                                                                           2
                  ITS(B)= \tau \times(T −T )+\tau \times(B−T )                    si T <B \leqT
                           2   2  1  3      2                        2     3
#### 
                          \tau
                          \tau
                           2
#### \times
#### \times
                             (
                             (
                              T
                              T
                               2
                               −
                               −
                                 T
                                 T
                                  1
                                  )
                                  )
                                   +
                                   +
                                    \tau
                                    \tau
                                     3
#### \times
#### \times
                                       (
                                       (
                                        T
                                        T
                                         3
                                          −
                                          −
                                           T
                                           T
                                            2
                                            )
                                            )
                                             +
                                             +
                                               \tau
                                               \tau
                                               4
#### \times
#### \times
                                                  (
                                                  (
                                                  B
                                                  T
                                                   −
                                                    −
                                                     T
                                                     T
                                                      3
                                                      )
                                                       )+\tau \times(B−T )
                                                                  s
                                                                  s
                                                                   i
                                                                   i
                                                                    T
                                                                    B
                                                                     3
                                                                     >
                                                                      <
                                                                       T
#### B \leqT
                                                                           4
                           2   2  1  3   3  2  4   4  3  5      4      4
                                                               (19)
#### 3.2  Formules D´evelopp´ees par Tranche
#### 3.2.1 Tranche 1 : B \leq60000
## Its =0                 (20)
#### 3.2.2 Tranche 2 : 60000<B \leq150000
#### ITS =0.10\times(B−60000)          (21)
#### 3.2.3 Tranche 3 : 150000<B \leq250000
                   ITS =0.10\times90000+0.15\times(B−150000)=9000+0.15\times(B−150000) (22)
#### 3.2.4 Tranche 4 : 250000<B \leq500000
                        ITS =0.10\times90000+0.15\times100000+0.19\times(B−250000) (23)
                           =9000+15000+0.19\times(B−250000)         (24)
                           =24000+0.19\times(B−250000)              (25)
#### 3.2.5 Tranche 5 : B >500000
                   ITS =0.10\times90000+0.15\times100000+0.19\times250000+0.30\times(B−500000)
                                                               (26)
                      =9000+15000+47500+0.30\times(B−500000)        (27)
                      =71500+0.30\times(B−500000)                   (28)
                                          2









#### 4   Calcul des Redevances ORTB

#### 4.1  Fonction ORTB

                                    
#### 1000 si mois=3 (mars)
#### 3000
#### si mois=6 (juin) et B >60000
                        ORTB(B,mois)=                          (29)
####  0
                                     0
                                         s
                                         s
                                          i
                                          in
                                          m
                                           on
#### ois=6 (juin) et B \leq60000
#### 5   Formule G´en´erale Compl`ete
#### T   (B,mois)=ITS(B)+ORTB(B,mois)   (30)
#### total
#### 6   Exemples  de Calcul
#### 6.1  Exemple 1 : Salaire de 200000 FCFA
#### B =200000 FCFA                  (31)
                              ITS =9000+0.15\times(200000−150000)   (32)
#### =9000+0.15\times50000              (33)
#### =9000+7500=16500 FCFA         (34)
#### 6.2  Exemple 2 : Salaire de 600000 FCFA
#### B =600000 FCFA                  (35)
                             ITS =71500+0.30\times(600000−500000)   (36)
                                =71500+0.30\times100000             (37)
#### =71500+30000=101500 FCFA       (38)
#### 7   Matrice de Calcul
####                                   
                         Tranche Borne inf. Borne sup. Taux Montant max.
####   1      0     60000  0%      0   
####                                   
####   2    60001   150000 10%    9000 
                                                             (39)
####   3    150001  250000 15%   15000 
####                                   
####   4    250001  500000 19%   47500 
#### 5    500001   +\infty    30%   Variable

                                          3



















#### 8   Algorithme  de Calcul

                              n
#### (cid:88)
                     Algorithme : min(max(B−borne inf ,0),largeur tranche )\times\tau (40)
#### i            i  i
                             i=1
                     Ou` :
                             largeur tranche =borne sup −borne inf (41)
#### i       i      i
                                borne sup =+\infty                  (42)
                                      5
































                                          4

---
*Converti automatiquement depuis PDF avec préservation des symboles mathématiques*