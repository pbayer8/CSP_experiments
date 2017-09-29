// IIFE - Immediately Invoked Function Expression
(function($, window, document) {

    // The $ is now locally scoped 

    // Listen for the jQuery ready event on the document
    $(function() {
        // The DOM is ready!
        setTextHeight();
        var input = $('#input');
        var droppedIn = false;
        input.focusout(function() {
            focusCaret(input);
        });
        focusCaret(input);
        var backframe = $('iframe#backframe');
        var word = '';
        var freezeWord = '';
        var lastWord = '';
        var text = '';
        var startSlice = 0;
        input.keydown(keyHandler);

        input.bind('input propertychange', keyBinding);


        socket.on('new_page', function(data) {
            backframe.attr('src', data.src);
            focusCaret(input);
        })

        function focusCaret(input) {
            input.focus();
            val = input.val();
            input.val('');
            input.val(val);
        }

        function keyBinding() {
            text = input.val();
            if (droppedIn) {
                var replacement = text.slice(startSlice, text.length);
                console.log(replacement);
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
                case 13:
                    if (e.shiftKey) {
                        //TODO drop in
                        droppedIn = !droppedIn;
                        if (droppedIn) {
                            startSlice = text.length;
                            freezeWord = word;
                            socket.emit('enter_edit', { user: uuid, page: word });
                        } else {
                            socket.emit('leave_edit', { user: uuid, page: word });
                            input.val(input.val() + ' ' + freezeWord);
                        }

                    }
                    e.preventDefault();
                    break;
                case 38: //up
                case 40: //down
                    if (droppedIn) {
                        startSlice = text.length;
                        socket.emit('next', { user: uuid, page: word });
                    }
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

    var socket = io.connect('http://philips-macbook-pro.local:8080')

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
// The global jQuery object is passed as a parameter