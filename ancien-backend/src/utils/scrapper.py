import pandas as pd
import numpy as np
import json
from typing import Dict, List, Any

def clean_and_extract_tariff_data(file_path: str) -> Dict[str, Any]:
    """
    Extrait et structure les données de la grille tarifaire en format JSON
    """
    
    # Lecture du fichier Excel
    data_raw = pd.read_excel(file_path)
    
    print("Analyse de la structure du fichier...")
    print("Ligne 0:", data_raw.iloc[0].tolist())
    print("Ligne 1:", data_raw.iloc[1].tolist())
    print("Ligne 2:", data_raw.iloc[2].tolist())
    
    # Structure pour stocker les données
    structured_data = {
        "metadata": {
            "source_file": file_path,
            "description": "Grille tarifaire révisée 2025",
            "categories": []
        },
        "departements": []
    }
    
    # Analyse des colonnes - basé sur votre exemple
    # Les colonnes semblent être : DEPARTEMENTS, COMMUNES, Arrondissements, puis les catégories
    columns = data_raw.columns.tolist()
    print("Colonnes détectées:", columns)
    
    # Identification des catégories de bâtiments à partir de la ligne 0
    row_0 = data_raw.iloc[0].fillna('').astype(str)
    row_1 = data_raw.iloc[1].fillna('').astype(str)
    
    category_info = []
    i = 3  # Commence après DEPARTEMENTS, COMMUNES, Arrondissements
    
    while i < len(row_1):
        if i < len(row_0) and "Bâtiments" in str(row_0.iloc[i]):
            # Catégorie trouvée
            cat_name = str(row_0.iloc[i])
            cat_description = str(row_1.iloc[i]) if i < len(row_1) else ""
            
            category_info.append({
                "id": f"Categorie_{len(category_info)+1:02d}",
                "name": cat_name,
                "description": cat_description,
                "tfu_m2_col": i,
                "tfu_min_col": i + 1
            })
            i += 2  # Passe aux colonnes TFU au m² et TFU Minimum
        else:
            i += 1
    
    # Si pas de catégories trouvées, utilise une approche par index de colonne
    if not category_info:
        print("Méthode alternative: analyse par position de colonnes...")
        # Basé sur votre exemple, les catégories commencent à la colonne 3
        # et il y a des paires de colonnes (TFU au m², TFU Minimum)
        col_names = [
            "Bâtiments à toiture tôle et assimilés - Rez-de-chaussée",
            "Bâtiments à toiture tôle - Rez-de-chaussée et 1 ou 2 niveaux", 
            "Bâtiments à toiture tôle - Rez-de-chaussée et 3 ou 4 niveaux",
            "Bâtiments à toiture tôle - Rez-de-chaussée et 5 niveaux ou plus"
        ]
        
        for idx, cat_name in enumerate(col_names):
            category_info.append({
                "id": f"Categorie_{idx+1:02d}",
                "name": cat_name,
                "description": f"Catégorie {idx+1}",
                "tfu_m2_col": 3 + (idx * 2),
                "tfu_min_col": 4 + (idx * 2)
            })
    
    structured_data["metadata"]["categories"] = category_info
    print(f"Catégories identifiées: {len(category_info)}")
    
    # Traitement des données par ligne (à partir de la ligne 2)
    current_departement = None
    current_commune = None
    
    for idx, row in data_raw.iloc[2:].iterrows():
        row_data = row.fillna('').astype(str).tolist()
        
        # Extraction des informations géographiques
        departement = row_data[0] if row_data[0] != 'nan' and row_data[0] != '' else current_departement
        commune = row_data[1] if row_data[1] != 'nan' and row_data[1] != '' else current_commune
        arrondissement = row_data[2] if row_data[2] != 'nan' and row_data[2] != '' else ''
        
        # Mise à jour des variables courantes
        if departement and departement != 'nan':
            current_departement = departement
        if commune and commune != 'nan':
            current_commune = commune
            
        # Skip si pas de données géographiques valides
        if not current_departement or not current_commune:
            continue
            
        print(f"Traitement: {current_departement} > {current_commune} > {arrondissement}")
        print(f"Données ligne: {row_data[:10]}...")  # Affiche les 10 premières colonnes
            
        # Recherche ou création du département
        dept_found = False
        for dept in structured_data["departements"]:
            if dept["nom"] == current_departement:
                dept_found = True
                # Recherche ou création de la commune
                commune_found = False
                for comm in dept["communes"]:
                    if comm["nom"] == current_commune:
                        commune_found = True
                        # Ajout de l'arrondissement
                        arrond_data = {
                            "nom": arrondissement if arrondissement else f"Zone {len(comm['arrondissements']) + 1}",
                            "tarifs": {}
                        }
                        
                        # Extraction des tarifs par catégorie
                        for cat in category_info:
                            tfu_m2_col = cat["tfu_m2_col"]
                            tfu_min_col = cat["tfu_min_col"]
                            
                            if tfu_m2_col < len(row_data) and tfu_min_col < len(row_data):
                                tfu_m2 = str(row_data[tfu_m2_col]) if tfu_m2_col < len(row_data) else '0'
                                tfu_min = str(row_data[tfu_min_col]) if tfu_min_col < len(row_data) else '0'
                                
                                # Nettoyage et conversion des valeurs numériques
                                try:
                                    # Nettoie les valeurs (supprime 'nan', espaces, etc.)
                                    tfu_m2 = tfu_m2.replace('nan', '0').strip()
                                    tfu_min = tfu_min.replace('nan', '0').strip()
                                    
                                    tfu_m2_val = float(tfu_m2) if tfu_m2 and tfu_m2 != '0' else 0
                                    tfu_min_val = float(tfu_min) if tfu_min and tfu_min != '0' else 0
                                except (ValueError, TypeError):
                                    tfu_m2_val = 0
                                    tfu_min_val = 0
                                
                                arrond_data["tarifs"][cat["id"]] = {
                                    "nom_categorie": cat["name"],
                                    "description": cat["description"],
                                    "tfu_par_m2": tfu_m2_val,
                                    "tfu_minimum": tfu_min_val
                                }
                                
                                print(f"  -> {cat['id']}: TFU_m2={tfu_m2_val}, TFU_min={tfu_min_val}")
                        
                        comm["arrondissements"].append(arrond_data)
                        break
                
                if not commune_found:
                    # Création d'une nouvelle commune
                    new_commune = {
                        "nom": current_commune,
                        "arrondissements": []
                    }
                    
                    # Ajout de l'arrondissement
                    arrond_data = {
                        "nom": arrondissement if arrondissement else "Zone principale",
                        "tarifs": {}
                    }
                    
                    # Extraction des tarifs par catégorie
                    for cat in category_info:
                        tfu_m2_col = cat["tfu_m2_col"]
                        tfu_min_col = cat["tfu_min_col"]
                        
                        if tfu_m2_col < len(row_data) and tfu_min_col < len(row_data):
                            tfu_m2 = str(row_data[tfu_m2_col]) if tfu_m2_col < len(row_data) else '0'
                            tfu_min = str(row_data[tfu_min_col]) if tfu_min_col < len(row_data) else '0'
                            
                            try:
                                tfu_m2 = tfu_m2.replace('nan', '0').strip()
                                tfu_min = tfu_min.replace('nan', '0').strip()
                                
                                tfu_m2_val = float(tfu_m2) if tfu_m2 and tfu_m2 != '0' else 0
                                tfu_min_val = float(tfu_min) if tfu_min and tfu_min != '0' else 0
                            except (ValueError, TypeError):
                                tfu_m2_val = 0
                                tfu_min_val = 0
                            
                            arrond_data["tarifs"][cat["id"]] = {
                                "nom_categorie": cat["name"],
                                "description": cat["description"],
                                "tfu_par_m2": tfu_m2_val,
                                "tfu_minimum": tfu_min_val
                            }
                    
                    new_commune["arrondissements"].append(arrond_data)
                    dept["communes"].append(new_commune)
                break
        
        if not dept_found and current_departement:
            # Création d'un nouveau département
            new_dept = {
                "nom": current_departement,
                "communes": []
            }
            
            # Création de la commune
            new_commune = {
                "nom": current_commune,
                "arrondissements": []
            }
            
            # Ajout de l'arrondissement
            arrond_data = {
                "nom": arrondissement if arrondissement else "Zone principale",
                "tarifs": {}
            }
            
            # Extraction des tarifs
            for cat in category_info:
                tfu_m2_col = cat["tfu_m2_col"]
                tfu_min_col = cat["tfu_min_col"]
                
                if tfu_m2_col < len(row_data) and tfu_min_col < len(row_data):
                    tfu_m2 = str(row_data[tfu_m2_col]) if tfu_m2_col < len(row_data) else '0'
                    tfu_min = str(row_data[tfu_min_col]) if tfu_min_col < len(row_data) else '0'
                    
                    try:
                        tfu_m2 = tfu_m2.replace('nan', '0').strip()
                        tfu_min = tfu_min.replace('nan', '0').strip()
                        
                        tfu_m2_val = float(tfu_m2) if tfu_m2 and tfu_m2 != '0' else 0
                        tfu_min_val = float(tfu_min) if tfu_min and tfu_min != '0' else 0
                    except (ValueError, TypeError):
                        tfu_m2_val = 0
                        tfu_min_val = 0
                    
                    arrond_data["tarifs"][cat["id"]] = {
                        "nom_categorie": cat["name"],
                        "description": cat["description"],
                        "tfu_par_m2": tfu_m2_val,
                        "tfu_minimum": tfu_min_val
                    }
            
            new_commune["arrondissements"].append(arrond_data)
            new_dept["communes"].append(new_commune)
            structured_data["departements"].append(new_dept)
    
    return structured_data

