import exp from "constants";
import { stringify } from "querystring";
import { EvaluatorConf } from "../../src/conf/EvaluatorConf";
import { CommentedLinesRatioMetric } from "../../src/metric_analysis/metrics/commented_lines_ratio_metric";
import { DocumentationAnalysisMetric } from "../../src/metric_analysis/metrics/documentation_analysis_metric";
import { FileAnalyzer } from "../../src/metric_analysis/file_analyzer";
import { IgnoreGetterSetterMetric } from "../../src/metric_analysis/metrics/ignore_getters_setter_metric";
import { MedianResultBuilder } from "../../src/metric_analysis/median_result_builder";
import { MetricManager } from "../../src/metric_analysis/metric_manager";
import { MetricResult } from "../../src/metric_analysis/metric_result";
import { MetricResultBuilder } from "../../src/metric_analysis/metric_result_builder";
import { SimpleCommentPresentMetric } from "../../src/metric_analysis/metrics/simple_comment_present_metric";
import { SimpleLargeMethodCommentedMetric } from "../../src/metric_analysis/metrics/simple_large_method_commented_metric";
import { SimpleMethodDocumentationMetric } from "../../src/metric_analysis/metrics/simple_method_documentation_metric";
import { SimplePublicMembersOnlyMetric } from "../../src/metric_analysis/metrics/simple_public_members_only_metric";
import { WeightedMedianResultBuilder } from "../../src/metric_analysis/weighted_median_result_builder";
import { WeightedMetricResultBuilder } from "../../src/metric_analysis/weighted_metric_result_builder";
import { JavaParser } from "../../src/parser/java_parser";
import { HierarchicalComponent } from "../../src/parser/parse_result/hierarchical_component";
import { MethodComponent } from "../../src/parser/parse_result/method_component";
import { PathWeightResolver, SimpleWeightResolver } from "../../src/metric_analysis/weight_resolver";
import { LanguageSpecificHelperFactory } from "../../src/metric_analysis/language_specific/language_specific_helper_factory";
const path = "testDir/commented_class.java";
function getCommentedClassRoot(): HierarchicalComponent {
    let parser = new JavaParser();

    let root = parser.parse(path);
    return root;
}

