---
title: "TVA"
source: "data/modelisation_mathematique/REGIME_REEL/TVA.pdf"
converted_date: "2025-08-11 15:27:38"
math: true
mathjax: true
---

# TVA

> **Note**: Ce document contient des formules mathématiques. Pour un rendu optimal, utilisez un visualiseur Markdown compatible avec MathJax/KaTeX.

1   Formules de calcul TVA - R´epublique du B´enin

#### 1.1  Constantes du syst`eme


                           \tau    =0.18 (Taux TVA normal : 18%)   (1)
#### normal
                           \tau    =0 (Taux TVA pour produits exon´er´es) (2)
#### exone´re´
                         S      =50000000 FCFA (Seuil d’exon´eration CA) (3)
#### exone´ration
                            J   =10 (Jour limite de d´eclaration mensuelle) (4)
#### limite
                  1.2  D´etermination du statut d’assujettissement
#### (cid:40)
#### Vrai si CA  (E)\geqS
                          Assujetti(E)=     annuel  exone´ration (5)
#### Faux si CA  (E)<S
#### annuel  exone´ration
                     ou` E repr´esente l’entreprise et CA (E) son chiffre d’affaires annuel.
#### annuel
#### 1.3  D´etermination du taux applicable
#### (cid:40)
#### \tau    =0    si P \inE
#### \tau(P)= exone´re´                 (6)
#### \tau    =0.18 si P \in/ E
#### normal
                     ou` P est le produit/service et E l’ensemble des produits exon´er´es.
                  1.4  Calcul de la TVA sur une op´eration
                  Pour une op´eration donn´ee avec une base imposable B et un produit P :
                                  TVA      =B\times\tau(P)              (7)
#### ope´ration
                        Prix  =Prix +TVA      =Prix  \times(1+\tau(P))  (8)
#### TTC    HT     ope´ration HT
#### 1.5  Calcul mensuel de la TVA due
#### 1.5.1 TVA collect´ee (sur les ventes)
                                           n
#### (cid:88)
                                 TVA     =   B \times\tau(P )           (9)
#### collecte´e i  i
                                           i=1
                     ou` n est le nombre d’op´erations de vente du mois, B la base imposable de
                                                    i
                  l’op´eration i, et P le produit/service vendu.
                             i
                                          1















#### 1.5.2 TVA d´eductible (sur les achats)
                                          m
#### (cid:88)
                               TVA      =   B \times\tau(P )\times\delta         (10)
#### de´ductible j  j  j
                                         j=1
                     ou` :
                     \bullet m est le nombre d’achats du mois
                     \bullet B est la base imposable de l’achat j
                       j
                     \bullet P est le produit/service achet´e
                       j
                     \bullet \delta est l’indicateur de d´eductibilit´e :
                      j
#### (cid:40)
#### 1 si l’achat est d´eductible
                              \delta =                              (11)
                               j
#### 0 si l’achat n’est pas d´eductible
#### 1.5.3 TVA nette due
#### TVA  =TVA      −TVA              (12)
#### due    collecte´e de´ductible
#### n         m
#### (cid:88)  (cid:88)
                            TVA  =   B \times\tau(P )− B \times\tau(P )\times\delta      (13)
#### due    i   i     j    j  j
                                   i=1       j=1
#### 1.6  Gestion du cr´edit de TVA
                                     
#### TVA `a payer si TVA >0
####               due
                           Situation = Cr´edit de TVA si TVA <0 (14)
#### TVA                  due
#### Solde
#### nul   si TVA =0
                                                     due
                     En cas de cr´edit :
                              Cre´dit =|TVA | si TVA <0        (15)
#### TVA     due     due
#### 1.7  P´enalit´es pour retard
                  Si la d´eclaration est effectu´ee au jour J :
#### de´claration
#### Retard=max(0,J   −J   )         (16)
#### de´claration limite
#### (cid:40)
#### 0                     si Retard=0
                      Pe´nalite´=                              (17)
                              P  +P   \timesRetard\timesTVA   si Retard>0
#### base taux         due
                     ou` P est la p´enalit´e forfaitaire et P le taux de p´enalit´e journali`ere.
#### base                 taux
                                          2










#### 1.8  Formules pour cas particuliers
                  1.8.1 Op´erations mixtes (produits exon´er´es et taxables)

                  Pour une facture contenant k lignes :

                                        K
#### (cid:88)
                               TVA    =   B \times\tau(P )             (18)
#### facture  k   k
                                        k=1
                                        K
#### (cid:88)
#### Total =  B                    (19)
#### HT     k
                                        k=1
#### Total =Total +TVA              (20)
#### TTC     HT     facture
#### 1.8.2 Prorata de d´eduction
                  Si l’entreprise r´ealise `a la fois des op´erations taxables et exon´er´ees :
                                         CA
#### Prorata= taxable \times100        (21)
                                         CA
#### total
#### Prorata
                            TVA         =TVA      \times            (22)
#### de´ductibleajuste´e de´ductible 100
#### 1.9  Validation des contraintes
#### 1.9.1 Contrainte de territorialit´e
#### (cid:40)
#### Oui si Lieu(O)\inTerritoire B´enin
                         TVA     (O)=                          (23)
#### applicable
#### Non sinon
#### 1.9.2 Contrainte temporelle
                  Pour une p´eriode T (mois) :
                        D´eclaration obligatoire(T)=Assujetti(E)\\land\\exists op´eration en T (24)
#### 1.9.3 Contrainte de coh´erence
                            TVA     \geq0                         (25)
#### collecte´e
                           TVA      \geq0                         (26)
#### de´ductible
                              |TVA |\leqmax(TVA    ,TVA     )     (27)
#### due       collecte´e de´ductible
#### 1.10  Indicateurs de performance
#### 1.10.1 Taux effectif de TVA
                                        TVA
                                 \tau    =    collecte´e \times100     (28)
#### effectif CA
#### HT taxable
                                          3










#### 1.10.2 Coefficient de r´ecup´eration
                                          TVA
                              Coeff      =   de´ductible \times100  (29)
#### re´cupe´ration TVA
#### collecte´e






































                                          4

---
*Converti automatiquement depuis PDF avec préservation des symboles mathématiques*