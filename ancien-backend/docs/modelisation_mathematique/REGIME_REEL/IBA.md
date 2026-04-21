---
title: "IBA"
source: "data/modelisation_mathematique/REGIME_REEL/IBA.pdf"
converted_date: "2025-08-11 15:27:35"
math: true
mathjax: true
---

# IBA

> **Note**: Ce document contient des formules mathématiques. Pour un rendu optimal, utilisez un visualiseur Markdown compatible avec MathJax/KaTeX.

#### Formules de Calcul IBA - B´enin

#### Mod´elisation Fiscale


#### 1   Variables et Constantes

#### 1.1  Variables d’Entr´ee


#### PE =Produits Encaissables         (1)
#### BI =B´en´efice Imposable          (2)
#### CA=Chiffre d’Affaires             (3)
                              V  =Volume produits p´etroliers (litres) (4)
                               pet
#### S =Secteur d’activit´e           (5)
#### A=Type d’activit´e               (6)
#### R=Conditions de r´eduction       (7)
#### 1.2  Constantes R´eglementaires


#### \tau =0.30 (Taux g´en´eral)         (8)
                                g
#### \tau =0.25 (Taux enseignement)      (9)
                                e
                              \tau  =0.015 (Minimum g´en´eral)    (10)
                              min
                              \tau  =0.03 (Minimum BTP)           (11)
                               btp
                             \tau   =0.10 (Minimum immobilier)    (12)
                              imm
                              \tau  =0.60 (FCFA par litre)        (13)
                               pet
                               M =500000 (Minimum absolu g´en´eral) (14)
                                g
                              M  =250000 (Minimum absolu stations) (15)
                               pet
#### R    =4000 (Redevance ORTB)        (16)
                             ORTB
#### 2   Fonctions de Classification
#### 2.1  Fonction de Taux Nominal
#### (cid:40)
#### \tau si A=enseignement priv´e
                              \tau(A)= e                          (17)
#### \tau sinon
                                    g
                                          1














#### 2.2  Fonction de Minimum Sectoriel
                                     
#### \tau    si S =BTP
####  btp
                               \tau (S)= \tau    si S =immobilier    (18)
#### min     imm
#### \tau
#### sinon
                                       min
#### 2.3  Fonction de Minimum Absolu
#### (cid:40)
#### M    si S =stations-services
#### M(S)=   pet                      (19)
#### M    sinon
                                      g
#### 3   Calculs Interm´ediaires
#### 3.1  Impˆot Nominal
#### I  =BI\times\tau(A)               (20)
                                     nom
#### 3.2  Impˆot Minimum par Secteur
#### (cid:40)
                                  PE\times\tau   (S) si S ̸=stations-services
                          I  (S)=     min                      (21)
                           min
                                  V  \times\tau     si S =stations-services
#### pet pet
#### 4   Calcul Principal de l’IBA
#### 4.1  Impoˆt de Base (avant r´eductions)
#### I  =max{I ,I  (S),M(S)}        (22)
#### base    nom min
#### 4.2  Fonction de R´eduction
#### (cid:40)
#### 0.5 si conditions artisanales remplies
                           f (R)=                              (23)
                            red
#### 1  sinon
#### 4.3  Impoˆt apr`es R´eductions
#### I =I   \timesf  (R)             (24)
#### red base red
#### 4.4  Formule Finale de l’IBA
#### IBA=I  +R                  (25)
#### red ORTB
#### 5   Cas Particuliers
#### 5.1  Exon´erations Totales
#### IBA=0  si contribuable exon´er´e (26)
                                          2


















#### 5.2  Passage TPS vers R´egime R´eel
#### R´egime IBA si CA>50000000 FCFA (27)

#### 6   Algorithme  de Calcul Complet


                         E´tape 1: V´erifier exon´eration\toSi oui: IBA=0 (28)
                         E´tape 2: Calculer I =BI\times\tau(A)         (29)
                                     nom
                         E´tape 3: Calculer I (S) selon secteur (30)
                                     min
                         E´tape 4: D´eterminer I =max{I ,I (S),M(S)} (31)
#### base    nom min
                         E´tape 5: Appliquer r´eduction: I =I \timesf (R) (32)
#### red base red
                         E´tape 6: R´esultat final: IBA=I +R   (33)
#### red  ORTB
#### 7   Exemples  Num´eriques
                  7.1  Cas 1: Entreprise Commerciale Standard
                        Donn´ees: BI =10000000, PE =8000000, S =commerce (34)
                            I  =10000000\times0.30=3000000          (35)
                            nom
                            I  =8000000\times0.015=120000           (36)
                            min
                            I  =max{3000000,120000,500000}=3000000 (37)
                            base
#### IBA=3000000+4000=3004000 FCFA      (38)
#### 7.2  Cas 2: Entreprise BTP
                          Donn´ees: BI =2000000, PE =15000000, S =BTP (39)
                             I  =2000000\times0.30=600000           (40)
                              nom
                             I  =15000000\times0.03=450000          (41)
                              min
                             I  =max{600000,450000,500000}=600000 (42)
                              base
#### IBA=600000+4000=604000 FCFA       (43)
#### 7.3  Cas 3: Station-Service
                          Donn´ees: BI =800000, V =500000 litres (44)
                                          pet
                             I  =800000\times0.30=240000            (45)
                              nom
                             I  =500000\times0.60=300000            (46)
                              min
                             I  =max{240000,300000,250000}=300000 (47)
                              base
#### IBA=300000+4000=304000 FCFA       (48)
                                          3

---
*Converti automatiquement depuis PDF avec préservation des symboles mathématiques*