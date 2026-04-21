---
title: "IRF"
source: "data/modelisation_mathematique/REGIME_REEL/IRF.pdf"
converted_date: "2025-08-11 15:27:36"
math: true
mathjax: true
---

# IRF

> **Note**: Ce document contient des formules mathématiques. Pour un rendu optimal, utilisez un visualiseur Markdown compatible avec MathJax/KaTeX.

#### 1   Constantes du Syst`eme


#### \tau   =0,12 (12%)               (1)
#### normal
#### \tau   =0,10 (10%)               (2)
#### reduit
#### R   =4000 FCFA                (3)
                                   ORTB
#### j    =10  (jour du mois)       (4)
#### echeance
#### 2   Variables du Syst`eme
#### L :Loyer brut mensuel (FCFA)      (5)
                               b
#### \tau :Taux d’imposition applicable  (6)
#### S :Statut fiscal du bailleur      (7)
                               b
#### I :Montant de la retenue fiscale (8)
                               r
                              L :Loyer net vers´e au propri´etaire (9)
                               n
#### t :Date de versement du loyer   (10)
                               v
                               t :Date d’´ech´eance du paiement fiscal (11)
                               e
#### 3   Fonction de D´etermination du Taux
#### (cid:40)
#### \tau   =0,10 si S \in{IBA,IS}
                           \tau =f(S )= reduit      b             (12)
                                b
#### \tau    =0,12 sinon
#### normal
                     Ou` :
                     \bullet IBA = Impˆot sur les B´en´efices d’Affaires
#### \bullet IS = Impˆot sur les Soci´et´es
#### 4   Calculs Fondamentaux
#### 4.1  Calcul de la Retenue Fiscale
#### I =L \times\tau                 (13)
#### r   b
#### 4.2  Calcul du Loyer Net
                                  L  =L −I =L (1−\tau)            (14)
#### n   b  r  b
#### 4.3  Formule Compacte
#### (cid:40)
#### 0,90 si S \in{IBA,IS}
                               L =L \times        b                 (15)
#### n   b
#### 0,88 sinon
                                          1











                                  ´
#### 5   Gestion des Ech´eances

#### 5.1  Loyer Mensuel Normal
                  Si le loyer est vers´e pendant le mois m :

#### t =jour j  du mois (m+1)       (16)
#### e     echeance
#### 5.2  Loyer Anticip´e

                  Si le loyer du mois m est vers´e au mois (m−k) avec k \geq1 :
#### t =jour j   du mois (m−k+1)      (17)
#### e     echeance
#### 6   Calculs Annuels

#### 6.1  Retenue Fiscale Annuelle

                  Pour n mois de location dans l’ann´ee :
                                           n
#### (cid:88)
                                   I     =  L  \times\tau              (18)
#### r,annual b,i i
                                          i=1
#### 6.2  Obligation Totale Annuelle
#### O   =I     +R                (19)
#### total r,annual ORTB
#### 7   Fonctions de Validation

#### 7.1  Fonction de Retard
#### (cid:40)
#### 0         si t   \leqt
                         Retard(t  ,t )=           paiement e  (20)
#### paiement e
                                        t     −t  si t   >t
#### paiement e paiement e
#### 7.2  Statut de Conformit´e
#### (cid:40)
#### Vrai si Retard(t ,t )=0
                           Conforme=           paiement e      (21)
#### Faux sinon
#### 8   Mod`ele Complet  de Transaction
                  Pour une transaction de location compl`ete :


                                          2

















#### Donn´ees d’entr´ee:{L ,S ,t }      (22)
#### b b v
#### \tau =f(S )                  (23)
                                          b
#### I =L \times\tau                   (24)
#### r   b
#### L =L −I                    (25)
#### n   b r
#### t =g(t ) (fonction d’´ech´eance) (26)
#### e   v
#### 8.1  Fonction d’E´ch´eance G´en´erale
#### (cid:40)
#### j    du mois suivant t  si loyer normal
                     g(t )= echeance       v                   (27)
                       v
                           j    du mois suivant le versement si loyer anticip´e
#### echeance
#### 9   Contraintes et Invariants
#### 9.1  Contraintes de Domaine
#### L >0                        (28)
                                    b
#### \tau \in{0,10;0,12}             (29)
                             1\leqj     \leq31                       (30)
#### echeance
                                   I =L \times\tau (invariant de calcul) (31)
                                    r  b
#### 9.2  Contrainte de Conservation
                                  L =L +I  \\forall transaction       (32)
#### b   n  r
#### 10   Cas d’Usage  Particuliers
                  10.1  Changement de Statut en Cours d’Ann´ee
                  Si le statut change au mois m :
                                    c
#### m (cid:88)c−1
#### (cid:88)
                                              12
                           I   =    L \times\tau    +   L  \times\tau          (33)
#### r,total  b,i ancien  b,i nouveau
                                 i=1         i=mc
#### 10.2  Loyer Variable
                  Pour des loyers variables dans l’ann´ee :
                                         12
#### (cid:88)
                                  I    =   L \times\tau(S )            (34)
#### r,annual  b,i  b,i
                                         i=1
                                          3











#### 11   M´etriques de Performance

#### 11.1  Taux Effectif de Taxation

                                         I
                                  \tau    =  r,annual \times100        (35)
#### effectif L
#### b,annual
                  11.2  Impact Financier sur le Propri´etaire
                                       I
#### Perte= r,annual =\tau           (36)
#### L       moyen
#### b,annual































                                          4

---
*Converti automatiquement depuis PDF avec préservation des symboles mathématiques*