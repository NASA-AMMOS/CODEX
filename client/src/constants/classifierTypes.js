import * as constantHelpers from "constants/constantHelpers"

export const CLASSIFIER_WINDOW = "CLASSIFIER_WINDOW";
export const CLASSIFIER_LOADING_WINDOW = "CLASSIFIER_LOADING_WINDOW";
export const CLASSIFIER_RESULTS_WINDOW = "CLASSIFIER_RESULTS_WINDOW";

export const AdaBoostClassifier = "AdaBoostClassifier";
export const BaggingClassifier = "BaggingClassifier";
export const BayesianGaussianMixture = "BayesianGaussianMixture";
export const BernoulliNB = "BernoulliNB";
export const CalibratedClassifierCV = "CalibratedClassifierCV";
export const ComplementNB = "ComplementNB";
export const DecisionTreeClassifier = "DecisionTreeClassifier";
export const ExtraTreesClassifier = "ExtraTreesClassifier";
export const ExtraTreeClassifier = "ExtraTreeClassifier";
export const GaussianMixture = "GaussianMixture";
export const GaussianNB = "GaussianNB";
export const GaussianProcessClassifier = "GaussianProcessClassifier";
export const GradientBoostingClassifier = "GradientBoostingClassifier";
export const KNeighborsClassifier = "KNeighborsClassifier";
export const LabelPropagation = "LabelPropagation";
export const LabelSpreading = "LabelSpreading";
export const LinearDiscriminantAnalysis = "LinearDiscriminantAnalysis";
export const LogisticRegression = "LogisticRegression";
export const LogisticRegressionCV = "LogisticRegressionCV";
export const MLPClassifier = "MLPClassifier";
export const MultinomialNB = "MultinomialNB";
export const NuSVC = "NuSVC";
export const QuadraticDiscriminantAnalysis = "QuadraticDiscriminantAnalysis";
export const RandomForestClassifier = "RandomForestClassifier";
export const SGDClassifier = "SGDClassifier";
export const SVC = "SVC";

export const CLASSIFIER_TYPES = [
    AdaBoostClassifier,
    BaggingClassifier,
    BayesianGaussianMixture,
    BernoulliNB,
    CalibratedClassifierCV,
    ComplementNB,
    DecisionTreeClassifier,
    ExtraTreesClassifier,
    ExtraTreeClassifier,
    GaussianMixture,
    GaussianNB,
    GaussianProcessClassifier,
    GradientBoostingClassifier,
    KNeighborsClassifier,
    LabelPropagation,
    LabelSpreading,
    LinearDiscriminantAnalysis,
    LogisticRegression,
    LogisticRegressionCV,
    MLPClassifier,
    MultinomialNB,
    NuSVC,
    QuadraticDiscriminantAnalysis,
    RandomForestClassifier,
    SGDClassifier,
    SVC
];

export const CLASSIFIER_PARAMS = {
    [AdaBoostClassifier]: [
        {
            name: "n_estimators",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 100, 1, "int"))
        }
    ],
    [BaggingClassifier]: [
        {
            name: "n_estimators",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 100, 1, "int"))

        }
    ],
    [BayesianGaussianMixture]: [
        {
            name: "n_components",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 100, 1, "int"))

        }
    ],
    [BernoulliNB]: [
        {
            name: "alpha",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 100, 1, "int"))

        }
    ],
    [CalibratedClassifierCV]: [
        {
            name: "method",
            subParams: [
                {
                    options: ["sigmoid", "isotonic"],
                    default: "sigmoid",
                    name: "method",
                    label: "Method",
                    type: "string"
                }
            ]
        }
    ],
    [ComplementNB]: [
        {
            name: "alpha",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 100, 1, "int"))
        }
    ]
};
