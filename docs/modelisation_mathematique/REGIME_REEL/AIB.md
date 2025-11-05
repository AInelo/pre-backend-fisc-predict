---
title: "AIB"
source: "data/modelisation_mathematique/REGIME_REEL/AIB.pdf"
converted_date: "2025-08-11 15:27:35"
math: true
mathjax: true
---

# AIB

> **Note**: Ce document contient des formules mathématiques. Pour un rendu optimal, utilisez un visualiseur Markdown compatible avec MathJax/KaTeX.

Mod´elisation  Math´ematique     de l’Acompte    sur Impˆot

#### assis sur le B´en´efice (AIB)


#### Analyse Fiscale

#### 6 juin 2025



#### 1   Variables  et  Constantes

#### 1.1  Variables



                         M = Montant de la transaction (base imposable) (1)

                          T = Taux d’acompte applicable               (2)
                          A = Montant de l’acompte AIB                (3)
                      R    = Redevance ORTB (si applicable)           (4)
                       ORTB
                       M   = Montant total a` payer                   (5)
#### total
#### 1.2  Constantes



#### T = 1% = 0.01                    (6)
                                      1
#### T = 3% = 0.03                    (7)
                                      3
#### T = 5% = 0.05                    (8)
                                      5
#### R    = 4000 FCFA                    (9)
                                   ORTB
          2   Fonction   de D´etermination    du  Taux
            La fonction de d´etermination du taux est d´efinie comme :

                  T = f(TypeOperation,StatutImmatriculation,TypeB´en´eficiaire) (10)











                                         1







#### 2.1  D´efinition par cas



####        
#### Importation de marchandises
####        
              
               0.01 si ou (AchatCommercial\\landImmatricul´e)
              
                    ou (FournitureTravaux\\landB´en´eficiairePublic)
              
              
              
              
                0.03 si (PrestationService\\landImmatricul´e)
           T =                                                       (11)
              
####       
                       (AchatCommercial\\land\\negImmatricul´e)
####       
               0.05 si ou (FournitureTravaux\\landB´en´eficiairePublic\\land\\negImmatricul´e)
              
              
                     ou (PrestationService\\land\\negImmatricul´e)
#### 3   Calcul  de  l’Acompte    AIB
#### 3.1  Formule de base
                                     A = M \timesT                        (12)
#### 3.2  Avec condition d’exon´eration
#### (cid:40)
                     0      si Entreprise nouvelle\\landTPS\\landAnciennet´e \leq 12 mois
                 A =                                                 (13)
#### M \timesT   sinon
#### 4   Redevance    ORTB
#### 4.1  Condition d’application
#### (cid:40)
#### 4000 si mois de versement = Mars
                        R    =                                       (14)
                          ORTB
#### 0    sinon
#### 5   Montant    Total  `a Payer


#### M    = A+R                         (15)
#### total    ORTB
                       ´
#### 6   Date  d’Ech´eance

            Soit D la date de la transaction et D la date d’´ech´eance :
#### t                     e
                               D = 10 du mois suivant(D )            (16)
#### e                 t




                                         2







#### 7   Formules   Compl`etes


#### 7.1  Algorithme  complet de calcul



                    T = f(TypeOperation,StatutImmatriculation,TypeB´en´eficiaire) (17)
#### (cid:40)
#### 0     si exon´eration applicable
                    A =                                              (18)
#### M \timesT  sinon
#### (cid:40)
#### 4000 si mois = Mars
                 R    =                                              (19)
                  ORTB
#### 0    sinon
                 M    = A+R                                          (20)
#### total    ORTB
#### 7.2  Matrice de d´ecision pour le taux
                                                           
                         Op´eration  Immatricul´e B´en´eficiaire Taux
                        Importation  Oui/Non    Tous    1% 
                                                           
                     Achat Commercial  Oui      Tous    1% 
                                                           
                     Achat Commercial  Non      Tous    5% 
                                                                   (21)
                     Fourniture Travaux Oui/Non Public  1% 
                                                           
                     Fourniture Travaux Non     Public  5% 
                                                           
                      Prestation Service Oui    Tous    3% 
#### Prestation Service Non     Tous    5%
#### 8   Exemples    de Calcul
          8.1  Exemple  1 : Importation de marchandises
            Donn´ees :
            —  Montant de la transaction : M = 5000000 FCFA
            —  Type d’op´eration : Importation de marchandises
