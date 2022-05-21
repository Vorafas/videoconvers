const Cookie = {};

Cookie.set = function (name, value, seconds) {
    var expires = '';
    if (seconds) {
        var date = new Date();
        date.setTime(date.getTime() + (seconds * 1000));
        expires = '; expires=' + date.toGMTString();
    }
    document.cookie = name + '=' + value + expires + '; path=/';
}

Cookie.get = function (name) {
    var results = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    if (results) {
        return unescape(results[2]);
    } else {
        return null;
    }
}

Cookie.delete = function (name) {
    Cookie.setCookie(name, '', -1 * 24 * 60 * 60);
}
