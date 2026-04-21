---
title: "VPS"
source: "data/modelisation_mathematique/REGIME_REEL/VPS.pdf"
converted_date: "2025-08-11 15:27:39"
math: true
mathjax: true
---

# VPS

> **Note**: Ce document contient des formules mathématiques. Pour un rendu optimal, utilisez un visualiseur Markdown compatible avec MathJax/KaTeX.

Formules  Mathématiques  - Versement  Patronal
#### sur Salaires (VPS)


#### Modélisation Fiscale


### 1   Définitions des Variables



                        Soit S =Masse salariale totale          (1)
                            \tau =Taux applicable                  (2)
#### E =Fonction d’exemption (booléenne) (3)
                            VPS =Montant du Versement Patronal sur Salaires (4)


#### 2   Fonction de Taux

                     Le taux applicable est défini par :
#### (cid:40)
#### 0.04 si établissement général
                           \tau =                                  (5)
                               0.02 si établissement d’enseignement privé
#### 3   Fonction d’Exemption

                     La fonction d’exemption E est définie comme :
#### (cid:40)
#### 1 si conditions d’exemption remplies
#### E =                                (6)
#### 0 sinon









                                          1




















#### 3.1  Conditions d’Exemption Détaillées


                    E =1 \Leftarrow\Rightarrow  (Représentation diplomatique)      (7)
                            \\lor(Organisation internationale)      (8)
                            \\lor(Assujetti TPS)                    (9)
                            \\lor(Entreprise nouvelle\\landPremier exercice\\landSalarié béninois)
                                                               (10)
                            \\lor(Premier emploi béninois\\landDéclaré CNSS\\landt\leq2 ans) (11)

                            \\lor(Stagiaire selon art. 120)        (12)

#### 4   Formule Principale du VPS


                                   VPS =S\times\tau \times(1−E)             (13)

                  5   Formules Conditionnelles Développées

#### 5.1  Pour un Établissement Général

#### (cid:40)
#### 0     si E =1
#### VPS   =                        (14)
#### gnral
#### S\times0.04 si E =0
                  5.2  Pour un Établissement d’Enseignement Privé
#### (cid:40)
#### 0     si E =1
#### VPS       =                      (15)
#### enseignement
#### S\times0.02 si E =0
#### 6   Modèle Temporel  pour l’Exemption
#### 6.1  Exemption Entreprise Nouvelle
                     Soit t la date de création de l’entreprise et t la date courante :
                        c
#### (cid:40)
                                 1 si (t−t )\leq1 exercice\\landSalarié béninois
                         E    =         c                      (16)
#### nouvelle
#### 0 sinon


                                          2




















#### 6.2  Exemption Premier Emploi
                     Soit t la date d’embauche du premier emploi béninois :
                        e
#### (cid:40)
#### 1 si (t−t )\leq2 ans\\landDéclaré CNSS
                         E        =        e                   (17)
#### $\1_{\2}$
#### 0 sinon
#### 7   Formule Générale Multi-Critères
                     Pour un calcul complet tenant compte de tous les critères :
                                 
#### 0   si E =1
                                 
                          VPS =S\times  0.02 si E =0\\landEnseignement privé (18)
#### 0.04
#### si E =0\\landÉtablissement général
#### 8   Base de Calcul
                     La base de calcul S est identique à celle de l’ITS :
                           n
#### (cid:88)
                        S = (Salaire +moluments +$\1_{\2}$ ) (19)
#### i        i                 i
                          i=1
                     où n est le nombre total de salariés.



















                                          3

---
*Converti automatiquement depuis PDF avec préservation des symboles mathématiques*