/*!
 * dropper
 * Copyright(c) 2011 Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

/**
 * Library version 0.0.6
 */

exports.version = '0.0.6';

var log = console.log,
    stream = require( 'stream' ).Stream,
    util = require( 'util' ),
    dropper = function ( dropSize, opt ) {
        var me = this,
            pad = opt && opt.pad;
        me.writable = true;
        me.readable = true;
        // super constructor call is not necessary here, no arguments
        me.constructor.super_.call( me );
        // public vars
        me.dropSize = dropSize || ( 64 * 1024 );
        me.pad = ( typeof pad === 'number' ) ? pad & 255 : false;
        me.sent = 0;
        me.received = 0;
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
    var me = this;
    ++me.received;
    if ( data.length > me.dropSize ) {
        // packet size > dropSize;
        me._chargeAndSqueeze( data );
    } else {
        // packet size <= dropSize;
        me._squeeze( data );
    }
    return true;
};

dproto._chargeAndSqueeze = function ( data ) {
    var me = this,
        dropSize = me.dropSize,
        dlen = data.length,
        offset = 0;
    if ( me._cpos ) {
        // dropper is not empty
        offset = dropSize - me._cpos;
        data.copy( me._drop, me._cpos, 0, offset );
        // a drop falls
        ++me.sent;
        me.emit( 'data', me._drop );
    }
    // fill up, then squeeze the dropper
    var i = offset,
        j = i + dropSize;
    for ( ; ; i = j, j += dropSize ) {
        if ( j > dlen - 1 ) {
              me._cpos = dlen - i;
              if ( j === dlen ) {
                  me._cpos = 0;
                  // a drop falls
                  ++me.sent;
                  me.emit( 'data', data.slice( i, j ) );
              } else {
                  me._drop = new Buffer( dropSize );
                  data.copy( me._drop, 0, i, dlen );
              }
              break;
          }
          me._cpos = 0;
          // a drop falls
          ++me.sent;
          me.emit( 'data', data.slice( i, j ) );
      }
};

dproto._squeeze = function ( data ) {
    var me = this,
        dropSize = me.dropSize,
        dlen = data.length,
        offset = 0;

    if ( me._cpos ) {
        // dropper is not empty
        offset = dropSize - me._cpos;
        if ( offset >= dlen ) {
            data.copy( me._drop, me._cpos, 0, dlen );
            me._cpos += dlen;
            if ( me._cpos === dropSize ) {
                me._cpos = 0;
                // a drop falls
                ++me.sent;
                me.emit( 'data', me._drop );
            }
        } else {
            data.copy( me._drop, me._cpos, 0, offset );
            // a drop falls
            ++me.sent;
            me.emit( 'data', me._drop );
            
            me._drop = new Buffer( dropSize );
            data.copy( me._drop, 0, offset, dlen );
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
};

dproto.end = function () {
    var me = this,
        ldrop = null,
        drop = me._drop,
        pos = me._cpos,
        pad = me.pad;
    // empty the dropper if contains something
    if ( pos ) {
        if ( pad || pad === 0 ) {
            var dropSize = me.dropSize;
                offset = dropSize - pos;
                i = 0;
            // create padding
            ldrop = new Buffer( dropSize );
            for ( ; i < offset ; ldrop[ i++ ] = pad );
            for ( offset = 0; i < dropSize; ldrop[ i++ ] = drop[ offset++ ] );
        } else {
            ldrop = drop.slice( 0, pos );
        }
        me._cpos = 0;
        me._drop = null;
        // the last drop falls
        ++me.sent;
        me.emit( 'data', ldrop );
    }
    me.emit( 'end' );
};

exports.dropper = dropper;

