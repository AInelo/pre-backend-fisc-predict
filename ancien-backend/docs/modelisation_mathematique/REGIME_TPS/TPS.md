---
title: "TPS"
source: "data/modelisation_mathematique/REGIME_TPS/TPS.pdf"
converted_date: "2025-08-11 15:27:39"
math: true
mathjax: true
---

# TPS

> **Note**: Ce document contient des formules mathématiques. Pour un rendu optimal, utilisez un visualiseur Markdown compatible avec MathJax/KaTeX.

Fiscalit´e B´enin                                         Dona Hkp

                Formules        fiscales     —    TPS      B´enin





#### 1   Formule   principale   de la TPS


                      TPS = max(0,05\timesChiffreAffairesAnnuel, 10 000 FCFA)

            La TPS est ´egale `a 5% du chiffre d’affaires annuel, avec un minimum forfaitaire de 10
## 000 Fcfa.


          2   Formule   compl`ete  avec  redevance    audiovisuelle


#### TPS Totale = TPS+4 000

            Une redevance de 4 000 FCFA est ajout´ee au montant de la TPS, pour la soci´et´e nationale
          de radiodiffusion et t´el´evision.


#### 3   Acomptes    provisionnels


#### Acompte = Acompte = 0,5\timesTPS
#### 1         2         ann´eepr´ec´edente
            Deux acomptes´egaux sont dus au plus tard le 10 f´evrier et le 10 juin, sauf pour la premi`ere
          ann´ee d’activit´e.

#### 4   Solde  `a payer



#### Solde = TPS      −(Acompte +Acompte )
#### ann´eeencours    1        2
            Solde `a verser au plus tard le 30 avril de l’ann´ee suivante.

          5   TPS   imputable   en  cas de  passage   au r´egime  r´eel



                           ´
               TPS imputable Etat = 0,5\timesTPS et TPS imputable Locaux = 0,5\timesTPS
                                                                 ´
            La TPS acquitt´ee devient un acompte r´eparti `a parts ´egales entre impˆots d’Etat et impˆots
          locaux.



                                          1





          Fiscalit´e B´enin                                         Dona Hkp


          6   Amende    pour   paiement   en  esp`eces ¿ 100  000  FCFA


                         Amende Esp`eces = 0,05\timesMontant non conforme

            Tout paiement sup´erieur ou ´egal `a 100 000 FCFA doit ˆetre fait par voie bancaire.

          7   Amende    pour   non-pr´esentation   de  comptabilit´e



                      Amende Comptabilit´e = 1 000 000\timesNombre d’exercices
            Sanction de 1 000 000 FCFA par exercice pour non-pr´esentation des documents comp-

          tables.

#### 8   Exemple    pratique


#### Donn´ees

#### ▷ Chiffre d’affaires : 45 000 000 FCFA
            ▷ TPS ann´ee pr´ec´edente : 2 250 000 FCFA

#### Calculs


                          TPS = 0,05\times45 000 000 = 2 250 000 FCFA

                        TPS Totale = 2 250 000+4 000 = 2 254 000 FCFA
#### Acompte = Acompte = 1 125 000 FCFA
#### 1        2
                       Solde = 2 250 000−(1 125 000+1 125 000) = 0 FCFA


















                                          2





          Fiscalit´e B´enin                                         Dona Hkp

#### Sp´ecification        technique



          1. Champs    `a afficher (Inputs  frontend)


           Champ                Type          Description
           chiffre affaires     Nombre        Chiffre d’affaires annuel en FCFA
           est personne physique Bool´een     Si l’utilisateur est une personne
#### physique

           est entreprise individuellBeool´een Si l’entreprise est individuelle
           annee creation       Nombre        Ann´ee de cr´eation de l’entreprise
#### (format AAAA)
           annee courante       Nombre        Ann´ee en cours pour les calculs



#### 2. Formule   de  calcul


#### (cid:18)                 (cid:19)
                                 5
                      TPS = max    \timeschiffre affaires, 10000 +4000
                                100
            Ou` :
           —   5 \timeschiffre affaires : TPS de base `a 5%
              100
#### —  10000 FCFA : montant minimum l´egal
           —  4000FCFA:redevanceper¸cueauprofitdelaRadiodiffusionT´el´evisionduB´enin(RTB)



#### 3. Conditions   (ifClauses)

           —  Condition 1 :

                        chiffre affaires > 50000000 \Rightarrow Passage au r´egime r´eel

              Action : Afficher une alerte et informer que la TPS devient un acompte r´eparti :
#### — 50% imputable sur les impoˆts locaux
                                        ´
#### — 50% imputable sur les impoˆts d’Etat
           —  Condition 2 :

                           TPS calcule´e < 10000 \Rightarrow TPS calcule´e = 10000

           —  Condition 3 :

              annee creation = annee courante \Rightarrow Dispense d’acomptes pour la premi`ere ann´ee

                                          3





          Fiscalit´e B´enin                                         Dona Hkp


           —  Sinon (cas g´en´eral) :
#### TPS pre´c´edente
                       Acomptes =             (a` verser en f´evrier et juin)
                                      2
           —  Condition 4 : TPS toujours major´ee de la redevance RTB

#### Montant final = TPS calcul´ee+4000




          4. Changements     ou  actions  d´eclench´es



            Condition                        Action ou Cons´equence
            chiffre affaires > 50000000      Bascule vers r´egime r´eel; message ex-
#### plicatif sur les nouvelles obligations
            TPS calcul´ee < 10000            Appliquer plancher minimum l´egal
            Nouvelle entreprise              Dispense d’acomptes la premi`ere ann´ee
            Calcul TPS                       Ajouter automatiquement 4000 FCFA
#### pour la redevance RTB

            Demande de changement de r´egime V´erifier la date du d´epassement et ap-
#### pliquer le changement au 1er jour du
#### mois suivant

























                                          4

---
*Converti automatiquement depuis PDF avec préservation des symboles mathématiques*