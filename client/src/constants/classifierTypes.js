export const CLASSIFIER_WINDOW = "CLASSIFIER_WINDOW";

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
            type: "int",
            mode: "range",
            min: 0,
            minDefault: 0,
            minLabel: "Min parameter label",
            max: 50,
            maxDefault: 50,
            maxLabel: "Max parameter label",
            step: 1,
            stepDefault: 1,
            stepLabel: "Step size",
            displayName: "Number of Estimators"
        }
    ],
    [BaggingClassifier]: [
        {
            name: "n_estimators",
            type: "int",
            mode: "range",
            min: 0,
            minDefault: 0,
            minLabel: "Min parameter label",
            max: 10,
            maxDefault: 10,
            maxLabel: "Max parameter label",
            step: 1,
            stepDefault: 1,
            stepLabel: "Step size",
            displayName: "Number of Estimators"
        }
    ],
    [BayesianGaussianMixture]: [
        {
            name: "n_components",
            type: "int",
            mode: "range",
            min: 0,
            minDefault: 0,
            max: 1,
            maxDefault: 1,
            maxLabel: "Max parameter label",
            step: 1,
            stepDefault: 1,
            stepLabel: "Step size",

            displayName: "Number of Components"
        }
    ],
    [BernoulliNB]: [
        {
            name: "alpha",
            type: "float",
            mode: "range",
            min: 0,
            minDefault: 0,
            minLabel: "Min parameter label",
            max: 1,
            maxDefault: 1,
            maxLabel: "Max parameter label",
            step: 1,
            stepDefault: 1,
            stepLabel: "Step size",

            displayName: "Alpha"
        }
    ]
};
