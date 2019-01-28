import Blank from './Components/Blank';

export default class Config {
    constructor() {
        
        this.config = {
            graphs: [
                { name: 'Scatter', type: 'scatter', component: Blank },
                { name: 'Scatter (polar)', type: 'polarscatter', component: Blank },
                { name: 'HeatMap', type: 'heatmap', component: Blank },                
                { name: 'Heatmap (Polar)', type: 'polarheatmap', component: Blank },
                { name: 'Histogram', type: 'histogram', component: Blank },
                { name: 'Boxplot', type: 'boxplot', component: Blank },
                { name: 'Bar', type: 'bar', component: Blank },                
                { name: 'Bar (Polar)', type: 'polarbar', component: Blank },
                { name: 'Pie', type: 'pie', component: Blank },
                { name: 'Parallel', type: 'parallel', component: Blank },
            ],
            algorithms: [
                {
                    name: 'Filter',
                    component: Blank
                },
                {
                    name: 'Cluster',
                    component: Blank,
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
                    component: Blank,
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
                    component: Blank,
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
                    component: Blank
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