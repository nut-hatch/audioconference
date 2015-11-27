	var readyCallback = function(e){
//        createSipStack(); 
    };
    var errorCallback = function(e){
        console.error('Failed to initialize the engine: ' + e.message);
    }
    SIPml.init(readyCallback, errorCallback);

	var sipStack;
    var registerSession;
    var callSession;
    var callOptions = {
            video_local: document.getElementById('video-local'),
            video_remote: document.getElementById('video-remote'),
            audio_remote: document.getElementById('audio-remote'),
            events_listener: { events: '*', listener: sipSessionListener } // optional: '*' means all events
        };
	
    // sends SIP REGISTER request to login
    function sipRegister() {
        // catch exception for IE (DOM not ready)
        try {
//            btnLogin.disabled = true;
            if (!txtUser.value) {
            	txtStatus.innerHTML = '<b>Please fill madatory fields</b>';
//                btnLogin.disabled = false;
                return;
            }
            
//            var o_impu = tsip_uri.prototype.Parse(txtSipAddress.value);
//            console.log(o_impu.s_user_name);
//            console.log(o_impu.s_host);
//            if (!o_impu || !o_impu.s_user_name || !o_impu.s_host) {
//                txtRegStatus.innerHTML = "<b>[" + txtPublicIdentity.value + "] is not a valid Public identity</b>";
//                btnLogin.disabled = false;
//                return;
//            }

            // enable notifications if not already done
            if (window.webkitNotifications && window.webkitNotifications.checkPermission() != 0) {
                window.webkitNotifications.requestPermission();
            }

            // save credentials
           // saveCredentials();

            // update debug level to be sure new values will be used if the user haven't updated the page
            SIPml.setDebugLevel((window.localStorage && window.localStorage.getItem('org.doubango.expert.disable_debug') == "true") ? "error" : "info");
//			console.log(window.localStorage);

			var realm = "ekiga.net";
			var realm = "officesip.local";
			
            // create SIP stack
            sipStack = new SIPml.Stack({
                    realm: realm,
                    impi: txtUser.value,
                    impu: "sip:"+txtUser.value+"@"+realm,
                    password: txtPwd.value,
                    display_name: txtUser.value,
					websocket_proxy_url: "ws://130.240.92.227:5060",//(window.localStorage ? window.localStorage.getItem('org.doubango.expert.websocket_server_url') : null),
//                    outbound_proxy_url: "udp://130.240.92.227:5060",//(window.localStorage ? window.localStorage.getItem('org.doubango.expert.sip_outboundproxy_url') : null),
//                    ice_servers: (window.localStorage ? window.localStorage.getItem('org.doubango.expert.ice_servers') : null),
//                    enable_rtcweb_breaker: (window.localStorage ? window.localStorage.getItem('org.doubango.expert.enable_rtcweb_breaker') == "true" : false),
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
//        btnLogin.disabled = false;
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

//            if(window.localStorage) {
//                oConfigCall.bandwidth = tsk_string_to_object(window.localStorage.getItem('org.doubango.expert.bandwidth')); // already defined at stack-level but redifined to use latest values
//                oConfigCall.video_size = tsk_string_to_object(window.localStorage.getItem('org.doubango.expert.video_size')); // already defined at stack-level but redifined to use latest values
//            }

        	console.log("createSession");
            // create call session
        	callSession = sipStack.newSession(s_type, {
                video_local: document.getElementById('video-local'),
                video_remote: document.getElementById('video-remote'),
                audio_remote: document.getElementById('audio-remote'),
                events_listener: { events: '*', listener: sipSessionListener } // optional: '*' means all events
            });
            // make call
        	console.log("makecall");
            if (callSession.call(txtCalle.value) != 0) {
            	callSession = null;
                txtCallStatus.value = 'Failed to make call';
                return;
            }
//            saveCallOptions();
        }
        else if (callSession) {
        	console.log("existingSession");
            txtCallStatus.innerHTML = '<i>Connecting...</i>';
            callSession.accept();
        }
    }
    
    var sipEventsListener = function(e){
        switch (e.type) {
	        case 'started': {
	    	    try {
	    	        // LogIn (REGISTER) as soon as the stack finish starting
	    	    	registerSession = sipStack.newSession('register', {
	    	            expires: 200,
	    	            events_listener: { events: '*', listener: sipSessionListener },
//	    	            sip_caps: [
//	    	                        { name: '+g.oma.sip-im', value: null },
//	    	                        //{ name: '+sip.ice' }, // rfc5768: FIXME doesn't work with Polycom TelePresence
//	    	                        { name: '+audio', value: null },
//	    	                        { name: 'language', value: '\"en,fr\"' }
//	    	                ]
	    	        });
	    	    	registerSession.register();
	    	    }
	    	    catch (e) {
	    	        txtStatus.value = txtStatus.innerHTML = "<b>1:" + e + "</b>";
	                new Error().stack
//	    	        btnLogin.disabled = false;
	    	    }
	            break;
	        }
		    case 'stopping': case 'stopped': case 'failed_to_start': case 'failed_to_stop': {
	    		sipStack = null;
	            registerSession = null;
	            callSession = null;
	
	//            uiVideoDisplayShowHide(false);
	//            divCallOptions.style.opacity = 0;
	
	            txtCallStatus.innerHTML = '';
	            txtStatus.innerHTML = "<i>Disconnected</i>";
	            break;
	        }
	        case 'i_new_message': { // incoming new SIP MESSAGE (SMS-like)
	            acceptMessage(e);
	            break;
	        }
	        case 'i_new_call': { // incoming audio/video call
                if (callSession) {
                    // do not accept the incoming call if we're already 'in call'
                    e.newSession.hangup(); // comment this line for multi-line support
                }
                else {
                	callSession = e.newSession;
                    // start listening for events
                	callSession.setConfiguration(callOptions);

//                    uiBtnCallSetText('Answer');
//                    btnHangUp.value = 'Reject';
//                    btnCall.disabled = false;
//                    btnHangUp.disabled = false;

//                    startRingTone();

                    var remoteNumber = (callSession.getRemoteFriendlyName() || 'unknown');
                    txtCallStatus.innerHTML = "<i>Incoming call from [<b>" + remoteNumber + "</b>]</i>";
                    
                    $( "<div>Incoming Call!</div>" ).dialog({
                        resizable: false,
                        height:140,
                        modal: true,
                        buttons: {
                          "Answer": function() {
                        	e.newSession.accept();
                            $( this ).dialog( "close" );
                          },
                          "Reject": function() {
                        	e.newSession.reject();
                            $( this ).dialog( "close" );
                          }
                        }
                      });

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
        switch (e.type) {
            case 'connecting': case 'connected':
                {
//                    var bConnected = (e.type == 'connected');
                    if (e.session == registerSession) {
//                        uiOnConnectionEvent(bConnected, !bConnected);
                        txtStatus.innerHTML = "<i>" + e.description + "</i>";
                    }
                    else if (e.session == callSession) {
                        txtCallStatus.innerHTML = "<i>" + e.description + "</i>";
//                        divCallOptions.style.opacity = bConnected ? 1 : 0;

//                        if (SIPml.isWebRtc4AllSupported()) { // IE don't provide stream callback
//                            uiVideoDisplayEvent(false, true);
//                            uiVideoDisplayEvent(true, true);
//                        }
                    }
                    break;
                } // 'connecting' | 'connected'
            case 'terminating': case 'terminated':
                {
                    if (e.session == registerSession) {
                        callSession = null;
                    	registerSession = null;

                        txtStatus.innerHTML = "<i>" + e.description + "</i>";
                    }
                    else if (e.session == callSession) {
//                        uiCallTerminated(e.description);

                        callSession = null;

                        txtCallStatus.innerHTML = "<i>" + e.description + "</i>";
//                        uiVideoDisplayShowHide(false);
//                        divCallOptions.style.opacity = 0;

//                        if (oNotifICall) {
//                            oNotifICall.cancel();
//                            oNotifICall = null;
//                        }

//                        uiVideoDisplayEvent(false, false);
//                        uiVideoDisplayEvent(true, false);

                        setTimeout(function () { if (!callSession) txtCallStatus.innerHTML = ''; }, 2500);
                    }
                    break;
                } // 'terminating' | 'terminated'
        }
    }

    var login = function() {
	    try {
	        // LogIn (REGISTER) as soon as the stack finish starting
	    	registerSession = sipStack.newSession('register', {
	            expires: 200,
	            events_listener: { events: '*', listener: sipSessionListener },
//	            sip_caps: [
//	                        { name: '+g.oma.sip-im', value: null },
//	                        //{ name: '+sip.ice' }, // rfc5768: FIXME doesn't work with Polycom TelePresence
//	                        { name: '+audio', value: null },
//	                        { name: 'language', value: '\"en,fr\"' }
//	                ]
	        });
	    	registerSession.register();
	    }
	    catch (e) {
	        txtStatus.value = txtStatus.innerHTML = "<b>1:" + e + "</b>";
            new Error().stack
//	        btnLogin.disabled = false;
	    }
    }
//}