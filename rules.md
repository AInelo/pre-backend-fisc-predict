je veux creer une api pour la gestion des fichier avec TypeScript simple en MVC sans trop de complication et sans base de donnee. on y garder une secret key [secret-key = urmaphabucket]  
etle serveur TypeScript va creer sur la machine un folder nommer "folderBaseName=urmapha-bucket" et userName=admin dans le /home/userName qui va ontenir les fichiers


donc je veux les routes 
POST ----> /upload-file qui prend en request body json
{
    file : Blob ou File
    secret_key : string
    folder_name? : string (si elle n'existe pas, le folder_name=general)
}

POST ----> /upload-files qui prend en request body json
{
    file : Blob[] ou File[]
    secret_key : string
    folder_name? : string (si elle n'existe pas, le folder_name=general)
}

GET ---->  /find-file?filename=?foldermame?secret_key=
qui permet de telecharger un fichier 

GET -----> /find-files?foldername= ?secret_key=
qui permet de telecharger tout les fichuiers d'un dossier 