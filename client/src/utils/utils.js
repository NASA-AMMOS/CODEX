/**
 * Get a unique id number per idName
 * @param {string} idName
 * Ex: getId( 'cat' ); getId( 'cat' ); getId( 'dog' ); getId( 'cat' );
 *     -> 0, 1, 0, 2
 */
let getIdIds = {};
export const getId = idName => {
    if (getIdIds.hasOwnProperty(idName)) {
        getIdIds[idName]++;
    } else {
        getIdIds[idName] = 0;
    }
    return getIdIds[idName];
};
