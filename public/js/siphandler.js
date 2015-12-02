    var callOptions;
	window.onload = function () {	
	    
		var readyCallback = function(e){
			console.log('SIPml initialized.')
	    };
	    var errorCallback = function(e){
	        console.error('Failed to initialize the engine: ' + e.message);
	    }
	
	    SIPml.init(readyCallback, errorCallback);
	
	    callOptions = {
	          audio_remote: document.getElementById("audio_remote"),            
	          events_listener: { events: '*', listener: sipSessionListener }
	      };
	  
		console.log(document.getElementById("audio_remote"));
	}
	
	var sipStack;
    var registerSession;
    var callSession;
    var subscribeSession;
    var publishSession;
    var entity;
    var user;
	var realm = "ekiga.net";
	
    // sends SIP REGISTER request to login
    function sipRegister() {
        // catch exception for IE (DOM not ready)
        try {
            if (!txtUser.value) {
            	txtStatus.innerHTML = '<b>Please fill madatory fields</b>';
                return;
            }
            
            SIPml.setDebugLevel((window.localStorage && window.localStorage.getItem('org.doubango.expert.disable_debug') == "true") ? "error" : "info");

//			var proxy = "ws://ns313841.ovh.net:11060";
//			var outboundproxy = null;
			
//			var realm = "officesip.local";
//			var proxy = "ws://192.168.1.26:5060";
//			var outboundproxy = "udp://192.168.1.26:5060";
//			alert(proxy);

//			var realm = "192.168.1.32";
//			var proxy = "ws://192.168.1.32:8088/ws";
            
			entity = "sip:"+txtUser.value+"@"+realm;
			user = txtUser.value;
            
			// create SIP stack
            sipStack = new SIPml.Stack({
                    realm: realm,
                    impi: txtUser.value,
                    impu: "sip:"+txtUser.value+"@"+realm,
                    password: txtPwd.value,
                    display_name: txtUser.value,
//					websocket_proxy_url: proxy,//(window.localStorage ? window.localStorage.getItem('org.doubango.expert.websocket_server_url') : null),
//                    outbound_proxy_url: outboundproxy,//"udp://130.240.92.227:5060",//(window.localStorage ? window.localStorage.getItem('org.doubango.expert.sip_outboundproxy_url') : null),
//                    ice_servers: [{ url: 'stun:stun.l.google.com:19302'}],//(window.localStorage ? window.localStorage.getItem('org.doubango.expert.ice_servers') : null),
                    enable_rtcweb_breaker: true,//(window.localStorage ? window.localStorage.getItem('org.doubango.expert.enable_rtcweb_breaker') == "true" : false),
                    events_listener: { events: '*', listener: sipEventsListener },
//                    enable_early_ims: (window.localStorage ? window.localStorage.getItem('org.doubango.expert.disable_early_ims') != "true" : true), // Must be true unless you're using a real IMS network
//                    enable_media_stream_cache: (window.localStorage ? window.localStorage.getItem('org.doubango.expert.enable_media_caching') == "true" : false),
//                    bandwidth: (window.localStorage ? tsk_string_to_object(window.localStorage.getItem('org.doubango.expert.bandwidth')) : null), // could be redefined a session-level
//                    video_size: (window.localStorage ? tsk_string_to_object(window.localStorage.getItem('org.doubango.expert.video_size')) : null), // could be redefined a session-level
//                    sip_headers: [
//                            { name: 'User-Agent', value: 'IM-client/OMA1.0 sipML5-v1.2015.03.18' },
//                            { name: 'Organization', value: 'Doubango Telecom' }
//                    ]
                }
            );
			
            if (sipStack.start() != 0) {
                txtStatus.innerHTML = '<b>Failed to start the SIP stack</b>';
            }
            else return;
        }
        catch (e) {
            txtStatus.innerHTML = "<b>2:" + e + "</b>";
            new Error().stack
        }
    }
    
    // sends SIP REGISTER (expires=0) to logout
    function sipUnRegister() {
        if (sipStack) {
        	sipStack.stop(); // shutdown all sessions
        }
    }
    
    // makes a call (SIP INVITE)
    function sipCall(s_type) {
    	console.log(s_type);
        if (sipStack && !callSession) {
        	console.log("createSession");
            // create call session
        	callSession = sipStack.newSession(s_type, callOptions);
            // make call
        	console.log("makecall");
            if (callSession.call(txtCalle.value) != 0) {
            	callSession = null;
                txtCallStatus.value = 'Failed to make call';
                return;
            }
        }
        else if (callSession) {
        	console.log("existingSession");
            txtCallStatus.innerHTML = '<i>Connecting...</i>';
            callSession.accept();
        }
    }
    
    var sipEventsListener = function(e){
        console.info('sip event = ' + e.type);
        switch (e.type) {
	        case 'started': {
	    	    try {
	    	    	registerSession = sipStack.newSession('register', {
	    	            expires: 200,
	    	            events_listener: { events: '*', listener: sipSessionListener },
	    	        });
	    	    	registerSession.register();
	    	    }
	    	    catch (e) {
	    	        txtStatus.value = txtStatus.innerHTML = "<b>1:" + e + "</b>";
	    	    }
	            break;
	        }
		    case 'stopping': case 'stopped': case 'failed_to_start': case 'failed_to_stop': {
	    		sipStack = null;
	            registerSession = null;
	            callSession = null;

                stopRingbackTone();
                stopRingTone();
	
	            txtCallStatus.innerHTML = '';
	            txtStatus.innerHTML = "<i>Disconnected</i>";
	            break;
	        }
	        case 'i_new_call': { // incoming audio/video call
                if (callSession) {
                    // do not accept the incoming call if we're already 'in call'
                    e.newSession.hangup(); // comment this line for multi-line support
                }
                else {
                	callSession = e.newSession;
                	callSession.setConfiguration(callOptions);
                	callSession.audioLocal

                    startRingTone();

                    var remoteNumber = (callSession.getRemoteFriendlyName() || 'unknown');
                    txtCallStatus.innerHTML = "<i>Incoming call from [<b>" + remoteNumber + "</b>]</i>";
                    
                    $( "<div>Incoming Call!</div>" ).dialog({
                        resizable: false,
                        height:140,
                        modal: true,
                        buttons: {
                          "Answer": function() {
                        	callSession.accept();
                            $( this ).dialog( "close" );
                          },
                          "Reject": function() {
                        	callSession.reject();
                            $( this ).dialog( "close" );
                          }
                        }
                      });

                }
	            break;
	        }
            case 'i_ao_request': {
                if(e.session == callSession){
                    var iSipResponseCode = e.getSipResponseCode();
                    if (iSipResponseCode == 180 || iSipResponseCode == 183) {
                        startRingbackTone();
                        txtCallStatus.innerHTML = '<i>Remote ringing...</i>';
                    }
                }
                break;
            }
        }
    }
    
    function sipHangup() {
        if (callSession) {
            txtCallStatus.innerHTML = '<i>Terminating the call...</i>';
            callSession.hangup({events_listener: { events: '*', listener: sipSessionListener }});
        }
    }
    
    function sipSessionListener(e /* SIPml.Session.Event */) {
        console.info('session event = ' + e.type);
        switch (e.type) {
            case 'connecting': case 'connected':
                {
                    if (e.session == registerSession) {
                    	
                        txtStatus.innerHTML = "<i>" + e.description + "</i>";
                        if (e.type == 'connected') {
                            $("#status").show();
                            $("#contacts").show();
                            $("#calling").show();

                            publishPresence(slctPresenceStatus.options[slctPresenceStatus.selectedIndex].text);
                            console.log(JSON.parse(window.localStorage.getItem("ltu.lab3.contacts")));
                            initSubscriptions();
                        }
                    }
                    else if (e.session == callSession) {
                        txtCallStatus.innerHTML = "<i>" + e.description + "</i>";
                        
                        if (e.type == 'connected') {
                            stopRingbackTone();
                            stopRingTone();
                        }
                    }
                    break;
                }
            case 'terminating': case 'terminated':
                {
                    if (e.session == registerSession) {
                        callSession = null;
                    	registerSession = null;

                        txtStatus.innerHTML = "<i>" + e.description + "</i>";

                        $("#status").hide();
                        $("#contacts").hide();
                        $("#calling").hide();
                    }
                    else if (e.session == callSession) {

                        callSession = null;
                        stopRingbackTone();
                        stopRingTone();

                        txtCallStatus.innerHTML = "<i>" + e.description + "</i>";

                        setTimeout(function () { if (!callSession) txtCallStatus.innerHTML = ''; }, 2500);
                    }
                    break;
                }
        }
    }
    
    var sipPublishListener = function(e){
        console.info('session event = ' + e.type);
    }
    
    var publishPresence = function(status){
        publishSession = sipStack.newSession('publish', {
            events_listener: { events: '*', listener: sipPublishListener } // optional: '*' means all events
        });                
        var contentType = 'application/pidf+xml';
        var content = '<?xml version="1.0" encoding="UTF-8"?>\n' +
                        '<presence xmlns="urn:ietf:params:xml:ns:pidf"\n' +
                            ' xmlns:im="urn:ietf:params:xml:ns:pidf:im"' +
     	                    ' entity="'+entity+'">\n' +
                            '<tuple id="'+user+'">\n' +
                            '<status>\n'+
                            '   <basic>'+status+'</basic>\n' +
                            '</status>\n' +
                            '<note>'+txtPresenceNote.value+'</note>\n' +
                            '</tuple>\n' +
                           '</presence>';

        // send the PUBLISH request
        publishSession.publish(content, contentType,{
            expires: 5000,
            sip_headers: [
                            { name: 'Event', value: 'presence' },
                            { name: 'Organization', value: 'Doubango Telecom' }
                         ]
        });
    }
    
    var sipSubscribeListener = function(e){
        console.info('session event = ' + e.type);
        if(e.type == 'i_notify'){
            console.info('NOTIFY content = ' + e.getContentString());
            console.info('NOTIFY content-type = ' + e.getContentType());

            if (e.getContentType() == 'application/pidf+xml') {
                if (window.DOMParser) {
                    var parser = new DOMParser();
                    var xmlDoc = parser ? parser.parseFromString(e.getContentString(), "text/xml") : null;
                    var presenceNode = xmlDoc ? xmlDoc.getElementsByTagName ("presence")[0] : null;
                    if(presenceNode){
                        var tupleNode = presenceNode.getElementsByTagName ("tuple")[0];
                        var entityUri = presenceNode.getAttribute ("entity");
                        var tupleId = tupleNode.getAttribute ("id");
                        var presenceStatus = "";
                        var presenceNote = "";
                        if(entityUri && tupleNode){
                            var statusNode = tupleNode.getElementsByTagName ("status")[0];
                            if(statusNode){
                                var basicNode = statusNode.getElementsByTagName ("basic")[0];
                                if(basicNode){
                                	presenceStatus = basicNode.textContent;
                                    console.info('Presence notification: Uri = ' + entityUri + ' status = ' + basicNode.textContent);
                                }
                            }
                            var noteNode = tupleNode.getElementsByTagName ("note")[0];
                            if(noteNode){
                            	presenceNote = noteNode.textContent
                                console.info('Presence notification: Note = ' + noteNode.textContent);
                            }
                        }
                        addOrUpdateContact(tupleId, presenceStatus, presenceNote);
                    } else {
//                    	addOrUpdateContact(txtNewContact.value, "offline", "");
                    }
                }
            }
        }
    }
    var subscribePresence = function(to){
    	console.log("subscribe to " + to);
        subscribeSession = sipStack.newSession('subscribe', {
                    expires: 5000,
                    events_listener: { events: '*', listener: sipSubscribeListener },
                    sip_headers: [
                                  { name: 'Event', value: 'presence' }, // only notify for 'presence' events
                                  { name: 'Accept', value: 'application/pidf+xml' } // supported content types (COMMA-sparated)
                        ],
                });
        // start watching for entity's presence status (You may track event type 'connected' to be sure that the request has been accepted by the server)
        subscribeSession.subscribe(to);
    }
    
    function startRingTone() {
        try { ringtone.play(); }
        catch (e) { }
    }

    function stopRingTone() {
        try { ringtone.pause(); }
        catch (e) { }
    }

    function startRingbackTone() {
        try { ringbacktone.play(); }
        catch (e) { }
    }

    function stopRingbackTone() {
        try { ringbacktone.pause(); }
        catch (e) { }
    }

