---
title: "PATENTE"
source: "data/modelisation_mathematique/REGIME_REEL/PATENTE.pdf"
converted_date: "2025-08-11 15:27:38"
math: true
mathjax: true
---

# PATENTE

> **Note**: Ce document contient des formules mathématiques. Pour un rendu optimal, utilisez un visualiseur Markdown compatible avec MathJax/KaTeX.

Formules   de  Calcul  - Contribution   des

#### Patentes


#### Syst`eme Fiscal B´eninois

#### 6 juin 2025



#### 1   Formule    G´en´erale

                  La contribution des patentes P est d´efinie par :

#### P = D +D  +P +P                  (1)
#### f    p  s   c
                  Ou` :

                         D  = Droit fixe                           (2)
                          f
                         D  = Droit proportionnel                  (3)
                          p
                         P  = Patente suppl´ementaire              (4)
                          s
                         P  = Patente compl´ementaire (march´es publics) (5)
                          c
#### 2   Calcul   du Droit   Fixe
#### 2.1  Entreprises Classiques

                  Soit CA le chiffre d’affaires et Z la zone g´eographique :
#### (cid:40)
#### B                si CA \leq 109
                                    Z
                        D (CA,Z) =          (cid:108) (cid:109)    (6)
                         f         B  +104 \times CA−109 si CA > 109
## Z         109
                  Avec les tarifs de base :
#### B = 70000 F CFA (Zone 1)           (7)
                                 1
#### B = 60000 F CFA (Zone 2)           (8)
                                 2
                                          1














#### 2.2  Importateurs/Exportateurs

                  Soit M le montant des importations/exportations :

                        
                          150000               si M \leq 8\times107
                        
                        
                        
                         337500              si 8\times107 < M \leq 2\times108
                        
                        
                        
                         525000              si 2\times108 < M \leq 5\times108
                        
                        
                 D (M) =  675000               si 5\times108 < M \leq 109  (9)
                   f
                         900000              si 109 < M \leq 2\times109
                        
                        
                        
                         1125000             si 2\times109 < M \leq 1010
                        
####              (cid:108) (cid:109)
                         1125000+104 \times M−1010 si M > 1010
                                         109
#### 3   Calcul   du Droit   Proportionnel
#### 3.1  Formule  de Base
                  Soit VL la valeur locative du local i et \tau le taux de la commune c :
#### i                       c
#### (cid:32)     (cid:33)
                                         n
#### (cid:88)  D
                                                   f
                               D  = max   VL  \times\tau ,                (10)
#### p            i  c
                                                  3
                                        i=1




                                          2
















#### 3.2  Taux  par Commune



#### \tau     = 0.17              (11)
#### Cotonou
#### \tau      = 0.17              (12)
#### Porto-Novo
#### \tau    = 0.18              (13)
#### Ouidah
#### \tau    = 0.25              (14)
#### Parakou
#### \tau     = 0.14              (15)
#### Abomey
                                 \tau            = 0.13              (16)
#### AutresOu´em´e/Plateau
#### \tau         = 0.13              (17)
#### AutresAtlantique
#### \tau           = 0.135             (18)
#### AutresZou/Collines
                                 \tau            = 0.15              (19)
#### AutresBorgou/Alibori
#### \tau        = 0.15              (20)
#### Atacora/Donga
#### \tau       = 0.12              (21)
#### Mono/Couffo
#### 4   Patente   Suppl´ementaire
                  Pour les locaux acquis en cours d’ann´ee, soit VL la valeur locative des
                                                    new
               nouveaux locaux :
#### (cid:88)        mois restants
                          P =          VL   \times\tau \times                  (22)
#### s             new  c
                                                    12
#### nouveauxlocaux
               5   Patente   Compl´ementaire     (March´es  Publics)
                  Soit M le montant hors taxe du march´e public :
                       HT
#### P = M  \times0.005                 (23)
#### c   HT
#### 6   Conditions    d’Exemption
                  Fonction d’exemption E(t) ou` t est l’ˆage de l’entreprise en mois :

                                          3
















#### (cid:40)
#### 1  si t < 12 (exemption totale)
                            E(t) =                                (24)
#### 0  si t \geq 12 (assujettie)
                  Donc la patente finale est :

                                  P   = P \times(1−E(t))               (25)
#### finale
#### 7   Modalit´es   de Paiement


#### 7.1  Acompte


                                  Acompte = 0.5\timesP                 (26)
#### finale
#### 7.2  Solde


#### Solde = P −Acompte               (27)
#### finale

#### 8   Exemples    de  Calcul

#### 8.1  Exemple  1 : Commerce   Zone 1

                  Donn´ees :

#### CA = 1.5\times109 F CFA            (28)
#### VL = 2\times106 F CFA              (29)
#### Commune = Cotonou                 (30)

                  Calculs :
#### (cid:24) 1.5\times109 −109(cid:25)
                          D  = 70000+10000\times                       (31)
#### f                    109
                             = 70000+10000\times1 = 80000 F CFA        (32)
#### 80000
                           D = max(2\times106 \times0.17,   )               (33)
                            p
                                               3
                             = max(340000,26667) = 340000 F CFA   (34)
                           P = 80000+340000 = 420000 F CFA        (35)
                                          4
















#### 8.2  Exemple  2 : Importateur

                  Donn´ees :

#### M = 3\times108 F CFA             (36)
#### VL = 5\times105 F CFA             (37)
#### Commune = Porto-Novo              (38)

                  Calculs :

                          D  = 525000 F CFA                       (39)
                            f
#### 525000
                           D = max(5\times105 \times0.17,   )               (40)
                            p
                                               3
                             = max(85000,175000) = 175000 F CFA   (41)
                           P = 525000+175000 = 700000 F CFA       (42)
#### 9   Contraintes    et V´erifications

#### 9.1  Contrainte  du Minimum


                                                 D
                                                   f
                                 \\forall contribuable, D \geq              (43)
                                              p
                                                  3
#### 9.2  Positivit´e
#### P,D ,D ,P ,P \geq 0               (44)
#### f  p s  c

#### 9.3  Coh´erence Temporelle


                           Date d´eclaration \leq 30 avril de l’ann´ee N+1 (45)







                                          5

---
*Converti automatiquement depuis PDF avec préservation des symboles mathématiques*