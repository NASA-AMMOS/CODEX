import Filter from './algorithms/Filter/Filter';
import Cluster from './algorithms/Cluster/Cluster';
import DimensionalityReduction from './algorithms/DimensionalityReduction/DimensionalityReduction';
import Regression from './algorithms/Regression/DimensionalityReduction';
/*
import PeakFind from './algorithms/PeakFind/PeakFind';
import Segment from './algorithms/Segment/Segment';
import Bin from './algorithms/Bin/Bin';
import ReduceDimension from './algorithms/ReduceDimension/ReduceDimension';
import Regress from './algorithms/Regress/Regress';
import Normalize from './algorithms/Normalize/Normalize';
import Endmembers from './algorithms/Endmembers/Endmembers';
import QualityScan from './algorithms/QualityScan/QualityScan';
import TemplateScan from './algorithms/TemplateScan/TemplateScan';
*/

import QualityScan from './reports/QualityScan/QualityScan';

import Blank from './Components/Blank';

import scatter from './graphs/scatter';
import heatmap from './graphs/heatmap';
import histogram from './graphs/histogram';
import boxplot from './graphs/boxplot';
import polarScatter from './graphs/polarScatter';
import bar from './graphs/bar';
import pie from './graphs/pie';
import parallel from './graphs/parallel';
import polarheatmap from './graphs/polarheatmap';
import polarbar from './graphs/polarbar';
import { TestReport } from './reports/TestReport';

