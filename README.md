async5
======

Asynchronous (non-blocking) Javascript and CSS Loader

#Features#
----------
* Load JS files without blocking and in parallel
* Load CSS files
* Execute a callback function after loading a JS file asynchronously
* Execute independent JS files independently from the call order
* Avoid loading a JS file twice if the HTTP cache is missing (same domain or cross domain)
* Avoid executing a JS file twice if called twice
* Load JS files outside the "same domain" policy
* Ability to define names for JS or CSS files
* Ability to pre-define dependencies in the <head> or somewhere central
* Aggregation support with "provides" feature

#Compatibility#
---------------
async5.js uses "DOM Level 2 Core" and "DOM Level 2 Event" APIs. The following browsers are known to support the required "DOM Level 2" APIs hence async5.js is expected to be compatible with them:
* Internet Explorer 6 and later
* Chrome 1.0 and later
* Firefox 1.5 and later
* Safari 1.0 and later
* Opera 7 and later

async5.js has been tested to work with;

Desktop Browsers:
* IE6, IE7, IE8, IE9, IE10
* Chrome 24, Chrome 25
* Firefox 18, Firefox 19
* Safari 5.1, Safari 6
* Opera 12.14

Mobile Browsers:
* iOS 6.0.1 / Mobile Safari 6
* Android 4.1.1 / Chrome 18
* Andorid 4.1.1 / Webkit Browser 4.0
* Android 4.0.4 / Webkit Browser 4
* Windows Phone 7 / IE Mobile 9

#Basic Usage#
-----------
Load the async5.js in the HEAD section with a html script tag and then call async5.load() method with appropriate parameters.
```html
<HTML>
<HEAD>
    <script type="text/javascript" src="http://example.com/async5.js"></script>
    <script type="text/javascript>
        async5.load({
            name: 'jQuery',
            url: 'http://code.jquery.com/jquery-1.9.1.min.js',
            type: 'js',
            callback: function() {
                window.alert('jQuery is loaded');
            }
        });
    </script>
</HEAD>
<BODY>...</BODY>
</HTML>
```

It's also possible to call the async5.load() method in the BODY section:

```html
<HTML>
<HEAD>
    <script type="text/javascript" src="http://example.com/async5.js"></script>
</HEAD>
<BODY>
......
......
......
    <script type="text/javascript>
        async5.load({
            name: 'jQuery',
            url: 'http://code.jquery.com/jquery-1.9.1.min.js',
            type: 'js',
            callback: function() {
                window.alert('jQuery is loaded');
            }
        });
    </script>
.....
.....
.....
</BODY>
</HTML>
```

#Methods#
---------
## async5.define(name, type, url[, dependsOn, provides]) ##
This method is used to define a javascript or stylesheet without loading it until it's requested with async5.load() method. This method can be used to create a repository of all javascripts and stylesheets for your project in a central location (ie. repository.js file). You may then load that repository.js file right after async5.js in the HEAD section of the html and call the asyn5.load('name') method only for the scripts that you need on a particular page.

####name####

**Type:** String or Object or Array of Objects

A string containing the name for the script or stylesheet. This string will be used for dependency resolution. Each script/stylesheet must have a unique name.

Or,

An Object with name, type, url, dependsOn, provides properties.

Or,

An Array of objects given above.

####type####

**Type:** Enum

Can take the values 'js' or 'css'

####url####

**Type:** String

A string containing the URL of the script or stylesheet

####dependsOn####

**Type:** Array

Array of Strings containing list of the names for the dependencies. Async5.js will make sure that all dependencies are loaded before loading this script.

####provides####
**Type:** Array

Array of Strings containing list of the names of the scripts included in this particular script.

## async5.load(name [, callback, type, url, dependsOn, provides]) ##
This method loads a javascript or stylesheet. If "dependsOn" parameter is given asn an array, dependencies are loaded, first. If the "callback" parameter is defined and it's a closure, then the callback function will be executed as soon as the script is loaded.

####name####

**Type:** String or Object or Array of Objects

A string containing the name for the script or stylesheet. This string will be used for dependency resolution. Each script/stylesheet must have a unique name.

Or,

An Object with name, callback, type, url, dependsOn, provides properties.

Or,

An Array of objects given above.

####callback####

**Type:** Closure (function) or FALSE

A closure which will be called as soon as the script or stylesheet is loaded

