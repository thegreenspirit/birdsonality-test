//global zef namespace
var Zef = window.Zef || {};

Zef.loadJQueryAndCreatePlayer = function() {
    var scriptEl    = document.createElement("script");
    scriptEl.type   = "text/javascript";
    //scriptEl.src    = "/js/jquery-1.5.2.min.js";
    scriptEl.src = "//ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js";
    //scriptEl.src = "//ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.js";
    function calltheCBcmn() {
        zefJQuery = jQuery;
        zefJQuery(document).ready(function() {
            Zef.jqueryLoaded();
        });
    }

    if(typeof(scriptEl.addEventListener) != 'undefined') {
        /* The FF, Chrome, Safari, Opera way */
        scriptEl.addEventListener('load',calltheCBcmn,false);
    }
    else {
        /* The MS IE 8+ way (may work with others - I dunno)*/
        function handleIeState() {
            if(scriptEl.readyState == 'loaded' || scriptEl.readyState == 'complete'){
                zefJQuery = jQuery;
                zefJQuery(document).ready(function() {
                    Zef.jqueryLoaded();
                });
            }
        }
        var ret = scriptEl.attachEvent('onreadystatechange',handleIeState);
    }
    if(typeof jQuery !== 'undefined') {
        Zef._zefJQueryOrig = jQuery;
    }
    document.getElementsByTagName("head")[0].appendChild(scriptEl);
};

Zef._ZefPlayerReady = false;
Zef._ZefPlayerQueue = [];
Zef._servlet = 'PlayerTestServlet';
if(typeof Zef._dataServer == 'undefined' || Zef._dataServer == null) {
	Zef._dataServer = Zef._host;	
}
Zef.jqueryLoaded = function() {
    Zef.loadScripts();
};

Zef.loadScripts = function() {
    Zef.evalScripts(Zef._scripts);
};

Zef.loadScriptDebug = function(src, callback) {
    var scriptEl    = document.createElement("script");
    scriptEl.type   = "text/javascript";
    scriptEl.src    = src;

    if(typeof(scriptEl.addEventListener) != 'undefined') {
        /* The FF, Chrome, Safari, Opera way */
        scriptEl.addEventListener('load',callback,false);
    }
    else {
        /* The MS IE 8+ way (may work with others - I dunno)*/
        function handleIeState() {
            if(scriptEl.readyState == 'loaded' || scriptEl.readyState == 'complete'){
                callback();
            }
        }
        var ret = scriptEl.attachEvent('onreadystatechange',handleIeState);
    }
    if(typeof jQuery !== 'undefined') {
        Zef._zefJQueryOrig = jQuery;
    }
    document.getElementsByTagName("head")[0].appendChild(scriptEl);  
};

Zef.evalScripts = function(data) {
    var that = this;
    (that.loadScript = function(loadPos) {
        if(loadPos >= data.scripts.length) {
            Zef.afterScriptLoad();
        } else {
            if(data.scripts[loadPos].indexOf('BlobLoader')>-1 && data.scripts[loadPos].indexOf('type=css') >-1) {
                var css = zefJQuery("<link>");
                css.attr({
                    rel:  "stylesheet",
                    type: "text/css",
                    href: data.scripts[loadPos]
                });
                zefJQuery("head").append(css);
                that.loadScript(loadPos + 1);
            } else {
                //if(Zef._debug) {
                    Zef.loadScriptDebug(data.scripts[loadPos], function() {that.loadScript(loadPos+1);});
                /*} else {
                    zefJQuery.getScript(data.scripts[loadPos], function() {that.loadScript(loadPos+1);});
                }*/
            }
        }
    })(0);
};

Zef.afterScriptLoad = function() {
    //now all scripts and plugins have been loaded to our jQuery.. if another was loaded before ours, release it
    if(typeof Zef._zefJQueryOrig !== 'undefined') {
        jQuery = Zef._zefJQueryOrig;
    }
    jQuery.noConflict();
    zefJQuery.fn.removeWithoutLeaking = function() {
        this.each(function(i,e){
            if( e.parentNode )
                e.parentNode.removeChild(e);
        });
    };
    Zef._zefPlayer = new Zef.Player();
    Zef._zefPlayer.id = Zef._playerId;
    Zef._zefPlayer.init();
    Zef._zefPlayer.loadDoneCallback = checkZefPlayerQueue;
    Zef._zefPlayer.load();
    if(typeof Zef._tags !== 'undefined') {
        Zef._zefPlayer.addTags(Zef._tags.split(','));
    }
    if(typeof zef_player_loaded === 'function') {
    	zef_player_loaded();
    }
};

Zef.setAnswerer = function(answererKey) {
   if(Zef._ZefPlayerReady == false) {
        //Zef._ZefPlayerQueue.push(['Zef._zefPlayer.setZefId', zefId]);
        Zef._ZefPlayerQueue.push(['Zef._zefPlayer.setAnswererKey', answererKey])
    } else {
        Zef._zefPlayer.setAnswererKey(answererKey);
    }
};

Zef.addNamedTag = function(tagName, value) {
   if(Zef._ZefPlayerReady == false) {
        Zef._ZefPlayerQueue.push(['Zef._zefPlayer.addTags', [tagName+'='+value]])
    } else {
        Zef._zefPlayer.addTags([tagName+'='+value]);
    }
};

Zef.reloadAndAddZefPlayer = function(playerSelector) {
	if(typeof Zef._zefPlayer !== 'undefined') {
		Zef._zefPlayer.load();
		Zef._zefPlayer.unbuildVisual();
	}
	Zef.addZefPlayer(playerSelector);
};

Zef.addZefPlayer = function(playerSelector, questionListSelector, resultListSelector) {
    if(Zef._ZefPlayerReady == false) {
        //Zef._ZefPlayerQueue.push(['Zef._zefPlayer.setZefId', zefId]);
        Zef._ZefPlayerQueue.push(['Zef._zefPlayer.constructUi', playerSelector, questionListSelector, resultListSelector])
    } else {
        //Zef._zefPlayer.setZefId(zefId);
        Zef._zefPlayer.constructUi(playerSelector, questionListSelector, resultListSelector);
    }
};

Zef.restorePreviousAnswers = function() {
	if(typeof Zef._zefPlayer !== 'undefined' && typeof Zef._zefPlayer.components !== 'undefined'
		&& typeof Zef._zefPlayer.components.get('previewReplyRecorder') !== 'undefined') {
		Zef._zefPlayer.components.get('previewReplyRecorder').restoreReplies();
	}
};

Zef.reinitPlayerData = function() {
    if(Zef._ZefPlayerReady == false) {
        Zef._ZefPlayerQueue.push(['Zef._zefPlayer.reloadData'])
    } else {
        Zef._zefPlayer.reloadData();
    }
};

function checkZefPlayerQueue() {
    Zef._ZefPlayerReady = true;
    if(Zef._ZefPlayerQueue.length) {
        zefJQuery.each(Zef._ZefPlayerQueue, function() {
            var func = this[0].split('.');
            self[func[0]][func[1]][func[2]](this[1], this[2], this[3])
        });
    }
};

Zef.loadJQueryAndCreatePlayer();