beforeAll(()=>{
    MetricManager.getAllImplementedMetricNames();
    DocumentationAnalysisMetric.languageHelper=LanguageSpecificHelperFactory.loadHelper("java");

});
test("test simple present metric on commented class", () => {
    let root = getCommentedClassRoot();
    let analyzer = new FileAnalyzer();
    let resultBuilder = new MetricResultBuilder();
    analyzer.analyze({ root, path }, MetricManager.createMetricByType(SimpleCommentPresentMetric,"simple_comment_test",undefined), resultBuilder);
    const expectedResult = (3 / 11) * 100;
    expect(resultBuilder.getAggregatedResult("").getResult()).toBeCloseTo(expectedResult, 5)
});
test("test public only metric on commented class", () => {
    let root = getCommentedClassRoot();
    let resultBuilder = new MetricResultBuilder();
    let analyzer = new FileAnalyzer();
    analyzer.analyze({ root, path }, MetricManager.createMetricByType(SimplePublicMembersOnlyMetric,"public_only_test",undefined), resultBuilder);
    const expectedResult = (2 / 6) * 100;
    expect(resultBuilder.getAggregatedResult("").getResult()).toBeCloseTo(expectedResult, 5)
});
test("test longer uncommented method", () => {
    let parser = new JavaParser();
    const path = "testDir/LargeMethodTest.java";
    let root = parser.parse(path);
    let builder = new MetricResultBuilder();
    let analyzer = new FileAnalyzer();
    let conf = { ignore_lines: ["", "{", "}"],k:0.2 }
    analyzer.analyze({ root, path }, MetricManager.createMetricByType(SimpleLargeMethodCommentedMetric,"large_method_test",conf), builder);
    let result = builder.getAggregatedResult("");



    const shortCommentedMethodResult = 100;
    const shortUncommentedResult = 98.1873075307798;
    const longCommentedMethodResult = 100;
    const longUncommentedResult = 9.97228425261005;
    ;

    const expectedResult = (shortCommentedMethodResult + shortUncommentedResult + longCommentedMethodResult + longUncommentedResult) / 4;

    expect(result.getResult()).toBeCloseTo(expectedResult);


});
test("test commented ratio metric", () => {
    let parser = new JavaParser();
    const path = "testDir/LargeMethodTest.java";
    let root = parser.parse(path);
    let builder = new MetricResultBuilder();
    let analyzer = new FileAnalyzer();
    let conf = { ignore_lines: ["", "{", "}"] }
    analyzer.analyze({ root, path }, MetricManager.createMetricByType(CommentedLinesRatioMetric,"comment_line_ratio_test",conf), builder);
    let result = builder.getAggregatedResult("");
    expect(result.getResult()).toBe(50);
});
test("test median builder", () => {
    let oddCountArray = [7, 3, 6, 2, 1, 4, 2, 8, 10, 15, 19]
    let evenCountArray = [4, 80, 14, 12, 98, 36, 23, 101, 0, -1, 17, 5]

    expect(oddCountArray.length % 2 == 1).toBeTruthy();
    expect(evenCountArray.length % 2 == 0).toBeTruthy();
    
    let medianBuilder = new MedianResultBuilder();
    for (let odd of oddCountArray) {
        medianBuilder.processResult(new MetricResult(odd, [], "simple_comment_median"))
    }
    let result = medianBuilder.getAggregatedResult("");
    let expectedResult = 6;
    expect(result.getResult()).toBe(expectedResult)


    medianBuilder = new MedianResultBuilder();
    for (let even of evenCountArray) {
        medianBuilder.processResult(new MetricResult(even, [], "simple_comment_median"))
    }
    result = medianBuilder.getAggregatedResult("");
    expectedResult = 15.5;
    expect(result.getResult()).toBe(expectedResult)



});
test("weighted median builder", () => {
    let oddCountArray = [7, 3, 6, 2, 1, 4, 2, 8, 10, 15, 19]
    let evenCountArray = [4, 80, 14, 12, 98, 36, 23, 101, 0, -1, 17, 5]

    expect(oddCountArray.length % 2 == 1).toBeTruthy();
    expect(evenCountArray.length % 2 == 0).toBeTruthy();
    let simple_metric = MetricManager.createMetricByType(SimpleCommentPresentMetric,"simple_comment_w_median",undefined)
    let public_members = MetricManager.createMetricByType(SimplePublicMembersOnlyMetric,"simple_public_w_median",undefined)
    let map=new Map<any,number>();
    map.set("simple_comment_w_median",2);
    map.set("simple_public_w_median",5);
    
    let medianBuilder = new WeightedMedianResultBuilder(new SimpleWeightResolver(map))
    for (let number of oddCountArray) {
        medianBuilder.processResult(new MetricResult(number, [], number % 2 == 0 ? "simple_comment_w_median" : "simple_public_w_median"))
    }
    let result = medianBuilder.getAggregatedResult("");
    let expectedResult = 3;
    expect(result.getResult()).toBe(expectedResult)



})
test("test method documentation compatible", () => {
    let parser = new JavaParser();
    const path = "testDir/CommentClass.java";
    let root = parser.parse(path);

    let builder = new MetricResultBuilder();
    let analyzer = new FileAnalyzer();
    let conf = undefined;
    analyzer.analyze({ root, path }, MetricManager.createMetricByType(SimpleMethodDocumentationMetric,"doc_complete",conf), builder);
    let result = builder.getAggregatedResult("");

    const expected = 63.8888888;
    expect(result.getResult()).toBeCloseTo(expected);

});
test("weighted result builder", () => {
    let weightMap: Map<any, number> = new Map<any, number>();
    const simple_comment=MetricManager.createMetricByType(SimpleCommentPresentMetric,"simple_comment_weighted",undefined);
    const public_members=MetricManager.createMetricByType(SimplePublicMembersOnlyMetric,"simple_public_weighted",undefined);

    weightMap.set("simple_comment_weighted", 1);
    weightMap.set("simple_public_weighted", 3);

    let parser = new JavaParser();
    const path = "testDir/commented_class.java";
    let root = parser.parse(path);
   
    let builder = new WeightedMetricResultBuilder(new SimpleWeightResolver(weightMap));

    let firstBuilder = new MetricResultBuilder();
    let analyzer = new FileAnalyzer();
    analyzer.analyze({ root, path }, simple_comment, firstBuilder);
    const simpleCommentExpectedResult = (3 / 11) * 100;
    let simpleCommentResult = firstBuilder.getAggregatedResult("simple_comment_weighted");

    let secondBuilder = new MetricResultBuilder();

    analyzer.analyze({ root, path }, public_members, secondBuilder);
    let publicMembersOnlyResult = secondBuilder.getAggregatedResult("simple_public_weighted");

    const publicMembersExpectedOnlyResult = (2 / 6) * 100;
    let simple_comment_weight = weightMap.get("simple_comment_weighted")!;
    let public_members_weight = weightMap.get("simple_public_weighted")!;
    let expectedResult = (simpleCommentExpectedResult * simple_comment_weight + publicMembersExpectedOnlyResult * public_members_weight) / (simple_comment_weight + public_members_weight);
    builder.processResult(simpleCommentResult);
    builder.processResult(publicMembersOnlyResult);
    let actual = builder.getAggregatedResult("").getResult();
    expect(actual).toBeCloseTo(expectedResult);

});
test("test ignore getters setters",()=>{
let parser=new JavaParser();
const path="testDir/GetterSetter.java"
let root=parser.parse(path);
let res={root,path};
let params={getterPattern:"(get.*)|(is.*)",setterPattern:"set.*"}
let builder=new MetricResultBuilder();
let metric=MetricManager.createMetricByType(IgnoreGetterSetterMetric,"getter_setter_test",params);
let analyzer=new FileAnalyzer();

analyzer.analyze(res,metric,builder)
let result=builder.getAggregatedResult("");
expect(result.getResult()).toBe(25);

});

