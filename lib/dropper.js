
/*!
 * dropper
 * Copyright(c) 2011 Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

/**
 * Library version 0.0.1
 */

exports.version = '0.0.1';

var log = console.log,
    stream = require( 'stream' ).Stream,
    util = require( 'util' ),
    dropper = function ( dropSize ) {
        var me = this;
        me.writable = true;
        me.readable = true;
        me.constructor.super_.call( me ); // it's not necessary here, but it's a good habit
        me.dropSize = dropSize || ( 64 * 1024 );
        me.drop = new Buffer( me.dropSize );
        me.dpos = 0;
        me.curry = new Buffer( me.dropSize );
        me.cpos = 0;
        me.received = 0;
        me.sent = 0;
    },
    dproto;

util.inherits( dropper, stream );

dproto = dropper.prototype;

dproto.pause = function () {
    var me = this;
    me.emit( 'pause' );
};

dproto.resume = function () {
    var me = this;
    me.emit( 'resume' );
};

dproto.destroy = function () {
    var me = this;
    me.emit( 'close' );
};

dproto.pipe = function ( dest, options ) {
    var me = this;
    var d = dproto.__proto__.pipe.apply( me, arguments );
    // nodeJS 0.4.x Stream.pipe() doesn't return 
    // the destination stream, manually added the code 
    return ( d || dest );
};

dproto.write = function ( data ) {
    var me = this,
        drop = me.drop,
        dropSize = me.dropSize,
        dlen = data.length,
        offset = 0;
        
    ++me.received;
    
    if ( dlen > me.dropSize ) {
        // packet size > dropSize;
        if ( me.dpos > 0 ) {
            // dropper is not empty
            data.copy( drop, me.dpos, 0, dropSize - me.dpos );
            offset = dropSize - me.dpos;
            ++me.sent;
            // a drop falls
            me.emit( 'data', drop );
        }
        // fill up and empty the dropper 
        for ( var i = offset, j = dropSize + i; ; i = j, j += dropSize ) {
            if ( j > dlen - 1 ) {
                  data.copy( drop, 0, i, dlen );
                  me.dpos = dlen - i;
                  if ( me.dpos === dropSize ) {
                      me.dpos = 0;
                      // a drop falls
                      ++me.sent;  
                      me.emit( 'data', drop );
                  }
                  break;
              }            
              data.copy( drop, 0, i, j );
              me.dpos = 0;
              // a drop falls
              me.emit( 'data', drop );
              ++me.sent;
          }
    } else {
        // packet size <= dropSize;
        if ( me.dpos > 0 ) {
            // dropper is not empty
            if ( me.cpos ) {
                me.curry.copy( drop, 0, 0, me.cpos );
                me.cpos = 0;
            }
            if ( dlen + me.dpos <= dropSize ) {
                data.copy( drop, me.dpos, 0, dlen );
                me.dpos += dlen;
                if ( me.dpos === dropSize ) {
                    me.dpos = 0;
                    ++me.sent;
                    // a drop falls
                    me.emit( 'data', drop );
                }
            } else {
                data.copy( drop, me.dpos, 0, dropSize - me.dpos );
                ++me.sent;
                // a drop falls
                me.emit( 'data', drop );
                data.copy( me.curry, 0, dropSize - me.dpos, dlen );
                me.dpos += dlen - dropSize;
                me.cpos = me.dpos;
            }
        } else {
            // dropper is empty
            me.dpos = dlen;
            if ( me.dpos === dropSize ) {
                me.dpos = 0;
                ++me.sent;
                // a drop falls
                me.emit( 'data', data );
            } else {
                data.copy( drop, 0, 0, dlen );
            }
        }
    }
    return true;
};

dproto.end = function () {
    var me = this,
        drops = null;
    // empty the dropper if contains something
    if ( me.cpos ) {
        drops = me.curry.slice( 0, me.cpos );
        // the last drop falls
        me.cpos = 0;
        me.emit( 'data', drops );
        ++me.sent;
    } else if ( me.dpos ) {
        drops = me.drop.slice( 0, me.dpos );
        // the last drop falls
        me.dpos = 0;
        me.emit( 'data', drops );
        ++me.sent;
    }
    me.emit( 'end' );
};

exports.dropper = dropper;