export default class Config {
    constructor() {
        let PeakFind, Segment, Bin, ReduceDimension, Regress, Normalize, Endmembers, TemplateScan;
        PeakFind = Segment = Bin = ReduceDimension = Regress = Normalize = Endmembers = TemplateScan = Blank;
        
        this.config = {
            graphs: [
                { name: 'Scatter', type: 'scatter', component: scatter },
                { name: 'Scatter (polar)', type: 'polarscatter', component: polarScatter },
                { name: 'HeatMap', type: 'heatmap', component: heatmap },                
                { name: 'Heatmap (Polar)', type: 'polarheatmap', component: polarheatmap },
                { name: 'Histogram', type: 'histogram', component: histogram },
                { name: 'Boxplot', type: 'boxplot', component: boxplot },
                { name: 'Bar', type: 'bar', component: bar },                
                { name: 'Bar (Polar)', type: 'polarbar', component: polarbar },
                { name: 'Pie', type: 'pie', component: pie },
                { name: 'Parallel', type: 'parallel', component: parallel },
            ],
            algorithms: [
                {
                    name: 'Filter',
                    component: Filter
                },
                {
                    name: 'Cluster',
                    component: Cluster,
                    subalgorithms: [
                        {
                            name: 'Mini Batch K-Means',
                            simplename: 'kmeans',
                            parameters: [
                                {
                                    name: 'k',
                                    title: 'Number of Clusters',
                                    inputType: 'number',
                                    min: 2,
                                    value: 3,
                                    max: 6,
                                    step: 1
                                }
                            ]
                        },
                        {
                            name: 'Affinity Propagation',
                            simplename: 'affinity_propagation',
                            parameters: [
                                {
                                    name: 'damping',
                                    title: 'Damping',
                                    inputType: 'number',
                                    min: 0.5,
                                    value: 0.5,
                                    max: 0.96,
                                    step: 0.05
                                }
                            ]
                        },
                        {
                            name: 'Mean Shift',
                            simplename: 'mean_shift',
                            parameters: [
                                {
                                    name: 'quantile',
                                    title: 'Quantile',
                                    inputType: 'number',
                                    min: 0.1,
                                    value: 0.5,
                                    max: 1.0,
                                    step: 0.1
                                }
                            ]
                        },
                        {
                            name: 'Spectral',
                            simplename: 'spectral',
                            parameters: [
                                {
                                    name: 'k',
                                    title: 'Number of Clusters',
                                    inputType: 'number',
                                    min: 2,
                                    value: 3,
                                    max: 6,
                                    step: 1
                                }
                            ]
                        },
                        {
                            name: 'Ward',
                            simplename: 'ward',
                            parameters: [
                                {
                                    name: 'n_neighbors',
                                    title: 'Number of Neighbors',
                                    inputType: 'number',
                                    min: 5,
                                    value: 5,
                                    max: 25,
                                    step: 5
                                },
                                {
                                    name: 'k',
                                    title: 'Number of Clusters',
                                    inputType: 'number',
                                    min: 2,
                                    value: 3,
                                    max: 6,
                                    step: 1
                                }
                            ]
                        },
                        {
                            name: 'Agglomerative',
                            simplename: 'agglomerative',
                            parameters: [
                                {
                                    name: 'n_neighbors',
                                    title: 'Number of Neighbors',
                                    inputType: 'number',
                                    min: 2,
                                    value: 3,
                                    max: 10,
                                    step: 1
                                }
                            ]
                        },
                        {
                            name: 'DBSCAN',
                            simplename: 'dbscan',
                            parameters: [
                                {
                                    name: 'eps',
                                    title: 'Eps',
                                    inputType: 'number',
                                    min: 0.2,
                                    value: 0.7,
                                    max: 1.0,
                                    step: 0.1
                                }
                            ]
                        },
                        {
                            name: 'Birch',
                            simplename: 'birch',
                            parameters: [
                                {
                                    name: 'k',
                                    title: 'Number of Clusters',
                                    inputType: 'number',
                                    min: 2,
                                    value: 3,
                                    max: 10,
                                    step: 1
                                }
                            ]
                        }
                    ],
                },
                {
                    name: 'Dimensionality Reduction',
                    component: DimensionalityReduction,
                    subalgorithms: [
                        {
                            name: 'PCA',
                            simplename: 'PCA',
                            parameters: [
                                {
                                    name: 'n_components',
                                    title: 'Number of Components',
                                    inputType: 'number',
                                    min: 2,
                                    value: 2,
                                    max: 10,
                                    step: 1
                                }
                            ]
                        },
                        {
                            name: 'LDA',
                            simplename: 'LDA',
                            parameters: [
                                {
                                    name: 'n_components',
                                    title: 'N Components',
                                    inputType: 'number',
                                    min: 2,
                                    value: 2,
                                    max: 10,
                                    step: 1
                                }
                            ]
                        },
                        {
                            name: 'ICA',
                            simplename: 'ICA',
                            parameters: [
                                {
                                    name: 'n_components',
                                    title: 'N Components',
                                    inputType: 'number',
                                    min: 2,
                                    value: 2,
                                    max: 10,
                                    step: 1
                                }
                            ]
                        }
                    ]
                },
                {
                    name: 'Regression',
                    component: Regression,
                    subalgorithms: [
                        {
                            name: 'Linear',
                            simplename: 'linear',
                            parameters: [
                                {
                                    name: 'n_estimators',
                                    title: 'N Estimators',
                                    inputType: 'number',
                                    min: 1,
                                    value: 25,
                                    max: 50,
                                    step: 1
                                },
                                {
                                    name: 'test_size',
                                    title: 'Test Size',
                                    inputType: 'number',
                                    min: 0.1,
                                    value: 0.9,
                                    max: 1,
                                    step: 0.1
                                },
                                {
                                    name: 'alpha',
                                    title: 'Alpha',
                                    inputType: 'number',
                                    min: 0.1,
                                    value: 1,
                                    max: 1,
                                    step: 0.1
                                },
                                {
                                    name: 'max_iter',
                                    title: 'Max Iterations',
                                    inputType: 'number',
                                    min: 10,
                                    value: 100,
                                    max: 100,
                                    step: 10
                                },
                                {
                                    name: 'tol',
                                    title: 'tol',
                                    inputType: 'number',
                                    min: 0.1,
                                    value: 0.5,
                                    max: 1,
                                    step: 0.1
                                }
                            ]
                        },
                        {
                            name: 'Lasso',
                            simplename: 'lasso',
                            parameters: [
                                {
                                    name: 'n_estimators',
                                    title: 'N Estimators',
                                    inputType: 'number',
                                    min: 1,
                                    value: 25,
                                    max: 50,
                                    step: 1
                                },
                                {
                                    name: 'test_size',
                                    title: 'Test Size',
                                    inputType: 'number',
                                    min: 0.1,
                                    value: 0.9,
                                    max: 1,
                                    step: 0.1
                                },
                                {
                                    name: 'alpha',
                                    title: 'Alpha',
                                    inputType: 'number',
                                    min: 0.1,
                                    value: 1,
                                    max: 1,
                                    step: 0.1
                                },
                                {
                                    name: 'max_iter',
                                    title: 'Max Iterations',
                                    inputType: 'number',
                                    min: 10,
                                    value: 100,
                                    max: 100,
                                    step: 10
                                },
                                {
                                    name: 'tol',
                                    title: 'tol',
                                    inputType: 'number',
                                    min: 0.1,
                                    value: 0.5,
                                    max: 1,
                                    step: 0.1
                                }
                            ]
                        },
                        {
                            name: 'Polynomial',
                            simplename: 'polynomial',
                            parameters: [
                                {
                                    name: 'n_estimators',
                                    title: 'N Estimators',
                                    inputType: 'number',
                                    min: 1,
                                    value: 25,
                                    max: 50,
                                    step: 1
                                },
                                {
                                    name: 'test_size',
                                    title: 'Test Size',
                                    inputType: 'number',
                                    min: 0.1,
                                    value: 0.9,
                                    max: 1,
                                    step: 0.1
                                },
                                {
                                    name: 'alpha',
                                    title: 'Alpha',
                                    inputType: 'number',
                                    min: 0.1,
                                    value: 1,
                                    max: 1,
                                    step: 0.1
                                },
                                {
                                    name: 'max_iter',
                                    title: 'Max Iterations',
                                    inputType: 'number',
                                    min: 10,
                                    value: 100,
                                    max: 100,
                                    step: 10
                                },
                                {
                                    name: 'tol',
                                    title: 'tol',
                                    inputType: 'number',
                                    min: 0.1,
                                    value: 0.5,
                                    max: 1,
                                    step: 0.1
                                }
                            ]
                        },
                        {
                            name: 'Random Forest',
                            simplename: 'randomForest',
                            parameters: [
                                {
                                    name: 'n_estimators',
                                    title: 'N Estimators',
                                    inputType: 'number',
                                    min: 1,
                                    value: 25,
                                    max: 50,
                                    step: 1
                                },
                                {
                                    name: 'test_size',
                                    title: 'Test Size',
                                    inputType: 'number',
                                    min: 0.1,
                                    value: 0.9,
                                    max: 1,
                                    step: 0.1
                                },
                                {
                                    name: 'alpha',
                                    title: 'Alpha',
                                    inputType: 'number',
                                    min: 0.1,
                                    value: 1,
                                    max: 1,
                                    step: 0.1
                                },
                                {
                                    name: 'max_iter',
                                    title: 'Max Iterations',
                                    inputType: 'number',
                                    min: 10,
                                    value: 100,
                                    max: 100,
                                    step: 10
                                },
                                {
                                    name: 'tol',
                                    title: 'tol',
                                    inputType: 'number',
                                    min: 0.1,
                                    value: 0.5,
                                    max: 1,
                                    step: 0.1
                                }
                            ]
                        }
                    ]
                },
                /*
                {
                    name: 'Segment',
                    component: Segment,
                    subalgorithms: [
                        {
                            name: 'Felzenszwalb',
                            simplename: 'felzenszwalb',
                        },
                        {
                            name: 'Quickshift',
                            simplename: 'quickshift',
                        },
                    ]
                },
                {
                    name: 'Bin',
                    component: Bin,
                    subalgorithms: [
                        {
                            name: '1-Dimensional',
                            simplename: '1d',
                        },
                    ]
                },
                {
                    name: 'Endmembers',
                    component: Endmembers,
                    subalgorithms: [
                        {
                            name: 'ATGP',
                            simplename: 'ATGP',
                        },
                        {
                            name: 'FIPPI',
                            simplename: 'FIPPI',
                        },
                        {
                            name: 'PPI',
                            simplename: 'PPI',
                        },
                    ]
                },
                {
                    name: 'More Like This',
                    component: Blank
                },
                {
                    name: 'Template Scan',
                    component: TemplateScan,
                    subalgorithms: [
                        {
                            name: 'Template Scan',
                            simplename: 'template',
                        },
                    ]
                },
                {
                    name: 'Regress',
                    component: Regress,
                    subalgorithms: [
                        {
                            name: 'Linear',
                            simplename: 'linear',
                        },
                    ]
                },
                {
                    name: 'Peak Find',
                    component: PeakFind,
                    subalgorithms: [
                        {
                            name: 'Find Peaks',
                            simplename: 'findpeaks',
                        },
                        {
                            name: 'Peak CWT',
                            simplename: 'peak_cwt',
                        },
                    ]
                },
                {
                    name: 'Normalize',
                    component: Normalize,
                    subalgorithms: [
                        {
                            name: 'Min/Max',
                            simplename: 'min_max',
                        },
                    ]
                },
                {
                    name: 'Quality Scan',
                    component: Blank,
                    subalgorithms: [
                        {
                            name: 'Oddities',
                            simplename: 'oddities',
                        },
                        {
                            name: 'Sigma Data',
                            simplename: 'sigma_data',
                        },
                    ]
                }
                */
            ],
            reports: [
                {
                    name: 'Quality Scan',
                    component: QualityScan,
                    width: '100%',
                    height: '100%'
                },
                /*
                {
                    name: 'Test Report',
                    component: TestReport
                }
                */
            ],
            groups: [
                'none', '#ff4500', '#9c27b0', '#3f51b5', '#03a9f4', '#009688', '#8bc34a', '#ffeb3b'
            ]
        }
    }
}
export let config = new Config();