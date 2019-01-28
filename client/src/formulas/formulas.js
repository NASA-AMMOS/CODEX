import React from 'react';

export default class Formulas {
    //returns -1 if it doesn't, else the first match index
    objectArrayIndexOfKeyWithValue( objectArray, key, value ) {
        var index = -1;
        for( let i in objectArray ) {
            if( objectArray[i] ) {
                if( objectArray[i].hasOwnProperty( key ) && objectArray[i][key] === value ) {
                    index = i;
                    break;
                }
            }
        }
        return index;
    }

    unionSortedArray(a, b) {
        var arr = a.concat(b).sort(function(a, b) {
            return a - b;
        });
        /*
        for( let i = 1; i < arr.length; i++ ) {
            if( arr[i] === arr[i-1] ) {
                arr = arr.splice( i-1, 1 );
                i--;
            }
        }*/
        return arr;
     }

    findMaxValueInArray( array ) {
        let max = -Infinity;
        for( let i in array )
            if( max < array[i] )
                max = array[i];
        return max;
    }

    //start as a percent
    stringToEllipsisSubstring( str, place, length ) {
        let ellipsisSubstring = str;
        let len = ellipsisSubstring.length - 1;
        if( ellipsisSubstring.length >= length ) {
            let position = parseInt( len * ( place / 100 ), 10 );
            let halfLength = parseInt( length / 2, 10 );
            let startI = Math.max( 0, position - halfLength );
            if( startI + length > len )
                ellipsisSubstring = ellipsisSubstring.substr( len - length + 1 );
            else
                ellipsisSubstring = ellipsisSubstring.substr( startI, length );
                /*
            if( startI !== 0 )
                ellipsisSubstring = '...' + ellipsisSubstring.substring( 3 );
            if( startI + length <= len )
                ellipsisSubstring = ellipsisSubstring.slice( 0, -3 ) + '...';
                */
        }
        return ellipsisSubstring;
    }

    //Takes an arr of string and replaces all spaces with _'s
    cleanStringArray( arr ) {
        for( let i in arr )
            if( typeof arr[i] === 'string' )
                arr[i] = arr[i].replace(/\s/g, '_');
            else
                arr[i] = '';
        return arr;
    } 

    //for [].sort(asc)ending
    asc( a, b ) {
        return a - b;
    }
    //for [].sort(dsc)ending
    dsc( a, b ) {
        return b - a;
    }

    /**
    * @function
    * @description Checks whether a point is contained within a polygon.
    * @param {Object} poly - polygon of the form [{x: n1, y: n2},{x: n3, y: n4}, ... ]
    * @param {Object} pt - point of the form {x: n1, y: n2}
    * @returns {Boolean}
    */
    isPointInPoly( poly, pt ) { //poly and pt are objects of the form {x: ,y: }
        for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
            ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
            && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
            && (c = !c);
        return c;
    }

    iToAlphabet( i ) {
        let alpha = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
        return alpha[ Math.min( i, 25 ) ];
    }

    markSubstring( string, substring, background ) {
        if( substring === '' ) return string;
        substring = substring.toLowerCase();
        background = background || 'lime';

        let els = [];
        for( let c = 0; c < string.length; c = c + 0 ) {
            const s = string.substring( c, c + substring.length );
            if( s.toLowerCase() === substring )
                els.push( <span style={{background: background, color: 'black'}}>{s}</span> )
            else
                els.push(s)
            c = c + substring.length;
        }
        return ( <div>{els}</div> )
    }

    //Deep compares objects but relies on ordering
    orderedObjectComparison( obj1, obj2 ) {
        return JSON.stringify( obj1 ) === JSON.stringify( obj2 );
    }

    getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }

    // int1 = 8, int2 = 5 returns [6,7]
    getIntsBetween( int1, int2 ) {
        let between = [];

        if( int1 === int2 ) return between;

        var min = Math.min( int1, int2 );
        var max = Math.max( int1, int2 );
        
        for( let i = min + 1; i < max; i++ ) {
            between.push(i);
        }

        return between;
    }

    //For finding coordinate offsets of elements
    findPos( obj ) {
        var curleft = 0, curtop = 0;
        if (obj.offsetParent) {
            do {
                curleft += obj.offsetLeft;
                curtop += obj.offsetTop;
            } while (obj = obj.offsetParent);
            return { x: curleft, y: curtop };
        }
        return undefined;
    }

    sortObjectByKeys( o ) {
        let s = Object.keys(o).sort();
        let sorted = {
            keys: s,
            values: []
        };
        for( let i in s ) sorted.values.push( o[s[i]] );
        return sorted;
    }

    sortObjectByValues( o ) {
        let s = Object.keys(o).sort(function(a,b){return o[a]-o[b]});
        let sorted = {
            keys: s,
            values: []
        };
        for( let i in s ) sorted.values.push( o[s[i]] );
        return sorted;
    }

    //To sort an array of objects by a key's value)
    sortArrayOfObjectsByKeyValue( arr, key ) {
        function compareKey( a, b ) {
            if( a[key] < b[key] )
                return -1;
            if( a[key] > b[key] )
                return 1;
            return 0;
        }

        return arr.sort( compareKey );
    }
    /** https://stackoverflow.com/questions/3730510/javascript-sort-array-and-return-an-array-of-indicies-that-indicates-the-positi
     * Returns an array of indices of the sorted toSort
     *  ex [56,27,12,72] -> [2,1,0,3]
     * @param {Array} toSort 
     */
    getSortMap( toSort ) {
        for( var i = 0; i < toSort.length; i++ ) {
            toSort[i] = [toSort[i], i];
        }
        toSort.sort(function(left, right) {
            return left[0] < right[0] ? 1 : -1; //high to low
        });
        toSort.sortIndices = [];
        for( var j = 0; j < toSort.length; j++ ) {
            toSort.sortIndices.push(toSort[j][1]);
            toSort[j] = toSort[j][0];
        }
        
        return toSort;
    }

    /**
     * Returns true if arrays match
     *    order matters
     */
    compareArrays( arrA, arrB ) {
        return arrA.length === arrB.length && arrA.every((val, i) => val === arrB[i])
    }
}
export let formulas = new Formulas();