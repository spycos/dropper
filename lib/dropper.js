
/*!
 * dropper
 * Copyright(c) 2011 Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

/**
 * Library version 0.0.4
 */

exports.version = '0.0.4';

var log = console.log,
    stream = require( 'stream' ).Stream,
    util = require( 'util' ),
    dropper = function ( dropSize ) {
        var me = this;
        me.writable = true;
        me.readable = true;
        // super constructor call is not necessary here, no arguments
        me.constructor.super_.call( me );
        // public vars
        me.sent = 0;
        me.received = 0;
        me.dropSize = dropSize || ( 64 * 1024 );
        // private vars
        me._drop = null;
        me._cpos = 0;
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
    var me = this,
        d = dproto.__proto__.pipe.apply( me, arguments );
    // nodeJS 0.4.x Stream.pipe() doesn't return 
    // the destination stream, manually added the code 
    return ( d || dest );
};

dproto.write = function ( data ) {
    var me = this,
        dropSize = me.dropSize,
        dlen = data.length,
        offset = 0;
    ++me.received;
    
    if ( dlen > dropSize ) {
        // packet size > dropSize;    
        if ( me._cpos > 0 ) {
            // dropper is not empty
            data.copy( me._drop, me._cpos, 0, dropSize - me._cpos );
            offset = dropSize - me._cpos;
            // a drop falls
            ++me.sent;
            me.emit( 'data', me._drop );
        }
        // fill up and squeeze the dropper
        for ( var i = offset, j = dropSize + i; ; i = j, j += dropSize ) {  
            if ( j > dlen - 1 ) {
                  me._cpos = dlen - i;
                  me._drop = new Buffer( dropSize );
                  if ( me._cpos === dropSize ) {     
                      me._cpos = 0;
                      me._drop = data.slice( i, dlen );
                      // a drop falls
                      ++me.sent;
                      me.emit( 'data', me._drop );
                      me._drop = new Buffer( dropSize );
                  } else {
                      data.copy( me._drop, 0, i, dlen );
                  }
                  break;
              }
              me._drop = data.slice( i, j );
              me._cpos = 0;
              // a drop falls
              ++me.sent;
              me.emit( 'data', me._drop );
          }
    } else {
        // packet size <= dropSize;
        if ( me._cpos > 0 ) {
            // dropper is not empty
            if ( dropSize - me._cpos >= dlen ) {
                data.copy( me._drop, me._cpos, 0, dlen );
                me._cpos += dlen;
                if ( me._cpos === dropSize ) {
                    me._cpos = 0;
                    // a drop falls
                    ++me.sent;
                    me.emit( 'data', me._drop );
                    me._drop = new Buffer( dropSize );
                }
            } else {
                data.copy( me._drop, me._cpos, 0, dropSize - me._cpos );
                // a drop falls
                ++me.sent;
                me.emit( 'data', me._drop );
                me._drop = new Buffer( dropSize );
                data.copy( me._drop, 0, dropSize - me._cpos, dlen );
                me._cpos += dlen - dropSize;
            }
        } else {
            // dropper is empty
            me._cpos = dlen;
            if ( me._cpos === dropSize ) {
                me._cpos = 0;
                // a drop falls
                ++me.sent;
                me.emit( 'data', data );
            } else {
                me._drop = new Buffer( dropSize );
                data.copy( me._drop, 0, 0, dlen );
            }
        }
    }
    return true;
};

dproto.end = function () {
    var me = this,
        drops = null;
    // empty the dropper if contains something
    if ( me._cpos ) {
        drops = me._drop.slice( 0, me._cpos );
        me._cpos = 0;
        // the last drop falls
        ++me.sent;
        me.emit( 'data', drops );

    }
    me.emit( 'end' );
};

exports.dropper = dropper;

