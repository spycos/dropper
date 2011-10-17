
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
        // super constructor call is not necessary here, no arguments
        me.constructor.super_.call( me );
        // public vars
        me.sent = 0;
        me.received = 0;
        me.dropSize = dropSize || ( 64 * 1024 );
        // private vars
        me._dpos = 0;
        me._drop = new Buffer( me.dropSize );
        me._cpos = 0;
        me._curry = new Buffer( me.dropSize );
        // cache
        me._i = 0;
        me._cache = null;
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
    if ( ! me._cache ) {
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
        me._cache = me._cache || data;
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
    if ( me._cpos ) {
        drops = me._curry.slice( 0, me._cpos );
        // the last drop falls
        me._cpos = 0;
        me.emit( 'data', drops );
        ++me.sent;
    } else if ( me._dpos ) {
        drops = me._drop.slice( 0, me._dpos );
        // the last drop falls
        me._dpos = 0;
        me.emit( 'data', drops );
        ++me.sent;
    }
    me.emit( 'end' );
};

// pvt methods
dproto._chargeAndSqueeze = function () {
    var me = this,
        drop = me._drop,
        dropSize = me.dropSize,
        clen = me._cache.length;
        me._i = me._i || 0;
    if ( me._dpos ) {
        // dropper is not empty copy data from cache to drop
        me._cache.copy( drop, me._dpos, 0, dropSize - me._dpos );
        me._i = dropSize - me._dpos;
        me._dpos = 0;
        ++me.sent;
        // a drop falls
        me.emit( 'data', drop );
    } else {
        // dropper is empty
        if ( dropSize <= clen - me._i  ) {
            // a drop fits
            var offset = me._i + dropSize;
            me._cache.copy( drop, 0, me._i, offset );
            // reset drop pos
            me._dpos = 0;
            if ( offset > clen ) {
                // last data, reset cache
                me._i = 0;
                me._cache = null;
            } else {
                me._i = offset;
            }
            ++me.sent;
            // a drop falls
            me.emit( 'data', drop );
        } else {
            // curry data, copy and update drop pos
            me._cache.copy( drop, 0, me._i, clen );
            me._dpos = clen - me._i;
            // reset cache
            me._i = 0;
            me._cache = null;
            // internally resume the stream
            me.resume();
        }
    }
};
        
dproto._squeeze = function ( data ) {
    var me = this,
        drop = me._drop,
        dropSize = me.dropSize,
        dlen = data.length;    
    if ( me._dpos > 0 ) {
        // dropper is not empty
        if ( me._cpos ) {
            me._curry.copy( drop, 0, 0, me._cpos );
            me._cpos = 0;
        }
        if ( dlen + me._dpos <= dropSize ) {
            data.copy( drop, me._dpos, 0, dlen );
            me._dpos += dlen;
            if ( me._dpos === dropSize ) {
                me._dpos = 0;
                // a drop falls
                me.emit( 'data', drop );
                ++me.sent;
            } else {
                log( 'drop', drop, dlen );
            }
        } else {
            data.copy( drop, me._dpos, 0, dropSize - me._dpos );
            // a drop falls
            ++me.sent;
            me.emit( 'data', drop );
            data.copy( me._curry, 0, dropSize - me._dpos, dlen );
            me._dpos += dlen - dropSize;
            me._cpos = me._dpos;
        }
    } else {
        // dropper is empty
        me._dpos = dlen;
        if ( me._dpos === dropSize ) {
            me._dpos = 0;
            // a drop falls
            ++me.sent;
            me.emit( 'data', data );
        } else {
            data.copy( drop, 0, 0, dlen );
        }
    }
};

exports.dropper = dropper;
