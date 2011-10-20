# Dropper

> __Dropper__ is a ( nodeJS ) __filter stream__ that produces __fixed size__ data packets from __any stream__, mantaining __very good perfomances__ .

> __Dropper__ inherits from __Stream__, then you can use it in the way you __already__ use other streams
> ( _pausing_, _resuming_, _writing_.. ) .

> It simply _"divides"_ or _"bufferizes"_ incoming data packets, depending on whether 
> the received packet is smaller or larger than its own capacity.

---------

###Installation

> **Current __Stable__ Version: 0.0.7 , compatible with nodeJS >= v0.4.x**

> with __npm__ :

``` bash
 $ npm install dropper
```

> or clone with __git__ :


``` bash
 $ git clone git://github.com/rootslab/dropper.git
```
---------

###Simple Usage

``` javascript
  var opt = { pad : 0x0 }, // <- add leading 0s to last packet for mantaining a constant size 
      dropSize = 64 * 1024, // <- default bytes value
      filter = new dropper( dropSize, opt );
```

> Try this, or just run the __[example](https://github.com/rootslab/dropper/blob/master/examples/)__ :

``` javascript
  var log = console.log,
      Dropper = require( 'dropper' ),
      path = __filename, // <- a test file path
      filter = new Dropper( 36 ); // output -> 36 bytes data packets

 /*
  * all data packets will have fixed length ( dropSize ),
  * except the last that could be <= dropSize
  */  
  filter.on( 'data', function ( data ) {
      log( 'data:', data );   // <- print data ( do something with data )
  } );
  
  /*
  * stream output -> 60 bytes packets, it's the max limit,
  * packets are not guaranteed to have fixed size.
  */
  stream = fs.createReadStream( path, { bufferSize : 60 } );
  ..
  
 /*
  *  nodeJS versions < 0.5 don't support pipe chaining,
  *  because don't return the destination stream.
  *  With dropper pipe(), instead, is always possible.
  */
  stream.pipe( filter );
  filter.pipe( fs.createWriteStream( __dirname + '/drops.txt' ) );
  ..
  
```
----------
###Run Tests

> Just :


``` bash
 $ node test/data_integrity.js
 $ node test/benchmark.js [ 1 ] // <- a truthy value for switching from dropper to block-stream module use
```

## License 

(The MIT License)

Copyright (c) 2011 Guglielmo Ferri &lt;44gatti@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