def save_to_json(data: Dict[str, Any], output_file: str = "grille_tarifaire_2025.json"):
    """
    Sauvegarde les données structurées en format JSON
    """
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Données sauvegardées dans {output_file}")
    return output_file

def main():
    """
    Fonction principale pour traiter le fichier Excel
    """
    input_file = "grille_revisee_2025_light.xlsx"
    
    try:
        # Extraction des données
        print("Extraction des données en cours...")
        structured_data = clean_and_extract_tariff_data(input_file)
        
        # Affichage des statistiques
        total_depts = len(structured_data["departements"])
        total_communes = sum(len(dept["communes"]) for dept in structured_data["departements"])
        total_arrondissements = sum(
            len(commune["arrondissements"]) 
            for dept in structured_data["departements"] 
            for commune in dept["communes"]
        )
        
        print(f"\n=== STATISTIQUES ===")
        print(f"Départements traités: {total_depts}")
        print(f"Communes traitées: {total_communes}")
        print(f"Arrondissements traités: {total_arrondissements}")
        print(f"Catégories de bâtiments: {len(structured_data['metadata']['categories'])}")
        
        # Sauvegarde en JSON
        output_file = save_to_json(structured_data)
        
        # Affichage d'un aperçu
        print(f"\n=== APERÇU DES DONNÉES ===")
        if structured_data["departements"]:
            premier_dept = structured_data["departements"][0]
            print(f"Premier département: {premier_dept['nom']}")
            if premier_dept["communes"]:
                premiere_commune = premier_dept["communes"][0]
                print(f"Première commune: {premiere_commune['nom']}")
                if premiere_commune["arrondissements"]:
                    premier_arrond = premiere_commune["arrondissements"][0]
                    print(f"Premier arrondissement: {premier_arrond['nom']}")
                    print(f"Nombre de catégories tarifaires: {len(premier_arrond['tarifs'])}")
        
        return structured_data
        
    except Exception as e:
        print(f"Erreur lors du traitement: {str(e)}")
        return None

# Exécution du script
if __name__ == "__main__":
    result = main()