---
title: "IS"
source: "data/modelisation_mathematique/REGIME_REEL/IS.pdf"
converted_date: "2025-08-11 15:27:37"
math: true
mathjax: true
---

# IS

> **Note**: Ce document contient des formules mathématiques. Pour un rendu optimal, utilisez un visualiseur Markdown compatible avec MathJax/KaTeX.

Formules Math´ematiques  - Impoˆt sur les Soci´et´es du B´enin


#### Mod´elisation Fiscale

#### 6 juin 2025


#### 1  Variables et Constantes

#### 1.1 Constantes Fiscales


                     \tau   =0.30              (Taux g´en´eral 30%)           (1)
#### general
                     \tau   =0.25              (Taux r´eduit 25%)             (2)
#### reduit
                     \tauimmo =0.10            (Taux minimum immobilier 10%)  (3)
                      min
                      \taubtp =0.03            (Taux minimum BTP 3%)          (4)
                       min
                    \taugeneral =0.01          (Taux minimum g´en´eral 1%)    (5)
                     min
                     \tau   =0.60              (FCFA par litre)               (6)
#### station
                     Iabsolu =250,000       (FCFA minimum absolu)          (7)
                      min
                     R   =4,000             (Redevance ORTB en FCFA)       (8)
                      ORTB
                    q    =0.30              (Quote-part forfaitaire 30%)   (9)
#### mobilier
#### 1.2 Variables d’Entr´ee
                          BN :B´en´efice Net                              (10)
                          PE :Produits Encaissables                       (11)
                        RCM :Revenus de Capitaux Mobiliers                (12)
                        V   :Volume de produits p´etroliers (litres)      (13)
#### petrole
                           S :Secteur d’activit´e\in{g´en´eral,BTP,immobilier} (14)
                           T :Type de soci´et´e\in{g´en´eral,enseignement,industriel} (15)
#### 2  Calcul de la Base Imposable
#### 2.1 Base Imposable Principale
                             BI =BN −RCM     +R´eint´egrations            (16)
#### exoneres
        2.2 Traitement des Revenus de Capitaux Mobiliers

                           RCM   =RCM \times(1−q    )=RCM \times0.70                (17)
#### net         mobilier




                                          1





#### 3  Calcul des Taux  Applicables

#### 3.1 Fonction de Taux Principal

#### (cid:40)
                              \tau   =0.25 si T \in{enseignement,industriel}
                        \tau(T)=  reduit                                     (18)
#### \tau    =0.30 sinon
#### general
#### 3.2 Fonction de Taux Minimum
                                  
#### \tauimmo =0.10 si S =immobilier
####  min
                            \tau  (S)= \taubtp =0.03 si S =BTP                  (19)
#### min     min
#### \taugeneral
#### =0.01 sinon
                                    min
#### 4  Calculs d’Impoˆts
#### 4.1 Impoˆt Th´eorique
                                   I     =BI\times\tau(T)                         (20)
#### theorique
#### 4.2 Impoˆt Minimum Standard
                                  Istandard =PE\times\tau (S)                     (21)
#### min        min
        4.3 Impoˆt Minimum pour Stations-Service


                                  Istation =V \times\tau                          (22)
#### min   petrole station
#### 4.4 Impoˆt Minimum Effectif

                             Ieffectif =max (cid:0) Istandard,Istation,Iabsolu(cid:1) (23)
#### min       min   min  min
          ou` Istation =0 si la soci´et´e n’est pas une station-service.
            min
#### 5  Calcul Final de l’Impoˆt

        5.1 Impoˆt sur les Soci´et´es (Hors Redevance)

                                 IS =max(I   ,Ieffectif)                  (24)
#### theorique min
#### 5.2 Fonction d’Exon´eration

#### (cid:40)
#### 1 si la soci´et´e s est exon´er´ee
                              E(s)=                                       (25)
#### 0 sinon
#### 5.3 Impoˆt Final avec Exon´eration

                                  IS   =IS\times(1−E(s))                       (26)
#### final


                                          2





#### 5.4 Montant Total `a Payer


                                Montant =IS   +R                          (27)
#### total final ORTB
        6  Formules  Composites  et Cas Particuliers

#### 6.1 Formule G´en´erale Compl`ete



         IS   =max(BI\times\tau(T),max(PE\times\tau (S),V \times\tau    ,250000))
           final                 min   petrole station
#### \times(1−E(s)) (28)
        6.2 Condition d’Exon´eration Capital-Risque

#### (cid:40)
#### 1 si t\leq15 ans et p\geq0.50
                           E       (t,p)=                                 (29)
#### capital−risque
#### 0 sinon
          ou` t = dur´ee depuis cr´eation et p = pourcentage actions non cot´ees.
#### 7  Contraintes et Invariants
#### 7.1 Contrainte de Positivit´e


                                         BN \geq0                            (30)
                                         PE \geq0                            (31)
                                       IS  \geq0                             (32)
#### final
#### 7.2 Contrainte de Minimum


                                 IS   \geqIabsolu\times(1−E(s))                   (33)
#### final min
#### 7.3 Contrainte de Coh´erence

                   PE \geq|BN| (Les produits encaissables incluent la base de calcul du b´en´efice) (34)
















                                          3





#### 8  Algorithme  de Calcul

#### 8.1 Proc´edure Principale


                         Algorithme : CalculIS(BN,PE,RCM,T,S,V ,E)        (35)
#### petrole
                         D´ebut                                           (36)
                          BI \leftarrowBN −RCM \timesq                                  (37)
#### mobilier
                          I     \leftarrowBI\times\tau(T)                                  (38)
#### theorique
                          Istandard \leftarrowPE\times\tau (S)                             (39)
#### min        min
                          Istation \leftarrowV \times\tau                                  (40)
#### min    petrole station
                          Ieffectif \leftarrowmax(Istandard,Istation,Iabsolu)      (41)
#### min       min   min  min
                          IS \leftarrowmax(I    ,Ieffectif)                        (42)
#### theorique min
                          IS   \leftarrowIS\times(1−E)                                  (43)
#### final
                          Retourner IS +R                                 (44)
#### final ORTB
                         Fin                                              (45)
#### 9  Exemples  de Calcul
#### 9.1 Exemple 1 : Soci´et´e G´en´erale
          Donn´ees : BN =10,000,000, PE =50,000,000, T =g´en´eral, S =g´en´eral, E =0
                            I     =10,000,000\times0.30=3,000,000              (46)
#### theorique
                            Istandard =50,000,000\times0.01=500,000            (47)
                             min
                             Ieffectif =max(500,000,0,250,000)=500,000    (48)
                             min
                                IS =max(3,000,000,500,000)=3,000,000      (49)
                          Montant =3,000,000+4,000=3,004,000 FCFA         (50)
#### total
        9.2 Exemple 2 : Soci´et´e BTP avec Perte
          Donn´ees : BN =−2,000,000, PE =30,000,000, T =g´en´eral, S =BTP, E =0
                             I     =0 (perte)                             (51)
#### theorique
                             Istandard =30,000,000\times0.03=900,000           (52)
                              min
                             Ieffectif =max(900,000,0,250,000)=900,000    (53)
                              min
                                 IS =max(0,900,000)=900,000               (54)
                           Montant =900,000+4,000=904,000 FCFA            (55)
#### total






                                          4

---
*Converti automatiquement depuis PDF avec préservation des symboles mathématiques*