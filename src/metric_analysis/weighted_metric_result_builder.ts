import { DocumentationAnalysisMetric } from "./documentation_analysis_metric";
import { MetricResult } from "./metric_result";
import { MetricResultBuilder } from "./metric_result_builder";

export class WeightedMetricResultBuilder extends MetricResultBuilder{
    private weightLambda:{(creator:DocumentationAnalysisMetric|MetricResultBuilder):number};
    constructor(weightLambda:{(creator:DocumentationAnalysisMetric|MetricResultBuilder):number}){
        super();
        this.weightLambda=weightLambda;
    }
    override getAggregatedResult():MetricResult{
        let resultSum=0;
        let weightSum=0;
        let allLogMessages=[];
       for(let partialResult of this.resultList){
            let weight=this.weightLambda(partialResult.getCreator());
            resultSum+=(partialResult.getResult()*weight);
            weightSum+=weight;
            for(let log of partialResult.getLogMessages()){
                allLogMessages.push(log);
            }
            
       }
       if(weightSum==0)weightSum=1;
       return new MetricResult(resultSum/weightSum,allLogMessages,this.creator!!); 
    }
}