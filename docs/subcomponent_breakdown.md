#CODEX Sub-systems to Develop

##System State History / State File
* YAML
* Can store "state" of analysis so that it reloads properly
* Regenerate current state if needed (like Jupiter notebook / Mathematica)
* OK to store working files as well and use if available

##Configuration file
* YAML
* Basic directory information, working dirs, state file dirs
* Permission to use XX Memory, XX Disk Space, XX Cores max
# Random seed to use (let's just fix this for now to keep things simple)

##Data Reader System
* Interface
 * Guidance: Memory Size if Loaded
 * Simple Column Selection
  * Challenge: There can be MANY columns
 * Simple Column Threshold Filter
 * Is data to be interpretted as unstructured (columns are not ordered) or 1D (columns are ordered)
 * Is 1D data indexed instead of ordered (one column represents proper order)
* Functionality
 * Target Formats: HDF5/NetCDF/TXT/CSV (these are only two in reality)
 * Headers or no headers (can relabel within CODEX as well)
 * Already have sophisticated HDF5/NEtCDF and txt/csv reader code for DOGO (will upload libs)
 * String entries in fields should be mapped to integers and a key presented

##Concept: Data Views & Workflows (ways to reprocess data into more data, open to better paradigm)
* Each View adds new "columns" to dataset that help organize or store aggregate products
* Intelligent re-processing should upstream data source change (parameter is tweaked)
* Workflow-like relationship fundamentally records what actions user has done to "get here"
* User can look at state as a workflow and modify, or can minimize and just keep making graphs
* System should have "clean up workflow" capability
 * User specifies the satisfying final graph, subselection, etc.
 * Any actions in the workflow NOT causally related to that final product are removed
* Computational caching
 * If a user switches a parameter upstream causing a cascade recompute, then switches back, don't lose everything

##Concept: Report
* Ways to obtain information about the data that do not map back to individual rows
* Are themselves new datasets that can be acted on (but anticipate little need for this)
* Tend to be saved out or themselves the output of the CODEX session
* Tend to be graphed

##Data View: Bin Data in 1D
* Functionality
 * Three kinds of binning
  * Uniform (params = bin number | bin size, phase)
  * Equal Content (params = num obs per bin | total bin number )
  * Percentile Y (params = percentile per bin | total bin number )
* Interface
 * Guidance: rough data density spread among proposed bins
 * Guidance: rough initial bin edges
 * Requires background sub-sampling to obtain fast guidance

##Data View: Peak Finding in 1D (regions that are anomalously high or low compared to surroundings)
* Functionality
 * Params = pos and/or neg peaks, rough width of peak to consider, min relative size of peak
* Interface
 * Guidance: Roughly how many peaks will be found given parameter settings
 * Guidance: Quick stats on presence of pos/neg peaks, peak widths, and peak heights

##Data View: Column Threshold (Basic filter)
* Functionality
 * params = upper/lower bound, absolute value | percentile
* Interface
 * Guidance: Data density along selected column, resulting % kept dynamically estimated

##Data View: Normalize
* Functionality
 * params = standardize, peak scale, area scale, or manual polynomial transform (enter coefficients)
* Interface
 * Show current max/min/mean/median/mode and dynamically change as user selects

##Data View: Regression (KEY DEMO TECH)
* Functionality
 * MLVR, Random Forest
 * Guidance supporting tech
* Interface
 * Column to regress, columns to predict from
 * Guidance: Correlation between input columns
 * Guidance: Preliminary results via subsampling (maybe online/streaming implementation)
 * Guidance: Time to Complete (likely requires ML estimation, specifically for demo laptop)
* Report (more than raw regression)
 * Which columns were most predictive? (For MLVR, LASSO is slow, maybe we can do quick param explore?)
 * Special action: Redo using only N top predictive columns & compare (predictive estimation here too)

