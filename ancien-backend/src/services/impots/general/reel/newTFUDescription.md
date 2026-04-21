La modelisation sera faite par parcelle 
en input on aura 


interface TFUBatimentInfos {
    categorie: string;
    squareMeters: number;
}

interface TFUParcelleInfos {
    departement: string;
    commune: string;
    arrondissement: string;
    nbrBatiments : number;
    batiments : TFUBatimentInfos | TFUBatimentInfos[]
    nbrPiscines : number;
}


interface TFUInput {
    periodeFiscale: string;
    nbrParcelles : number;
    parcelles : TFUParcelleInfos | TFUParcelleInfos[]
}


Principe de Fonctionnement 

1- Le montant par piscine sur la parcelle est de 30 000 FCFA. TotalTFUPiscine = nbrPiscines * 30 000  

2- Sur la meme parcelle on peux avoir plusieurs Batiments. Le TotalTFUPacelles est le 
maximu ( SOMME [tfuactuelleCalculer par batiment], minimum du batiment le plus grand  )


Donc ici une propriete est egal a une parcelle 