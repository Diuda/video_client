var localVideoE, remoteVideoE, localVideoS, videoCallB, endCallB, peerConn;
var wsc = new WebSocket('wss://www.diuda.me:449/websocket');
var peerConfig = { 'iceServers':
	[{'url': 'stun:stun.services.mozilla.com'}, {'url': 'stun:stun.l.google.com:19302'}]
};

function Ready() {
	videoCallB = document.getElementById('VCall');
	endCallB = document.getElementById('ECall');
	localVideoE = document.getElementById('localV');
	remoteVideoE = document.getElementById('remoteV');
	console.log(wsc);
	if(navigator.getUserMedia) {
		videoCallB = document.getElementById('VCall');
		endCallB = document.getElementById('ECall');
		localVideoE = document.getElementById('localV');
		remoteVideoE = document.getElementById('remoteV');
		videoCallB.removeAttribute("disabled");
		// console.log("hello");
		videoCallB.addEventListener("click", function(){
			// alert('hello');
			// console.log('test');
			Call();
		});
		endCallB.addEventListener("click", function(event){
			wsc.send(Json.stringify({"closeConn": true}));
		});
	}
	else {
		console.log("Does not support WebRTC");
	}
}

wsc.onmessage = function(event) {
	console.log('wsc on message function');
	var signal = JSON.parse(event.data);
	if(!peerConn){
		answerCall();
	}

	if(signal.sdp) {
		peerConn.setRemoteDescription(new RTCSessionDescription(signal.sdp));
	}
	else if(signal.candidate){
		peerConn.addIceCandidate(new RTCIceCandidate(signal.candidate));
	}
	else if(signal.closeConn) {
		endCall();
	}
};


function Call() {
	// alert("hello");
	console.log("Call function working...");
	prepareCall();
	navigator.getUserMedia({"audio": true, "video": true}, function (stream) {
		localVideoE.src = URL.createObjectURL(stream);
		peerConn.addStream(stream);
		console.log('navigator...');
		sendOffer();
	}, function(error) {
		console.log(error);
	});
}

//creating RTCPeerConnection
function prepareCall() {
	console.log("Prepare Call working");
	peerConn = new RTCPeerConnection(peerConfig);
	peerConn.onicecandidate = onIceCandidateHandler;
	peerConn.onaddstream = onAddStreamHandler;
}

function onIceCandidateHandler(event) {
	console.log('onIceCandidateHandler' +event.candidate);
	if(!event || !event.candidate)
		return;
	wsc.send(JSON.stringify({"candidate": event.candidate }));
}

function onAddStreamHandler(event) {
	console.log('onAddStreamHandler' +event.stream);
	videoCallB.setAttribute("disabled", true);
	endCallB.removeAttribute("disabled");
	remoteVideoE.src = URL.createObjectURL(event.stream);
}


function sendOffer() {
	console.log("Send Offer working..");
	peerConn.createOffer(
		function(offer) {
			console.log('create offer');
			var off = new RTCSessionDescription(offer);
			peerConn.setLocalDescription(new RTCSessionDescription(off), function() {
				console.log('sending offer');
				wsc.send(JSON.stringify({"sdp": off}));
			},
				function(error) {
					console.log(error);
				})
		}, function(error) {
			console.log(error);
		})
}

function answerCall() {
	console.log('answer call');
	prepareCall();
	navigator.getUserMedia({"audio": true, "video": true}, function(stream) {
		localVideoE.src = URL.createObjectURL(stream);
		peerConn.addStream(stream);
		console.log('navigator answer...');
		sendAnswer();
	}, function(error) {
		console.log(error);
	})
}

function sendAnswer() {
	console.log('send answer')
	peerConn.createAnswer(
		function(answer) {
			var ans = new RTCSessionDescription(answer);
			console.log('create answer');
			//doubt
			peerConn.setLocalDescription(ans, function() {
				wsc.send(JSON.stringify({"sdp": ans}));
				console.log('send answer desc');
			}, function(error) {
				console.log(error);
			})
		}, function(error) {
			console.log(error);
		})
}


function endCall() {
	peerConn.close();
	localVideoS.getTracks().forEach(function(track) {
		track.stop();
	});
	localVideoE.src = "";
	remoteVideoE.src = "";
	videoCallB.removeAttribute("disabled");
	endCallB.setAttribute("disabled", true);
}


















