var log = console.log,
    fs = require( 'fs' ),
    Dropper = require( '../index' ),
    path = __dirname + '/numbers.txt',
    filter = null, rs = null,
    rc = '\033[1;31m', gc = '\033[1;32m', yc = '\033[1;33m', yc = '\033[1;33m', bc = '\033[1;39m', ec = '\033[0m';

fs.stat( path, function ( err, stats ) {
    if ( err ) {
        log( 'fs stat error:', err.stack );
    }
    log( rc + '\nsource file:', path + ', bytes:', stats.size, '\n' + ec );

} );

// dropper

filter = new Dropper( 36, { pad : 0xff } );

filter.on( 'data', function ( data ) {
    filter.pause(); // <- pausing filter
    log( gc + 'filter emits data, length:', data.length + ec );
    log( bc + 'data:', data, ec, '\n' );
    filter.resume(); // <- resuming filter
} );

filter.on( 'drain', function () {
    log( 'filter emits drain\n' );
} );

filter.on( 'end', function () {
    log( rc + '\nfilter stream ends,', filter.sent, 'packet(s) sent,', filter.received, 'received\n' + ec );
} );

filter.on( 'close', function () {
    log( rc + 'filter stream was closed\n' + ec );
} );

// source stream

rs = fs.createReadStream( path, { bufferSize : 20 } );

rs.on( 'data', function ( data ) {
    log( yc + 'source stream emits data, length:', data.length + ec );
    log( bc + 'data:', data, ec );
    log();
} );
rs.on( 'drain', function () {
    log( 'source stream emits drain\n' );
} );
    
rs.on( 'end', function () {
    log( rc + 'source stream emits end\n' + ec );
} );
    
rs.on( 'close', function () {
    log( rc + 'source stream was closed\n' + ec );
} );
    
rs.on( 'error', function ( err ) {
    log( rc + 'source stream emits error:', err.stack, ec + '\n' );
} );

rs.pipe( filter, { end : true } );

