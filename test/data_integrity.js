var log = console.log,
    assert = require( 'assert' ),
    crypto = require( 'crypto' ),
    fs = require( 'fs' ),
    Dropper = require( '../index' ),
    path =  __filename, //  __dirname + '/../examples/numbers.txt',
    checksum = null,
    output = null, o = 0,
    filter = null, sourceStream = null,
    rc = '\033[1;31m', gc = '\033[1;32m', yc = '\033[1;33m',
    tc = '\033[1;44m', bc = '\033[1;39m', xc = '\033[1;35m',
    ec = '\033[0m',
    delay = 30;

fs.readFile( path, null, function ( err, fdata ) {
    if ( err ) {
        log( 'fs error:', err.stack );
    }
    checksum = crypto.createHash( 'sha1' ).update( fdata ).digest( 'hex' );
    log( '\n' + yc + 'Starting Data Integrity Test..' + ec +'\n' );
    
    output = new Buffer( fdata.length );
    
    // dropper

    filter = new Dropper( 36 );

    filter.on( 'data', function ( data ) {
        filter.pause();  // <- for a better output log
        setTimeout( function (){
            log( tc + 'filter emits data:', data, ec );
            data.copy( output, o );
            o += data.length;
            if ( o === output.length ) {
                // data.length === filter.dropsize, except for last packet ( <= )
                try {
                    assert.ok( data.length <= filter.dropSize, 'Test Failed: data_integrity, last packet bad size ' );
                    log( yc + 'Test ok ( last output packet length <= dropSize ):', gc + data.length, '<=', rc + filter.dropSize + ec );
                } catch ( err ) {
                    log( rc + '\nsomething went wrong..\n' );
                    log( err.stack, ec );
                    filter.destroy();
                }
            } else {
                try {
                    assert.strictEqual( data.length, filter.dropSize, 'Test Failed: data_integrity, bad packet size ' );
                    log( yc + 'Test ( output packet length === dropSize ) ok:', gc + data.length, '===', rc + filter.dropSize + ec );
                } catch ( err ) {
                    log( rc + '\nsomething went wrong..\n' );
                    log( err.stack, ec );
                    filter.destroy();
                }
            }
            filter.resume(); // <- for a better output log
        }, delay );
    } );

    filter.on( 'drain', function () {
    } );

    filter.on( 'end', function () {
        setTimeout( function () {
            log( yc + 'filter stream ends,', filter.sent, 'packet(s) sent,', filter.received, 'received' + ec );
            o = 0;
            var resultChecksum = crypto.createHash( 'sha1' ).update( output ).digest( 'hex' );
            log( xc + 'source file:', path + '\nsize:', fdata.length, 'bytes' + ec );
            try {
                assert.strictEqual( resultChecksum, checksum, 'Test Failed: data_integrity, bad checksum ' );
                log( yc + 'Test ok:', gc + checksum, '===', rc + resultChecksum + ec );
            } catch ( err ) {
                log( rc + '\nsomething went wrong..\n' );
                log( rc + 'checksums:', gc + checksum, '!==', rc + resultChecksum, '\n' );                
                log( err.stack, ec, '\n' );
            }
        }, delay );
    } );

    filter.on( 'close', function () {
    } );

    // source stream

    sourceStream = fs.createReadStream( path, { bufferSize : 80 } );

    sourceStream.on( 'data', function ( data ) {
        log( gc + 'input data:', bc, data, ec );
        log( gc + 'input data length:', bc, data.length, ec )
    } );
    
    sourceStream.on( 'drain', function () {
    } );
        
    sourceStream.on( 'end', function () {
    } );
        
    sourceStream.on( 'close', function () {
    } );
        
    sourceStream.on( 'error', function ( err ) {
        log( rc + 'source stream emits error:', err.stack, ec + '\n' );
    } );
    

    var ofilter = new Dropper( 13 );
    
    ofilter.on( 'data', function ( data ) {
    } );

    sourceStream.pipe( ofilter, { end : true } );

    ofilter.pipe( filter );

} );