####type####

**Type:** Enum

Can take the values 'js' or 'css'

####url####

**Type:** String

A string containing the URL of the script or stylesheet

####dependsOn####

**Type:** Array

Array of Strings containing list of the names for the dependencies. Async5.js will make sure that all dependencies are loaded before loading this script.

####provides####
**Type:** Array

Array of Strings containing list of the names of the scripts included in this particular script.

## async5.ready(name, callback) ##
This method triggers the callback function as soon as the named script is loaded.

####name####

**Type:** String

A string containing the name for the script or stylesheet. This string will be used for dependency resolution. Each script/stylesheet must have a unique name.

####callback####

**Type:** Closure (function) or FALSE

A closure which will be called as soon as the script or stylesheet is loaded


## Several different ways for calling the methods ##

#### Calling the method with parameters ####
```js
async5.load(
    'jQuery',
    'http://code.jquery.com/jquery-1.9.1.min.js',
    'js',
    function() {
        window.alert('jQuery is loaded'); 
    }
);
```
#### Calling the method with a plain object ####
```js
async5.load({
    name: 'jQuery',
    url: 'http://code.jquery.com/jquery-1.9.1.min.js',
    type: 'js',
    callback: function() {
        window.alert('jQuery is loaded');
    }
});
```

#### Calling the method with an array of objects ####
```js
async5.load([
{
    name: 'jQuery',
    url: '//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js',
    type: 'js',
    callback: function() {
        window.alert('jQuery is loaded');
    }
},
{
    name: 'jQueryUI',
    url: '//ajax.googleapis.com/ajax/libs/jqueryui/1.10.2/jquery-ui.min.js',
    type: 'js',
    dependsOn: ['jQuery']
    callback: function() {
        window.alert('jQueryUI is loaded');
    }
}
]);
```

The same rules apply to async5.define() method. It can be called with functions parameters, with an object or with an array of objects.

#More Examples#
-------------
### Loading a CSS file ###
Call async5.load function somewhere in the page (in the HEAD or the BODY)
```html
<script type="text/javascript">
    async5.load({
        name: 'sample',
        url: 'http://example.com/sample.css',
        type: 'css'
    });
</script>
```

### Defining dependencies ###
Call the async5.define function anywhere in the page
```html
<script type="text/javascript">
    async5.define([
        {
            name: 'lazyLoad',
            url: 'http://example.com/jquery.lazyload.js',
            type: 'js',
            dependsOn: ['jQuery']
        },
        {
            name: 'jQuery',
            url: '//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js',
            type: 'js'
        },
        {
            name: 'jQueryUI',
            url: '//ajax.googleapis.com/ajax/libs/jqueryui/1.10.2/jquery-ui.min.js',
            type: 'js',
            dependsOn: ['jQuery']
        }

    ]);
</script>
```
Loading a previously defined Javascript file by calling it with it's name

```html
<script type="text/javascript">
    async5.load({ 
        name: 'lazyLoad',
        callback: function() {
             window.alert('lazyLoad is loaded');
        }
    });
</script>
```

When you call async5.load method for 'lazyLoad', async5 checks if the 'lazyLoad' has any dependencies. If there are dependencies, it loads and execute each dependent file and then loads and executes the 'lazyLoad' script. If a dependency has already been loaded then it will not be loaded or executed again.

### Aggregated files support  ###
```html
<script type="text/javascript">
    async5.define([
        {
            name: 'jQuery',
            url: 'http://code.jquery.com/jquery-1.9.1.min.js',
            type: 'js'
        },
        {
            name: 'combined',
            url: 'http://example.com/combined.js',
            type: 'js'
            provides: ['jQuery', 'jQueryUI']
        },
        {
            name: 'lazyLoad',
            url: 'http://example.com/jquery.lazyload.js',
            type: 'js',
            dependsOn: ['jQuery']
        }
    ]);
    
    asyn5.load(
        ['combinded', 'lazyLoad']
    );

</script>
```

This example loads 'combined' and 'lazyLoad' but does not load 'jQuery' because jQuery is already included in the 'combined' script.

#To Do#
-------
* Ability to define timeout for loading JS/CSS files
* Ability to define callback function which will be triggered when loading of a JS/CSS file fails

#License#
---------
Copyright 2013 Berke Ediz Demiralp

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
