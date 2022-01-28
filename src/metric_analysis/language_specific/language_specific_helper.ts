import { Component } from "../../parser/parse_result/component";
import { LogMessage } from "../log_message";
/**
 * This interface helps metric to deal with language specific stuff
 * For instance, don't check overriden methods or check additional tags
 */
export class LanguageSpecificHelper{
    /**
     * checks whether the documentation is complete by checking additional tags
     * @param component any component
     * @param results all numeric results will be pushed there
     * @param logMessages all log messages will be pushed there
     */
    rateDocumentationCompatibility(component: Component,results:number[],logMessages: LogMessage[]):void{
        
    } 
    /**
     * Check whether the component should be analyzed
     * For instance, return false if the component is overriden
     * @param component a component to check
     */
    shallConsider(component:Component):boolean{
        return true;
    }
    /**
     *  finds special elements of the documentation languages
     * examples would be {@ link }} (without stapces" in java
     * @param text the text to search
     */
    findSpecialElements(text:string):string[]{
        return [];
    }
    /**
     * determines qwhether a tag is valid
     * @param tag a tag name
     * @returns true if the tag is valid
     */
    isValidTag(tag:string):boolean{
        return true;
    }
}