##Data View: Segmentation (1D, Felzenszwalb) (find contiguous regions that are similar)
* Functionality
 * params = scale (higher means bigger, fewer segments), sigma = smoothing width, columsn to use, min_size)
 * Usually used on 2D images; may be interesting to get to 1D
* Interface
 * Guidance: Highly speculative here, would require a bit of research
 * Guidance: Columns to include (memory / time required for processing)

##Data View: Template Scan (1D) (KEY DEMO TECH)
* Functionality
 * Matched Filtering / Template matching (NOT Deep Learning)
* Interface
 * Select region to match
 * Guidance: Memory / Time required to complete
 * Guidance: Preliminary areas to match

##Report: Column Correlation
* Functionality
 * Peterson's correlation + generalized correlation coefficients
 * Challenge: these are very expensive to compute, will need subsampling & estimation
 * Caching is crucial here to avoid repeated calc
* Interface
 * Cols/selection to compare
 * Guidance: Blocks of columns that appear "similar" by quick stats
 * Guidance: Memory / Time required a really big deal

##Report + Data View: Data Quality Scan (may want to split into row version vs. column version?)
* Functionality
 * Identify suspiciously common values in otherwise real-valued data
 * Identify extreme outliers in columns (> 6 sigma, say)
* Interface
 * Nan, Inf, (user-entered) missing value identifiers vs. columns & rows (graphical)
 * Attempting to identify problem rows & problem columns
 * If user eliminates row or column, should auto-update

##Report: Multi-modality Test for Columns
* Functionality:
 * Many techniques for this, find speed-efficient one
* Interface:
 * Cols/selection to compare

##Data View: Advanced, Named Selections (KEY DEMO TECH)
* Functionality:
 * Label sources: column values (integer or threshold values), brushed graphs, Data View outputs (just columns)
* Interface:
 * Nameable, color-assignable, present and hot-updated in all active graphs
 * Available for selection in all Data View's (which selection do you want to process)
 * May be overlapping, but also should be tool to take unions/intersections/inversions to make new regions
 * Always has the "All Data" invisible/uncolored selection
 * Some Data Views should have custom region selection:
  * %data around "Cluster Centers"
  * %data near center of bins
  * %data near peak centers

##Data View: Clustering (KEY DEMO TECH)
* Functionality:
 * Focus on MiniBatchKmeans
* Interface:
 * Cols/selections to compare
 * Params = number of clusters, some stopping criteria (advice)
 * Estimated cluster statistics for 1-10 clusters

##Data View: DEMUD
* Functionality:
 * Kiri's code is already capable of returning after each discovery, so fully "watchable"
* Interface:
 * Cols/selections to compare
 * How many rows to return
 * Can be "run more" if user wants after existing run returns, just continues

##Data View: Dimensionality Reduction (KEY DEMO TECH)
* Functionality:
 * PCA, ICA, LDA
* Interface:
 * Cols/selections to compare
 * params = Number of components

##Data View: Endmembers (KEY DEMO TECH)
* Functionality:
 * Check out pysptools.sourceforge.net for existing methods (race them for efficiency) (
* Interface:
 * params = number of endmembers to seek (guidance)

##Report: Selection Explanation (KEY DEMO TECH)
* Functionality:
 * Use simple decision trees / random forest to try and "explain" this region vs. another using minimum feats
 * Sample code for this exists in DOGO, I will provide
* Interface:
 * Two selections to compare (NOT "selection 1" should be offered) and columns to include
 * Text report output + graphical depiction of decision tree to help explain

##Output: Save Subset
* Functionality:
 * File Out: Save to supported input formats (+ possibly KML/KMZ for Google Earth)
 * File Output: Save just a mask (0/1) relative to original file
 * Workflow capture (English): Instruction file of each step in the data processing w/ params (code in future!)
 *
* Interface:
 * Guidance: How large file will be
 * Additional columns to include/exclude (selection membership)
 * Whether full data save, mask file, workflow, or any mix is desired
