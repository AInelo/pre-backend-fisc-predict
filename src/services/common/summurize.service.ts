import { GlobalEstimationInfoData, ImpotConfig, ImpotDetailCalcule, InfosSupplementaires, ObligationEcheance, VariableEnter } from "@/types/frontend.result.return.type";

export class EstimationSummarizer {
    private readonly MAX_CHARACTERS = 2000;

    /**
     * Résume les données d'estimation fiscale pour le chatbot
     */
    public summarize(data: GlobalEstimationInfoData): string {
        const sections: string[] = [];

        // Section principale - Estimation totale
        sections.push(`💰 ESTIMATION TOTALE: ${data.totalEstimation} ${data.totalEstimationCurrency}`);
        
        if (data.contribuableRegime) {
            sections.push(`Régime: ${data.contribuableRegime}`);
        }

        // Variables d'entrée (les plus importantes)
        const variables = this.extractVariables(data.VariableEnter);
        if (variables.length > 0) {
            sections.push(`📊 DONNÉES SAISIES:\n${variables.slice(0, 3).join('\n')}`);
        }

        // Détails des impôts calculés
        const impots = this.extractImpotDetails(data.impotDetailCalcule);
        if (impots.length > 0) {
            sections.push(`🧮 IMPÔTS CALCULÉS:\n${impots.slice(0, 3).join('\n')}`);
        }

        // Échéances principales
        const echeances = this.extractObligations(data.obligationEcheance);
        if (echeances.length > 0) {
            sections.push(`📅 ÉCHÉANCES PRINCIPALES:\n${echeances.slice(0, 2).join('\n')}`);
        }

        // Infos supplémentaires importantes
        const infos = this.extractInfosSupplementaires(data.infosSupplementaires);
        if (infos.length > 0) {
            sections.push(`ℹ️ INFOS IMPORTANTES:\n${infos.slice(0, 2).join('\n')}`);
        }

        // Configuration impôt (si pertinente)
        const config = this.extractImpotConfig(data.impotConfig);
        if (config) {
            sections.push(`⚙️ ${config}`);
        }

        // Assemblage et troncature si nécessaire
        let result = sections.join('\n\n');
        
        if (result.length > this.MAX_CHARACTERS) {
            result = this.truncateToLimit(result);
        }

        return result;
    }

    private extractVariables(variables: VariableEnter[] | Record<string, VariableEnter[]>): string[] {
        const items: VariableEnter[] = Array.isArray(variables) 
            ? variables 
            : Object.values(variables).flat();

        return items.map(v => 
            `• ${v.label}: ${v.value} ${v.currency || ''}`
        ).filter(item => item.length < 80); // Évite les lignes trop longues
    }

    private extractImpotDetails(impots: ImpotDetailCalcule[] | Record<string, ImpotDetailCalcule[]>): string[] {
        const items: ImpotDetailCalcule[] = Array.isArray(impots) 
            ? impots 
            : Object.values(impots).flat();

        return items.map(imp => {
            const taux = imp.impotTaux ? ` (${imp.impotTaux})` : '';
            return `• ${imp.impotTitle}: ${imp.impotValue} ${imp.impotValueCurrency}${taux}`;
        });
    }

    private extractObligations(obligations: ObligationEcheance[] | Record<string, ObligationEcheance[]>): string[] {
        const items: ObligationEcheance[] = Array.isArray(obligations) 
            ? obligations 
            : Object.values(obligations).flat();

        const result: string[] = [];
        
        for (const obl of items) {
            const echeances = Array.isArray(obl.echeancePaiement) 
                ? obl.echeancePaiement 
                : [obl.echeancePaiement];
            
            for (const ech of echeances) {
                result.push(`• ${obl.impotTitle}: ${ech.echeancePeriodeLimite}`);
            }
        }
        
        return result;
    }

    private extractInfosSupplementaires(infos: InfosSupplementaires[] | Record<string, InfosSupplementaires[]>): string[] {
        const items: InfosSupplementaires[] = Array.isArray(infos) 
            ? infos 
            : Object.values(infos).flat();

        return items.map(info => {
            const description = Array.isArray(info.infosDescription) 
                ? info.infosDescription.join(', ') 
                : info.infosDescription;
            
            return `• ${info.infosTitle}: ${this.truncateText(description, 100)}`;
        });
    }

    private extractImpotConfig(config: ImpotConfig | Record<string, ImpotConfig>): string | null {
        const configObj = this.isImpotConfig(config) ? config : Object.values(config)[0];
        
        if (!configObj) return null;
        
        return `${configObj.impotTitle} - ${configObj.competentCenter}`;
    }

    private isImpotConfig(obj: any): obj is ImpotConfig {
        return obj && typeof obj.impotTitle === 'string';
    }

    private truncateText(text: string, maxLength: number): string {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    private truncateToLimit(text: string): string {
        if (text.length <= this.MAX_CHARACTERS) return text;
        
        const truncated = text.substring(0, this.MAX_CHARACTERS - 3);
        const lastNewline = truncated.lastIndexOf('\n');
        
        // Coupe à la dernière ligne complète si possible
        if (lastNewline > this.MAX_CHARACTERS * 0.8) {
            return truncated.substring(0, lastNewline) + '\n...';
        }
        
        return truncated + '...';
    }

    /**
     * Version alternative plus compacte pour des données très riches
     */
    public summarizeCompact(data: GlobalEstimationInfoData): string {
        const parts: string[] = [];
        
        parts.push(`💰 ${data.totalEstimation} ${data.totalEstimationCurrency}`);
        
        // Compter les éléments
        const variablesCount = this.countItems(data.VariableEnter);
        const impotsCount = this.countItems(data.impotDetailCalcule);
        const echeancesCount = this.countItems(data.obligationEcheance);
        
        if (variablesCount > 0) parts.push(`📊 ${variablesCount} variable(s)`);
        if (impotsCount > 0) parts.push(`🧮 ${impotsCount} impôt(s)`);
        if (echeancesCount > 0) parts.push(`📅 ${echeancesCount} échéance(s)`);
        
        // Première variable et premier impôt importants
        const firstVar = this.getFirstItem(data.VariableEnter);
        const firstImpot = this.getFirstItem(data.impotDetailCalcule);
        
        if (firstVar) parts.push(`Principale: ${firstVar.label} = ${firstVar.value}`);
        if (firstImpot) parts.push(`Impôt principal: ${firstImpot.impotTitle} = ${firstImpot.impotValue} ${firstImpot.impotValueCurrency}`);
        
        return parts.join(' | ');
    }

    private countItems(items: any[] | Record<string, any[]>): number {
        return Array.isArray(items) ? items.length : Object.values(items).flat().length;
    }

    private getFirstItem<T>(items: T[] | Record<string, T[]>): T | null {
        if (Array.isArray(items)) return items[0] || null;
        const values = Object.values(items).flat();
        return values[0] || null;
    }
}

