var log = console.log,
    assert = require( 'assert' ),
    crypto = require( 'crypto' ),
    fs = require( 'fs' ),
    Dropper = require( ( true ) ? '../index' : 'block-stream' ),
    path = __filename,
    rc = '\033[1;31m', gc = '\033[1;32m', yc = '\033[1;33m',
    tc = '\033[1;44m', bc = '\033[1;39m', xc = '\033[1;35m',
    ec = '\033[0m',
    isize = 0, fsize = 0, psize = 0, cycles = 0, i = 0, stime = 0,
    filter = null, paper = null, sourceBuffer = null, checksum = null,
    printResults = function ( si, mo, eo ) {
        return function () {
            var etime = Date.now() - stime;
            log( '\nstart input packet size   :', si, 'bytes' );
            log( 'middle ouput packet size  :', mo, 'bytes' );
            log( 'final output packet size  :', eo, 'bytes' );
            log( '\nstream writings     :', cycles, 'times' );
            log( 'elapsed time        :', ( etime / 1000 ).toFixed( 3 ), 'secs' );
            log( 'rate ( ops / time ) :', ( cycles / etime ).toFixed( 3 ), 'Kop/sec\n' );
        };
    };

log( '\n-> benchmark test1 <-' );

cycles = 1;
isize = 1024 * 100;
filter = new Dropper( isize );
paper = new Dropper( isize );
sourceBuffer = new Buffer( isize );

ochecksum = crypto.createHash( 'sha1' );
fchecksum = crypto.createHash( 'sha1' );
pchecksum = crypto.createHash( 'sha1' );

filter.on( 'data', function ( data ) {
    fchecksum.update( data );
} );

paper.on( 'data', function ( data ) {
    pchecksum.update( data );
} );

filter.on( 'end', function ( data ) {
    log( 'filter checksum   :', fchecksum.digest( 'hex' ) );
} );

paper.on( 'end', function ( data ) {
    log( 'paper checksum    :', pchecksum.digest( 'hex' ) );
} );

paper.on( 'end', printResults( isize, isize, isize ) );

filter.pipe( paper );

i = 0;
stime = Date.now();
for( ; i < cycles; ++i ) {
    filter.write( sourceBuffer );
    ochecksum.update( sourceBuffer );
}
log( 'original checksum :', ochecksum.digest( 'hex' ) );
filter.end( sourceBuffer );
if ( filter.destroy ) {
    filter.destroy();
    paper.destroy();
}
log( '<- end test 1 ->\n' );

/**/
log( '-> benchmark test2 <-' );
isize = 1024 * 12;
fsize = 1 + isize / 2;
psize = isize - 1;
cycles = 1;
filter = new Dropper( fsize );
paper = new Dropper( psize );
sourceBuffer = new Buffer( isize );
ochecksum = crypto.createHash( 'sha1' );
fchecksum = crypto.createHash( 'sha1' );
pchecksum = crypto.createHash( 'sha1' );

filter.on( 'data', function ( data ) {
    fchecksum.update( data );
} );

paper.on( 'data', function ( data ) {
    pchecksum.update( data );
} );

filter.on( 'end', function ( data ) {
    log( 'filter checksum   :', fchecksum.digest( 'hex' ) );
} );

paper.on( 'end', function ( data ) {
    log( 'paper checksum    :', pchecksum.digest( 'hex' ) );
} );

paper.on( 'end', printResults( isize, fsize, psize ) );

filter.pipe( paper );
i = 0;
stime = Date.now();
for( ; i < cycles; ++i ) {
    filter.write( sourceBuffer );
    ochecksum.update( sourceBuffer );
}
log( 'original checksum :', ochecksum.digest( 'hex' ) );
filter.end( sourceBuffer );
if ( filter.destroy ) {
    filter.destroy();
    paper.destroy();
}
log( '<- end test 2 ->\n' );
/**/
log( '-> benchmark test3 <-' );

isize = 1024;
fsize = isize * 2;
psize = 1 + isize / 2;
cycles = 1;
filter = new Dropper( fsize );
paper = new Dropper( psize );
sourceBuffer = new Buffer( isize );
ochecksum = crypto.createHash( 'sha1' );
fchecksum = crypto.createHash( 'sha1' );
pchecksum = crypto.createHash( 'sha1' );

filter.on( 'data', function ( data ) {
    fchecksum.update( data );
} );

paper.on( 'data', function ( data ) {
    pchecksum.update( data );
} );

filter.on( 'end', function ( data ) {
    log( 'filter checksum   :', fchecksum.digest( 'hex' ) );
} );

paper.on( 'end', function ( data ) {
    log( 'paper checksum    :', pchecksum.digest( 'hex' ) );
} );

paper.on( 'end', printResults( isize, fsize, psize ) );

filter.pipe( paper );
i = 0;
stime = Date.now();
for( ; i < cycles; ++i ) {
    filter.write( sourceBuffer );
    ochecksum.update( sourceBuffer );
}
log( 'original checksum :', ochecksum.digest( 'hex' ) );

filter.pipe( paper );
i = 0;
stime = Date.now();
for( ; i < cycles; ++i ) {
    filter.write( sourceBuffer );
}
filter.end( sourceBuffer );
if ( filter.destroy ) {
    filter.destroy();
    paper.destroy();
}

log( '<- end test 3 ->\n' );

/**/
