
/*!
 * dropper
 * Copyright(c) 2011 Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

/**
 * Library version 0.0.3
 */

exports.version = '0.0.3';

var log = console.log,
    stream = require( 'stream' ).Stream,
    util = require( 'util' ),
    dropper = function ( dropSize ) {
        var me = this;
        me.writable = true;
        me.readable = true;
        me.constructor.super_.call( me ); // it's not necessary here, but it's a good habit
        me.dropSize = dropSize || ( 64 * 1024 );
        me.drop = null, //new Buffer( me.dropSize );
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
        //drop = me.drop,
        dropSize = me.dropSize,
        dlen = data.length,
        offset = 0;
        
    ++me.received;
    
    if ( dlen > me.dropSize ) {
        // packet size > dropSize;    
        if ( me.cpos > 0 ) {
            // dropper is not empty
            data.copy( me.drop, me.cpos, 0, dropSize - me.cpos );
            offset = dropSize - me.cpos;
            // a drop falls
            ++me.sent;
            me.emit( 'data', me.drop );
            // me.drop = new Buffer( dropSize );
        }
        // fill up and empty the dropper 
        for ( var i = offset, j = dropSize + i; ; i = j, j += dropSize ) {  
            if ( j > dlen - 1 ) {
                  me.cpos = dlen - i;
                  me.drop = new Buffer( dropSize );
                  if ( me.cpos === dropSize ) {     
                      me.cpos = 0;
                      me.drop = data.slice( i, dlen );
                      // a drop falls
                      ++me.sent;
                      me.emit( 'data', me.drop );
                      me.drop = new Buffer( dropSize );
                  } else {
                      data.copy( me.drop, 0, i, dlen );
                  }
                  break;
              }            
              // data.copy( me.drop, 0, i, j );
              me.drop = data.slice( i, j );
              me.cpos = 0;
              
              // a drop falls
              ++me.sent;
              me.emit( 'data', me.drop );
              //me.drop = new Buffer( dropSize );
          }
    } else {
        // packet size <= dropSize;
        if ( me.cpos > 0 ) {
            // dropper is not empty
            if ( dropSize - me.cpos >= dlen ) {
                data.copy( me.drop, me.cpos, 0, dlen );
                me.cpos += dlen;
                if ( me.cpos === dropSize ) {
                    me.cpos = 0;
                    // a drop falls
                    ++me.sent;
                    me.emit( 'data', me.drop );
                    me.drop = new Buffer( dropSize );
                }
            } else {
                data.copy( me.drop, me.cpos, 0, dropSize - me.cpos );
                // a drop falls
                ++me.sent;
                me.emit( 'data', me.drop );
                me.drop = new Buffer( dropSize );
                data.copy( me.drop, 0, dropSize - me.cpos, dlen );
                me.cpos += dlen - dropSize;
            }
        } else {
            // dropper is empty
            me.cpos = dlen;
            if ( me.cpos === dropSize ) {
                me.cpos = 0;
                // a drop falls
                ++me.sent;
                me.emit( 'data', data );
            } else {
                me.drop = new Buffer( me.dropSize );
                data.copy( me.drop, 0, 0, dlen );
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
        drops = me.drop.slice( 0, me.cpos );
        me.cpos = 0;
        // the last drop falls
        ++me.sent;
        me.emit( 'data', drops );

    }
    me.emit( 'end' );
};

exports.dropper = dropper;

