
/*!
 * dropper
 * Copyright(c) 2011 Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

/**
 * Library version 0.0.2
 */

exports.version = '0.0.2';

var log = console.log,
    stream = require( 'stream' ).Stream,
    util = require( 'util' ),
    dropper = function ( dropSize ) {
        var me = this;
        me.writable = true;
        me.readable = true;
        // super constrctor call is not necessary here, no arguments
        me.constructor.super_.call( me );
        me.dropSize = dropSize || ( 64 * 1024 );
        me.drop = new Buffer( me.dropSize );
        me.dpos = 0;
        me.curry = new Buffer( me.dropSize );
        me.cpos = 0;
        me.received = 0;
        me.sent = 0;
        // cache
        me.i = 0;
        me.cache = null;
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
    if ( ! me.cache ) {
        me.emit( 'resume' );
    } else {
        me._chargeAndSqueeze();
    }
    return me;
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
    var me = this;
    ++me.received;
    if ( data.length > me.dropSize ) {
        // packet size > dropSize;
        me.cache = me.cache || data;
        me._chargeAndSqueeze();
    } else {
        // packet size <= dropSize;
        me._squeeze( data );
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

// pvt methods
dproto._chargeAndSqueeze = function () {
    var me = this,
        drop = me.drop,
        dropSize = me.dropSize,
        clen = me.cache.length;
        me.i = me.i || 0;
    if ( me.dpos ) {
        // drop is not empty copy data from cache to drop
        me.cache.copy( drop, me.dpos, 0, dropSize - me.dpos );
        me.i = dropSize - me.dpos;
        me.dpos = 0;
        ++me.sent;
        // a drop falls
        me.emit( 'data', drop );
    } else {
        // drop is empty
        if ( dropSize <= clen - me.i  ) {
            // a drop fits
            var offset = me.i + dropSize;
            me.cache.copy( drop, 0, me.i, offset );
            // reset drop pos
            me.dpos = 0;
            if ( offset > clen ) {
                // last data, reset cache
                me.i = 0;
                me.cache = null;
            } else {
                me.i = offset;
            }
            ++me.sent;
            // a drop falls
            me.emit( 'data', drop );
        } else {
            // curry data, copy and update drop pos
            me.cache.copy( drop, 0, me.i, clen );
            me.dpos = clen - me.i;
            // reset cache
            me.i = 0;
            me.cache = null;
            // internally resume the stream
            me.resume();
        }
    }
};
        
dproto._squeeze = function ( data ) {
    var me = this,
        drop = me.drop,
        dropSize = me.dropSize,
        dlen = data.length;    
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
                // a drop falls
                me.emit( 'data', drop );
                ++me.sent;
            } else {
                log( 'drop', drop, dlen );
            }
        } else {
            data.copy( drop, me.dpos, 0, dropSize - me.dpos );
            // a drop falls
            ++me.sent;
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
            // a drop falls
            ++me.sent;
            me.emit( 'data', data );
        } else {
            data.copy( drop, 0, 0, dlen );
        }
    }
};

exports.dropper = dropper;
