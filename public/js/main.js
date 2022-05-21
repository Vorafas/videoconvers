const BASE_URL = 'https://videoconvers.herokuapp.com/';
const ONE_MONTH = 30 * 24 * 60 * 60;

const reUuid = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

const userNameInput = $('.username-input');
const roomIdInput = $('.room-id-input');

const toggleModal = () => {
    $('.modal').toggleClass('hide');
    $('.overlay').toggleClass('hide');
    const userName = Cookie.get('userName') ? Cookie.get('userName') : '';
    userNameInput.val(userName);
}

const joinRoom = () => {
    const roomId = roomIdInput.val().trim();
    const userName = userNameInput.val().trim();
    const isUuid = reUuid.test(roomId);
    if (isUuid) {
        roomIdInput.removeClass('invalid');
    } else {
        roomIdInput.addClass('invalid');
    }
    if (userName.length === 0) {
        userNameInput.addClass('invalid');
    } else {
        userNameInput.removeClass('invalid');
        Cookie.set('userName', userName, ONE_MONTH);
    }
    if (isUuid && userName.length > 0) {
        window.location.href = BASE_URL + roomId;
    }
}

$('.join-button').on('click', joinRoom);
$('.join-room').on('click', toggleModal);
$('.close-button').on('click', toggleModal);