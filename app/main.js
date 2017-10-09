(function($, window, document) {

    $(function() {
        setTextHeight();
        var input = $('#input');
        var droppedIn = false;
        input.focusout(function() {
            focusCaret(input);
        });
        focusCaret(input);
        var backframe = $('iframe#backframe');
        var word = 'here';
        var freezeWord = 'here';
        var lastWord = 'here';
        var text = input.val();
        var startSlice = 0;
        input.keydown(keyHandler);

        input.bind('input propertychange', keyBinding);


        socket.on('new_page', function(data) {
            //Could do this but causes sync errors TODO: fix sync
            //backframe.attr('src', data.src);
            refreshIframe();
        })

        function focusCaret(input) {
            input.focus();
            val = input.val();
            input.val('');
            input.val(val);
        }

        function refreshIframe(newWord = word){
            backframe.attr('src', './scraped/' + newWord + '/index.html');
            focusCaret(input);
        }

        function keyBinding() {
            text = input.val();
            if (droppedIn) {
                var replacement = text.slice(startSlice, text.length);
                socket.emit('edit', { page: word, user: uuid, text: replacement });
            } else {
                var words = text.split(/\W+/);
                lastWord = word;
                word = words[words.length - 1];
                if (!word.length)
                    word = words[words.length - 2];
                if (lastWord != word) {
                    socket.emit('refresh', { page: word });
                }
            }
        };

        function keyHandler(e) {
            switch (e.keyCode) {
                case 13: //enter
                    if (e.shiftKey) {
                        droppedIn = !droppedIn;
                        if (droppedIn) {
                            input.css({ opacity: .2 });
                            startSlice = text.length;
                            freezeWord = word;
                            socket.emit('enter_edit', { user: uuid, page: word });
                        } else {
                            input.css({ opacity: 1 });
                            socket.emit('leave_edit', { user: uuid, page: word });
                            input.val(input.val() + ' ' + freezeWord);
                        }

                    }
                    e.preventDefault();
                    break;
                case 38: //up
                    if (droppedIn) {
                        startSlice = text.length;
                        socket.emit('nav', { user: uuid, page: word, direction: -1 });
                    }
                    e.preventDefault();
                    break;
                case 40: //down
                    if (droppedIn) {
                        startSlice = text.length;
                        socket.emit('nav', { user: uuid, page: word, direction: 1 });
                    }
                    e.preventDefault();
                    break;
                case 39: //right
                case 37: //left
                    e.preventDefault();
                    break;
                default:
                    break;
            }

        }
    });
    var uuid = userID();

    var socket = io.connect('http://localhost:3000');

    function setTextHeight() {
        var height = $(window).height();
        $('#input').outerHeight(height);
    }

    function userID() {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }

    $(window).resize(setTextHeight);

}(window.jQuery, window, document));