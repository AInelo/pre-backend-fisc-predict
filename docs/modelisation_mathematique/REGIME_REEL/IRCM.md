---
title: "IRCM"
source: "data/modelisation_mathematique/REGIME_REEL/IRCM.pdf"
converted_date: "2025-08-11 15:27:36"
math: true
mathjax: true
---

# IRCM

> **Note**: Ce document contient des formules mathématiques. Pour un rendu optimal, utilisez un visualiseur Markdown compatible avec MathJax/KaTeX.

#### Formulation Math´ematique  de l’IRCM  -
#### R´epublique du B´enin


#### Mod´elisation Fiscale


#### 1   D´efinitions et Notations

                     SoitRlerevenubrutimposableetIRCM l’impˆotsurlerevenudescapitaux
                  mobiliers.

#### 1.1  Variables d’E´tat


                       S =Statut du b´en´eficiaire\in{R´esident,Non-r´esident} (1)
                       T =Type de revenu\in{Dividende,Int´erˆet,Plus-value,Cr´eance} (2)
                       N =Nature du titre\in{Public,Priv´e,Cot´e,Non-cot´e} (3)

                       D =Dur´ee d’´emission (en ann´ees)\inR+    (4)
                       E =E´metteur\in{B´enin,UEMOA,Priv´e}       (5)

#### 1.2  Fonction d’Exon´eration

                                 
                                  1 si E =B´enin ou collectivit´es b´eninoises
                                 
                        Exo(E,N)= 1 si conditions art. 73-80 CGI (6)
                                 0
#### sinon
#### 2   Fonction de D´etermination du Taux
#### 2.1  Taux Principal
                     La fonction de taux \tau(T,S,N,E,D) est d´efinie par :







                                          1




















                                
#### 0.05 si f (T,S,N)=1
#### 
                                 0
                                 0
                                  .
                                  .
                                  0
                                  1
                                   6
                                   0
                                     s
                                     s
                                      i
                                      i
                                       f
                                       f
                                       5
                                       6
                                       10
                                        (T
                                        (T
                                         ,
                                          ,
                                          N
                                           S
                                           ,
                                           )
                                            D
                                            =
                                             ,E
                                              1
                                               )=1
                              \tau = 0.15 si f (T)=1               (7)
                                       15
#### 
                                 0
                                 0
                                  .
                                  .
                                  0
                                  0
                                   0
                                   3
                                     s
                                     si
                                      i
                                       f
                                       f
                                       3
                                       0
                                        (
                                        (
                                        T
                                        T
                                         ,
                                         ,
                                          E
                                          E
                                           ,
                                           ,
                                            D
                                            D
                                             )
                                             )
                                              =
                                              =
                                               1
                                               1
#### 0.05 si T =Plus-value obligations
#### 2.2  Fonctions Conditionnelles
#### 2.2.1 Taux 5%
                               
#### 1 si T =Dividende\\landS =Non-r´esident
#### 1
#### si T =Dividende\\landN =Cot´e UEMOA
                       f (T,S,N)=                               (8)
                       5
####  1
                                0
                                  s
                                  s
                                   i
                                   in
                                    T
                                    on
                                     =Plus-value actions\\landS =Non-r´esident
#### 2.2.2 Taux 6%
                                  
                                    1 si T =Int´erˆet obligation\\landE =Priv´e
                                  
                        f (T,N,D,E)= 1 si T =Lot/Prime remboursement (9)
                         6
                                  0
#### sinon
#### 2.2.3 Taux 10%
                                 
#### 1 si T =Dividende\\landf (T,S,N)=0
#### 1
#### si T =B´en´efice ´etabl
                                                 5
#### issement stable
                          f (T,S)=                             (10)
                           10
####  1
                                  0
                                    s
                                    s
                                     i
                                     in
                                      T
                                      on
#### =Part d’int´erˆet soci´et´e IS
#### 2.2.4 Taux 15%
                                
#### 1 si T =Cr´eance/D´epˆot/Cautionnement
                                
                          f (T)= 1 si T \in/ {f ,f ,f ,f ,f }    (11)
#### 15           5 6 10 3 0
                                0
#### sinon
                                          2










#### 2.2.5 Taux Sp´eciaux UEMOA

#### (cid:40)
                             1  si T =Int´erˆet obligation\\landE =UEMOA\\land5\leqD \leq10
                    f (T,E,D)=
                    3
#### 0  sinon
                                                               (12)
#### (cid:40)
                              1 si T =Int´erˆet obligation\\landE =UEMOA\\landD >10
                    f (T,E,D)=                                 (13)
                    0
#### 0 sinon
#### 3   Calcul de l’IRCM
#### 3.1  Formule G´en´erale
                        IRCM =R\times\tau(T,S,N,E,D)\times(1−Exo(E,N))\timesConv(S) (14)

#### 3.2  Facteur Convention Fiscale


#### (cid:40)
                           min(1,\tau  /\tau    ) si convention existe et S =Non-r´esident
#### Conv(S)=     convention national
#### 1                sinon
                                                               (15)
#### 4   Contraintes et Invariants

#### 4.1  Contraintes de Domaine


#### R\geq0                    (16)
#### \tau \in[0,0.15]            (17)
#### IRCM \leqR                   (18)
#### D \geq0                   (19)

#### 4.2  Contrainte Temporelle

                     Soit t  la date de mise en paiement et t la date limite de
#### paiement                 reversement
                  reversement :
                           t      = min(d:d>t   \\landjour(d)=10)   (20)
#### reversement    paiement
#### d\inM
                  ou` M est l’ensemble des dates du mois suivant t .
#### paiement
                                          3

















#### 5   Cas Particuliers

#### 5.1  Dividendes Multiples Crit`eres

                     Pour un dividende, la priorit´e des taux suit l’ordre :
#### (cid:40)
                           0.05 si cot´e UEMOA ou non-r´esident avec convention favorable
                   \tau    =
#### dividende
#### 0.10 sinon
                                                               (21)
#### 5.2  Obligations Gouvernementales UEMOA
                                         
#### 0.00 si D >10
                                         
                              \tau         =  0.03 si 5\leqD \leq10     (22)
#### obligationUEMOA
#### 0.06
                                              si D <5
#### 6   Algorithme  de Calcul
                             Algorithme CalculIRCM(R,T,S,N,E,D):
#### si Exo(E,N)=1 alors retourner 0
                              \tau \leftarrowDeterminerTaux(T,S,N,E,D)     (23)
#### c\leftarrowConv(S)
#### retourner R\times\tau \timesc

#### 7   Validation

#### 7.1  Tests de Coh´erence


#### \\forallR>0: 0\leqIRCM  \leqR      (24)
#### \\foralltitre exon´er´e: IRCM =0 (25)
                           \\forallobligation UEMOA ¿ 10 ans: IRCM =0 (26)










                                          4

---
*Converti automatiquement depuis PDF avec préservation des symboles mathématiques*