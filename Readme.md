
# Dropper

__Dropper__ is a filter stream that produces fixed size data packets, from every other stream.". It simply "slows down" or "bufferizes" data packets, from a source stream, depending on the size of the packets received and the size of output buffer specified.
---------

###Installation

> **Current Stable Version: 0.0.1 , compatible with nodeJS >= v0.4.x**

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

> Try this, or just run the __[example]()__ :

``` javascript
  var log = console.log,
      dropper = require( 'dropper' ),
      path = __filename, // <- a test file path
      filter = new Dropper( 36 ); // output -> 36 bytes data packets

  filter.on( 'data', function ( data ) {
      log( 'data:', data );
  } );
  
  stream = fs.createReadStream( path, { bufferSize : 60 } ); // output -> 60 bytes packets
  ..
  stream.pipe( filter, { end : true } );
  ..
  
```
----------
###Run Tests

> Just :


``` bash
 $ node test/data_integrity.js
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