#### —  Mois : F´evrier 2025
            Calcul :
                          T = 0.01 (taux pour importation)           (22)
                          A = M \timesT = 5000000\times0.01 = 50000 FCFA       (23)
                       R    = 0 (mois Mars)                          (24)
                        ORTB
                        M   = A+R     = 50000+0 = 50000 FCFA         (25)
#### total    ORTB
          8.2  Exemple  2 : Prestation de service par entreprise non imma-
#### tricul´ee

            Donn´ees :
            —  Montant de la transaction : M = 2000000 FCFA
            —  Type d’op´eration : Prestation de service

#### —  Statut : Non immatricul´e a` l’IFU

                                         3








#### —  Mois : Mars 2025
            Calcul :
                      T = 0.05 (taux pour prestation service non immatricul´e) (26)

                      A = M \timesT = 2000000\times0.05 = 100000 FCFA          (27)
                   R    = 4000 (mois = Mars)                         (28)
                    ORTB
                   M    = A+R     = 100000+4000 = 104000 FCFA        (29)
#### total    ORTB
          8.3  Exemple  3 : Entreprise nouvelle exon´er´ee

            Donn´ees :
            —  Montant de la transaction : M = 1500000 FCFA
#### —  Type d’op´eration : Achat commercial
#### —  Statut : Immatricul´e a` l’IFU
            —  Entreprise nouvelle : Oui (8 mois d’activit´e)
#### —  Rel`eve de la TPS : Oui
#### —  Mois : Janvier 2025

            Calcul :
                           T = 0.01 (taux normal pour achat commercial immatricul´e)
                                                                     (30)

           Condition d’exon´eration : Entreprise nouvelle\\landTPS\\landAnciennet´e \leq 12 mois (31)
                             = Vrai\\landVrai\\landVrai = Vrai                 (32)

                           A = 0 (exon´eration applicable)           (33)
                        R    = 0 (mois Mars)                         (34)
                         ORTB
                        M    = A+R     = 0+0 = 0 FCFA                (35)
#### total    ORTB
                                                     ´
          8.4  Exemple  4 : Fourniture de travaux `a l’Etat
            Donn´ees :
            —  Montant de la transaction : M = 10000000 FCFA
            —  Type d’op´eration : Fourniture de travaux
                        ´
            —  B´en´eficiaire : Etat (collectivit´e publique)
#### —  Statut : Immatricul´e a` l’IFU
#### —  Mois : Mars 2025
            Calcul :
                     T = 0.01 (taux pour fourniture travaux a` b´en´eficiaire public) (36)
                     A = M \timesT = 10000000\times0.01 = 100000 FCFA          (37)

                 R    = 4000 (mois = Mars)                           (38)
                  ORTB
                  M   = A+R     = 100000+4000 = 104000 FCFA          (39)
#### total    ORTB
          9   Tableau   R´ecapitulatif  des Exemples

#### 10   Algorithme    de  Calcul  Complet


            Calculdel’AIB Entr´ees:M,TypeOperation,StatutImmatriculation,TypeB´en´eficiaire,

                                         4








           Exemple Montant (FCFA)  Taux AIB (FCFA)  ORTB  (FCFA)  Total (FCFA)
              1        5000000      1%     50000          0           50000
              2        2000000      5%     100000        4000        104000
              3        1500000      0%       0            0            0
              4        10000000     1%     100000        4000        104000

                        Table 1 – R´ecapitulatif des calculs d’exemples


          Mois,EstNouvelleEntreprise,Rel`eveTPS,Anciennet´eSortie :M //D´eterminationdu
#### total
          taux TypeOperation = ”Importation” T \leftarrow 0.01 TypeOperation = ”AchatCommercial”
          AND StatutImmatriculation = ”Oui” T \leftarrow 0.01 TypeOperation = ”FournitureTravaux”
          AND TypeB´en´eficiaire = ”Public” T \leftarrow 0.01 TypeOperation = ”PrestationService” AND
          StatutImmatriculation = ”Oui” T \leftarrow 0.03 T \leftarrow 0.05 // V´erification exon´eration EstNou-
          velleEntreprise AND Rel`eveTPS AND Anciennet´e \leq 12 A \leftarrow 0 A \leftarrow M\timesT // Redevance
          ORTB Mois = ”Mars” R \leftarrow  4000 R  \leftarrow  0 M  \leftarrow A+R      return M
                            ORTB       ORTB    total     ORTB       total





































                                         5

---
*Converti automatiquement depuis PDF avec préservation des symboles mathématiques*