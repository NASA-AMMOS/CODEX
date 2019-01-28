var hdf5 = require('hdf5').hdf5;
var h5lt = require('hdf5').h5lt;
var Access = require('hdf5/lib/globals').Access;

self.addEventListener( 'message', function( m ) {
    m = m.data;
    var url = m.url;
    var file = new hdf5.File( url, Access.ACC_RDWR);
    var readAsBuffer = h5lt.readDatasetAsBuffer(
        1, 'Test', {start: [3,4], stride: [1,1], count: [2,2]});
});