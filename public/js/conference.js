const KEY_ENTER = 13;
const ONE_MONTH = 30 * 24 * 60 * 60;

navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

const socket = io('/');
const videoGrid = $('#video-grid');
const myPeer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '443'
});
let localMediaStream;
let userMedia;
const defaultConfig = {
    audio: false,
    video: false,
};
const peers = {};

const startListening = () => {
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            devices.forEach(device => {
                if (device.kind === 'audioinput') {
                    defaultConfig.audio = true;
                } else if (device.kind === 'videoinput') {
                    defaultConfig.video = true;
                }
            });
            navigator.getUserMedia(defaultConfig,
                (stream) => {
                    if (defaultConfig.audio) $('.conference__mute_button').removeClass('disabled');
                    if (defaultConfig.video) $('.conference__video_button').removeClass('disabled');
                    localMediaStream = stream;
                    userMedia = renderMediaPlayer(Cookie.get('userName'), myPeer.id);
                    userMedia[0].children[0].muted = true;
                    addVideoStream(userMedia, localMediaStream);
                    myPeer.on('call', call => {
                        call.answer(stream);
                        call.on('stream', (userVideoStream) => {
                            const localMedia = renderMediaPlayer(Cookie.get('userName'), call.peer);
                            addVideoStream(localMedia, userVideoStream);
                        });
                    });

                    socket.on('user-connected', (userId, userName) => {
                        connectToNewUser(userId, userName, stream);
                    });
                    // input value
                    let text = $('.chat_message');
                    // when press enter send message
                    $('html').keydown(function (e) {
                        if (e.which == KEY_ENTER && text.val().length !== 0) {
                            socket.emit('message', {
                                userName: Cookie.get('userName'),
                                message: text.val()
                            });
                            text.val('');
                        }
                    });
                },
                (error) => {
                    console.error('Access denied for audio/video');
                    alert('Необходимо предоставить доступ к камере или микрофону');
                });
        })
        .catch(error => {
            console.error(`Error: ${erorr.message}`);
        });
}

if (!Cookie.get('userName')) {
    $('.overlay').removeClass('hide');
    $('.modal').removeClass('hide');
} else {
    startListening();
}

const connectToNewUser = (userId, userName, stream) => {
    const call = myPeer.call(userId, stream);
    const localMedia = renderMediaPlayer(userName, userId);
    call.on('stream', userVideoStream => {
        addVideoStream(localMedia, userVideoStream);
    });
    call.on('close', () => {
        localMedia.remove();
    });

    peers[userId] = call;
}

const addVideoStream = (localMedia, stream) => {
    if (!videoGrid.find(`[data-user-id=${localMedia.data('user-id')}]`)[0]) {
        const media = localMedia[0].children[0];
        media.srcObject = stream;
        media.addEventListener('loadedmetadata', () => {
            media.play();
        });
        videoGrid.append(localMedia);
    }
}

const hideVideoByUserId = (userId) => {
    videoGrid.find(`[data-user-id=${userId}]`).each((index, item) => {
        $(item).find('video').addClass('hide');
    });
}

const showVideoByUserId = (userId) => {
    videoGrid.find(`[data-user-id=${userId}]`).each((index, item) => {
        $(item).find('video').removeClass('hide');
    });
}

const scrollToBottom = () => {
    var d = $('.conference__chat_window');
    d.scrollTop(d.prop('scrollHeight'));
}

const toggleChat = () => {
    $('.conference__left').toggleClass('fill-space');
    $('.conference__right').toggleClass('hide');
}

const muteUnmute = () => {
    if (!defaultConfig.audio) return;
    const enabled = localMediaStream.getAudioTracks()[0].enabled;
    if (enabled) {
        localMediaStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        setMuteButton();
        localMediaStream.getAudioTracks()[0].enabled = true;
    }
}

const playStop = () => {
    if (!defaultConfig.video) return;
    const enabled = localMediaStream.getVideoTracks()[0].enabled;
    if (enabled) {
        socket.emit('stop-user-video', myPeer.id);
        localMediaStream.getVideoTracks()[0].enabled = false;
        setPlayVideo();
        userMedia.find('video').addClass('hide');
    } else {
        socket.emit('start-user-video', myPeer.id);
        setStopVideo();
        userMedia.find('video').removeClass('hide');
        localMediaStream.getVideoTracks()[0].enabled = true;

    }
}

const saveUserName = () => {
    const userName = $('.modal__body_input').val().trim();
    if (userName.length > 0) {
        Cookie.set('userName', userName, ONE_MONTH);
        $('.overlay').addClass('hide');
        $('.modal').addClass('hide');
        startListening();
    } else {
        $('.modal__body_input').addClass('invalid');
    }
}

const renderMediaPlayer = (userName, userId) => {
    return $(`<div class="media__container" data-user-id="${userId}"></div>`)
        .append('<video></video>')
        .append(`<p class="media__container_title">${userName}</p>`);
}

const leaveConference = () => {
    document.location.href = 'https://videoconvers.herokuapp.com';
}

const setMuteButton = () => {
    $('.conference__mute_button').html('<i class="fas fa-microphone"></i>');
}

const setUnmuteButton = () => {
    $('.conference__mute_button').html('<i class="unmute fas fa-microphone-slash"></i>');
}

const setStopVideo = () => {
    $('.conference__video_button').html('<i class="fas fa-video"></i>');
}

const setPlayVideo = () => {
    $('.conference__video_button').html('<i class="stop fas fa-video-slash"></i>');
}

$('.conference__leave_button').on('click', leaveConference);
$('.conference__chat_button').on('click', toggleChat);
$('.conference__mute_button').on('click', muteUnmute);
$('.conference__video_button').on('click', playStop);
$('.modal__footer_button').on('click', saveUserName);

socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close();
});

myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id, Cookie.get('userName'));
});

socket.on('createMessage', ({ userName, message }) => {
    $('ul').append(`<li class="messages__container"><span>${userName}</span><p>${message}</p></li>`);
    scrollToBottom();
});

socket.on('user-disabled-video', hideVideoByUserId);
socket.on('user-included-video', showVideoByUserId);