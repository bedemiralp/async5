/**
 * @license
 * async5.js <https://github.com/bedemiralp/async5>
 * Copyright 2013 Berke Ediz Demiralp
 * Licensed under the Apache License, Version 2.0
 */
(function (global) {
    'use strict';
    global.async5 = {

        /**
         * @type {Object.<string, Object>}
         * @private
         * @dict
         */
        _files: {},

        /**
         * @param {string} name
         * @param {function()} callback
         * @private
         */
        _loadAfterDependencies: function (name, callback) {

            var i, j, provided, dependencyName, file = this._files[name];

            // the state of files provided by this file are being changed to 1
            for (j = 0; j < file.provides.length; j++) {
                provided = file.provides[j];
                if (this._files[provided].state < 1) {
                    this._files[provided].state = 1;
                }
            }

            // if the file has been requested but the url is not known yet
            if (file.isRequested && file.state === 0) {

                // if there are no dependencies for this file
                if (file.numberOfPendingDependencies === 0) {
                    file.state = 1;

                    // bind the callback function to the 'loaded' event of file
                    if (callback && typeof callback === 'function') {
                        file.loaded.addOnce(callback);
                    }

                    // load the file
                    this._loadFile(file.url, file.type, file._triggerLoaded);

                    // if there are one more dependencies
                } else {

                    // bind the callback function to the 'loaded' event of this file
                    if (callback && typeof callback === 'function') {
                        file.loaded.addOnce(callback);
                    }

                    // load each dependency
                    for (i = 0; i < file.dependsOn.length; i++) {
                        dependencyName = file.dependsOn[i];
                        this._files[dependencyName].isRequested = true;
                        this._loadAfterDependencies(dependencyName);
                    }
                }
            } else if (file.state >= 2 && callback && typeof callback === 'function') {
                // if the file has already been loaded then fire the callback function
                callback();
            }

        },
        /**
         *
         * @param {string|Array} name
         * @param {string} type
         * @param {string} url
         * @param {Array} dependsOn
         * @param {Array} provides
         * @private
         * @constructor
         */
        _file: function (name, type, url, dependsOn, provides) {

            this.loaded = new global.async5.signals.Signal();

            this.name = name;
            this.type = type;

            if (url) {
                this.url = url;
            } else {
                this.url = null;
            }

            // state -1: only the name is known. url is not known yet
            // state 0: url is known
            // state 1: file is being loadede
            // state 2: file has already been loaded
            // state 3: file has been provided by another file (has already been loaded)
            if (url) {
                this.state = 0;
            } else {
                this.state = -1;
            }

            this.isRequested = false;

            this.numberOfPendingDependencies = 0;

            this._onDependencyLoaded = function () {
                if (global.async5._files[name].numberOfPendingDependencies > 0) {
                    global.async5._files[name].numberOfPendingDependencies--;
                }
                global.async5._loadAfterDependencies(name);
            };

            this._triggerLoaded = function () {
                var i, providedName, providedFile;
                global.async5._files[name].state = 2;
                global.async5._files[name].loaded.dispatch(name);

                for (i = 0; i < global.async5._files[name].provides.length; i++) {
                    providedName = global.async5._files[name].provides[i];
                    providedFile = global.async5._files[providedName];
                    if (providedFile.state < 2) {
                        providedFile._triggerLoaded();
                        providedFile.state = 3;
                        providedFile.providedBy = name;
                        providedFile.loaded.removeAll();
                    }
                }
            };

            this._bindDependencies = function (dependsOn) {
                var i, definedDependency;
                if (dependsOn instanceof Array) {
                    for (i = 0; i < dependsOn.length; i++) {

                        if (!global.async5._files[dependsOn[i]]) {
                            global.async5._files[dependsOn[i]] = new global.async5._file(dependsOn[i], type);
                        }

                        definedDependency = global.async5._files[dependsOn[i]];

                        if (definedDependency.state < 2) {
                            this.numberOfPendingDependencies++;
                            definedDependency.loaded.addOnce(this._onDependencyLoaded);
                        }

                    }
                }
            };

            if (dependsOn && dependsOn instanceof  Array) {
                this._bindDependencies(dependsOn);
                this.dependsOn = dependsOn;
            } else {
                this.dependsOn = [];
            }

            if (provides && provides instanceof Array) {
                this.provides = provides;
            } else {
                this.provides = [];
            }

        },

        /**
         *
         * @param {string|object|Array} name
         * @param {string=} type
         * @param {string=} url
         * @param {Array=} dependsOn
         * @param {Array=} provides
         */
        define: function (name, type, url, dependsOn, provides) {
            var i;
            // if 'name' parameter is an array then define each file in array
            if (name instanceof Array) {
                for (i = 0; i < name.length; i++) {
                    this.define(name[i]);
                }
            } else {

                // if 'name' parameter is an object, extract all parameters from it
                if (typeof name === 'object') {
                    if (name.type) {
                        type = name.type;
                    }
                    if (name.url) {
                        url = name.url;
                    }
                    if (name.dependsOn) {
                        dependsOn = name.dependsOn;
                    }
                    if (name.provides) {
                        provides = name.provides;
                    }
                    if (name.name) {
                        name = name.name;
                    }
                }

                // if this file has not been defined
                if (!this._files[name]) {
                    this._files[name] = new this._file(name, type, url, dependsOn, provides);
                } else if (this._files[name] && this._files[name].state === -1) {
                    // if this file has been requested by another file as a dependency before it's been defined
                    this._files[name].url = url;
                    this._files[name].state = 0;

                    if (dependsOn) {
                        this._files[name]._bindDependencies(dependsOn);
                        this._files[name].dependsOn = dependsOn;
                    } else {
                        this._files[name].dependsOn = [];
                    }

                    if (provides) {
                        this._files[name].provides = provides;
                    } else {
                        this._files[name].provides = [];
                    }

                }
            }
        },

        /**
         *
         * @param {string|Array,Object} name
         * @param {function()=} callback
         * @param {string=} type
         * @param {string=} url
         * @param {Array=} dependsOn
         * @param {Array=} provides
         */
        load: function (name, callback, type, url, dependsOn, provides) {
            var i;
            // if 'name' parameter is an array then load each file in array
            if (name instanceof Array) {
                for (i = 0; i < name.length; i++) {
                    this.load(name[i]);
                }
            } else {
                // if 'name' parameter is an object, extract all parameters from it
                if (typeof name === 'object') {
                    if (name.callback) {
                        callback = name.callback;
                    }
                    if (name.type) {
                        type = name.type;
                    }
                    if (name.url) {
                        url = name.url;
                    }
                    if (name.dependsOn) {
                        dependsOn = name.dependsOn;
                    }
                    if (name.provides) {
                        provides = name.provides;
                    }
                    if (name.name) {
                        name = name.name;
                    }
                }

                // define the file first, if it hasn't been defined already
                if (!this._files[name] && name && type && url) {
                    this.define(name, type, url, dependsOn, provides);
                }

                // load the file if it's already been defined
                if (this._files[name]) {
                    this._files[name].isRequested = true;
                    this._loadAfterDependencies(name, callback);
                }
            }

        },

        /**
         *
         * @param {string} name
         * @param {function()} callback
         */
        ready: function(name, callback) {
            this.load(name, callback);
        },

        /**
         *
         * @param {string} url
         * @param {string} type
         * @param {function()=} callback
         * @param {number=} timeout
         * @param {function()=} fallback
         * @private
         */
        _loadFile: function (url, type, callback, timeout, fallback) {
            var newElement, loadTimeout;

            function abort() {

                clearTimeout(loadTimeout);

                if (newElement) {
                    newElement.onload(0, true);
                }
                if (fallback) {
                    fallback();
                }

            }

            function async_load() {

                if (window.attachEvent) {
                    window.detachEvent('onload', async_load);
                } else {
                    window.removeEventListener('load', async_load, false);
                }

                if (type === 'js') {
                    newElement = document.createElement('script');
                    newElement.type = 'text/javascript';
                    newElement.src = url;
                    newElement.async = true;
                } else if (type === 'css') {
                    newElement = document.createElement('link');
                    newElement.setAttribute('rel', 'stylesheet');
                    newElement.type = 'text/css';
                    newElement.href = url;
                } else {
                    return false;
                }

                var head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
                newElement.onload = newElement.onreadystatechange = function (event, abort) {

                    if (abort || !newElement.readyState || /loaded|complete/.test(newElement.readyState)) {

                        newElement.onload = newElement.onreadystatechange = null;
                        newElement = null;

                        // Callback if not abort
                        if (!abort) {
                            if (callback) {
                                callback();
                            }
                        }
                    }

                };

                head.appendChild(newElement);

                if (timeout) {
                    loadTimeout = setTimeout(function () {
                        abort();
                    }, timeout);
                }

            }

            if (/loaded|complete/.test(document.readyState)) {
                async_load();
            } else if (window.attachEvent) {
                window.attachEvent('onload', async_load);
            } else {
                window.addEventListener('load', async_load, false);
            }

        }

    };
}(this));

