/* eslint import/no-webpack-loader-syntax: off */
import WorkerH5 from 'worker-loader!../workers/parseCSV.worker';
import WorkerCSV from 'worker-loader!../workers/parseCSV.worker';

const workerH5 = new WorkerH5();
const workerCSV = new WorkerCSV();

export default class Parser {

    parseFile( file, type, progressCallback, completeCallback ) {
        switch( type.toLowerCase() ) {
            case 'h5':
                    this.parseH5( file, progressCallback, completeCallback );
                break;
            case 'csv':
                    this.parseCSV( file, progressCallback, completeCallback );
                break;
            default:
                console.warn( 'Parse Error - Unsupported data type: ' + type );
        }
    }


    parseH5( file, progressCallback, completeCallback ) {
        workerH5.postMessage( { file: file } );
        workerH5.addEventListener( 'message', function(e) {
            if( e.data.hasOwnProperty( 'row' ) ) {
                if( typeof progressCallback === 'function' ) {
                    progressCallback( e.data.row, e.data.progress );
                }
            }
            else if( e.data === 'complete' ) {
                if( typeof completeCallback === 'function' ) {
                    completeCallback();
                }
            }
        } );
    }

    parseCSV( file, progressCallback, completeCallback ) {
        workerCSV.postMessage( { file: file } );
        workerCSV.addEventListener( 'message', function(e) {
            if( e.data.hasOwnProperty( 'row' ) ) {
                if( typeof progressCallback === 'function' ) {
                    progressCallback( e.data.row, e.data.progress );
                }
            }
            else if( e.data === 'complete' ) {
                if( typeof completeCallback === 'function' ) {                    
                    completeCallback();
                    //model.computeFeatureFacts();
                }
            }
        } );
    }

}

export let parser = new Parser();