test("test ignore comments",()=>{
    const path="testDir/TestIgnoreComments.java";
    let parser=new JavaParser();
    let root=parser.parse(path);
    let result={path,root};
    let file_analyzer=new FileAnalyzer();
    let builder=new MetricResultBuilder();
    file_analyzer.analyze(result,MetricManager.createMetricByType(SimpleCommentPresentMetric,"simple_comment_ignore",undefined),builder);
    let metricResult=builder.getAggregatedResult("").getResult();
    expect(metricResult).toBe(50);
});

test("test weighted path",()=>{
    let paths=["./testDir/CommentClass.java","./testDir/commented_class.java","./testDir/LargeMethodTest.java","./testDir/GetterSetter.java"];
    let path_weights=[{path:"*Class.java",weight:5},{path:"*_class.java",weight:5}];
    let builder=new WeightedMetricResultBuilder(new PathWeightResolver(path_weights,1));
    let metric=MetricManager.createMetricByType(SimpleCommentPresentMetric,"simple_weighted_path",undefined);
    let parser=new JavaParser();
    let fileAnalyzer=new FileAnalyzer();
    let singleFileResultBuilder=new MetricResultBuilder();
    for(let p of paths){
        let root=parser.parse(p);
        fileAnalyzer.analyze({path:p,root:root},metric,singleFileResultBuilder);
        builder.processResult(singleFileResultBuilder.getAggregatedResult(p));
        singleFileResultBuilder.reset();
    }
    let result=builder.getAggregatedResult("").getResult();
    expect(result).toBeCloseTo(40.887,3);

});
test("test overriding and java throws",()=>{
    const path="testDir/OverridingTest.java";
    let parser=new JavaParser();
    let root=parser.parse(path);
    let result={path,root};
    let doc=MetricManager.createMetricByType(SimpleMethodDocumentationMetric,"doc2",null);
    let fileAnalyzer=new FileAnalyzer();
    let singleFileResultBuilder=new MetricResultBuilder();
    fileAnalyzer.analyze(result,doc,singleFileResultBuilder);
    let finalResult=singleFileResultBuilder.getAggregatedResult("").getResult();
    const expectedResult=80;
    expect(finalResult).toBeCloseTo(expectedResult);
});