/**
 * @license
 * JS Signals <http://millermedeiros.github.com/js-signals/>
 * Released under the MIT license
 * Author: Miller Medeiros
 * Version: 1.0.0 - Build: 268 (2012/11/29 05:48 PM)
 */
(function(i){function h(a,b,c,d,e){this._listener=b;this._isOnce=c;this.context=d;this._signal=a;this._priority=e||0}function g(a,b){if(typeof a!=="function")throw Error("listener is a required param of {fn}() and should be a Function.".replace("{fn}",b));}function e(){this._bindings=[];this._prevParams=null;var a=this;this.dispatch=function(){e.prototype.dispatch.apply(a,arguments)}}h.prototype={active:!0,params:null,execute:function(a){var b;this.active&&this._listener&&(a=this.params?this.params.concat(a):
    a,b=this._listener.apply(this.context,a),this._isOnce&&this.detach());return b},detach:function(){return this.isBound()?this._signal.remove(this._listener,this.context):null},isBound:function(){return!!this._signal&&!!this._listener},isOnce:function(){return this._isOnce},getListener:function(){return this._listener},getSignal:function(){return this._signal},_destroy:function(){delete this._signal;delete this._listener;delete this.context},toString:function(){return"[SignalBinding isOnce:"+this._isOnce+
    ", isBound:"+this.isBound()+", active:"+this.active+"]"}};e.prototype={VERSION:"1.0.0",memorize:!1,_shouldPropagate:!0,active:!0,_registerListener:function(a,b,c,d){var e=this._indexOfListener(a,c);if(e!==-1){if(a=this._bindings[e],a.isOnce()!==b)throw Error("You cannot add"+(b?"":"Once")+"() then add"+(!b?"":"Once")+"() the same listener without removing the relationship first.");}else a=new h(this,a,b,c,d),this._addBinding(a);this.memorize&&this._prevParams&&a.execute(this._prevParams);return a},
    _addBinding:function(a){var b=this._bindings.length;do--b;while(this._bindings[b]&&a._priority<=this._bindings[b]._priority);this._bindings.splice(b+1,0,a)},_indexOfListener:function(a,b){for(var c=this._bindings.length,d;c--;)if(d=this._bindings[c],d._listener===a&&d.context===b)return c;return-1},has:function(a,b){return this._indexOfListener(a,b)!==-1},add:function(a,b,c){g(a,"add");return this._registerListener(a,!1,b,c)},addOnce:function(a,b,c){g(a,"addOnce");return this._registerListener(a,
        !0,b,c)},remove:function(a,b){g(a,"remove");var c=this._indexOfListener(a,b);c!==-1&&(this._bindings[c]._destroy(),this._bindings.splice(c,1));return a},removeAll:function(){for(var a=this._bindings.length;a--;)this._bindings[a]._destroy();this._bindings.length=0},getNumListeners:function(){return this._bindings.length},halt:function(){this._shouldPropagate=!1},dispatch:function(a){if(this.active){var b=Array.prototype.slice.call(arguments),c=this._bindings.length,d;if(this.memorize)this._prevParams=
        b;if(c){d=this._bindings.slice();this._shouldPropagate=!0;do c--;while(d[c]&&this._shouldPropagate&&d[c].execute(b)!==!1)}}},forget:function(){this._prevParams=null},dispose:function(){this.removeAll();delete this._bindings;delete this._prevParams},toString:function(){return"[Signal active:"+this.active+" numListeners:"+this.getNumListeners()+"]"}};var f=e;f.Signal=e;typeof define==="function"&&define.amd?define(function(){return f}):typeof module!=="undefined"&&module.exports?module.exports=f:i.signals=
    f})(async5);