var log = console.log,
    assert = require( 'assert' ),
    crypto = require( 'crypto' ),
    os = require( 'os' ),
    fs = require( 'fs' ),
    // switch block-stream or dropper
    useBlockStream = ( process.argv.length > 2 ) ? ( ( process.argv[ 2 ] & 1 ) ? true : false ) : false,
    Dropper = require( ( useBlockStream ) ? 'block-stream' : '../index' ),
    // colors
    rc = '', gc = '', yc = '', tc = '', bc = '', xc = '', ec = '', wc = '',
    color = ( os.type() === 'Linux' ) ? (
      ( rc = '\033[1;31m' ) && ( gc = '\033[1;32m' ) && ( yc = '\033[1;33m' ) &&
        ( tc = '\033[1;44m' ) && ( bc = '\033[1;39m' ) && ( xc = '\033[1;35m' ) &&
          ( wc = '\033[1;42m') && ( ec = '\033[0m' ) ) : null,
    // vars
    isize = 0, tsize = 0, fsize = 0, psize = 0, cycles = 0, 
    wtime = 0, ftime = 0, stime = 0, expected = 0,
    filter = null, paper = null, stack = null,
    rstart = null, rend = null, pstart = null, pend = null,
    hash = {},
    // methods
    recTime = function () {
        var me = this,
            stream = hash[ me.info ],
            elapsed = 0;
            
        if ( stream ) { 
            stream.time.end = Date.now();
            stream.packets.counter += 1;
            if( stream.packets.counter >= stream.packets.expected ) {
                elapsed = stream.time.end - stream.time.start;
                log( tc + me.info + ' stream ->', ec, '\n' + bc, stream  );
                ( stream.packets.counter > stream.packets.expected ) ? 
                    log( rc + 'Damn! packets received are more than expected!' + ec ) : null;
                log( wc + 'elapsed time:', elapsed, 'ms', ec, '\n' );
            }
        } else {
            stream = hash[ me.info ] = {
                packets : {
                    expected : me.expected,
                    counter : 0
                },
                time : {
                    start : Date.now(),
                    end : null
                }
            };
        }
    },
    writeData = function ( stream, howmanytimes, packetsize, totalsize ) {
        var i = 0,
            j = 0,
            expected = Math.ceil( howmanytimes * totalsize / packetsize );
        recTime.bind( { info : 'source', expected : expected } )();        
        for ( ; i < howmanytimes; ++i ) {
            for ( j = packetsize; j <= totalsize; j += packetsize ) {
                stream.write( stack.slice( j - packetsize, j ) );
                recTime.bind( { info : 'source', expected : expected } )()
            }
        }
        stream.end();
    },
    go = function ( ) {
        log( yc + 'piping ( bytes ):', isize, '->', fsize, '->', psize, ec, '\n' );
        hash = {};
        filter = new Dropper( fsize, { nopad : true } ); // <- { nopad : true } is only for block-stream lib
        expected = Math.ceil( cycles * tsize / fsize );
        fstart = recTime.bind( {
            info : 'filter',
            expected : expected
        } );
        fend = recTime.bind( {
            info : 'filter'
        } );
        filter.on( 'data', fstart );
        filter.on( 'end', fend );
        
        paper = new Dropper( psize, { nopad : true } ); // <- { nopad : true } is only for block-stream lib
        expected = Math.ceil( cycles * tsize / psize );
        pstart = recTime.bind( {
            info : 'paper',
            expected : expected
        } );
        pend = recTime.bind( { info : 'paper' } );
        paper.on( 'data', pstart );
        paper.on( 'end', pend );
        
        filter.pipe( paper );
        writeData( filter, cycles, isize, tsize );
    },
    init = function () {
        tsize = 64 * 1024; // bytes
        stack = new Buffer( tsize, { nopad : true } );  // <- { nopad : true } is only for block-stream lib
        log( '\n' + rc, 'Using', ( ( useBlockStream ) ? 'block-stream' : 'dropper' ), 'library..', ec, '\n' );
        log( tc, 'Filling the stack buffer with', ( tsize / 1024 / 1024 ).toFixed( 2 ), 'MBytes of data', ec );
        for ( i = 0; i < tsize; stack[ i++ ] = i & 255 );
    }; 


init();

log( '\n' + gc + '-> starting test 1 <-' + ec + '\n' );
cycles = 1024;
isize = 64 * 1024;
fsize = psize = isize;
go();

log( '\n' + gc + '-> starting test 2 <-' + ec + '\n' );
cycles = 1;
isize = 64 * 1024;
fsize = Math.ceil( isize * 3.141516 );
psize = Math.ceil( isize / 6 );
go();

log( '\n' + gc + '-> starting test 3 <-' + ec + '\n' );
cycles = 256;
isize = 64 * 1024;
fsize = Math.ceil( 1 + isize / 2 );
psize = Math.ceil( isize - 1 );
go();
