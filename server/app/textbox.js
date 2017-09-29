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

        // var socket = io.connect('http://localhost');
        // socket.on('news', function(data) {
        //     console.log(data);
        //     socket.emit('my other event', { my: 'data' });
        // });

        input.bind('input propertychange', keyBinding);

        function keyBinding() {
            text = input.val();
            if (droppedIn) {
                var replacement = text.slice(startSlice, text.length);
                $.get("http://philips-macbook-pro.local:8080/edit?name=" + word + '&uuid=' + uuid + '&text=' + replacement, function(data) {
                    focusCaret(input);
                    backframe.attr('src', data);
                });
            } else {
                var words = text.split(/\W+/);
                lastWord = word;
                word = words[words.length - 1];
                if (!word.length)
                    word = words[words.length - 2];
                if (lastWord != word) {
                    $.get('http://philips-macbook-pro.local:8080/proxy?name=' + word, function(data) {
                        focusCaret(input);
                        backframe.attr('src', data);
                    });
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
                        } else {
                            $.get("http://philips-macbook-pro.local:8080/edit?name=" + word + '&uuid=clear', function(data) {
                                focusCaret(input);
                                input.val(input.val() + ' ' + freezeWord);
                            });
                        }

                    } else {
                        e.preventDefault();
                    }
                    break;
                case 38: //up
                case 40: //down
                    if (droppedIn) {
                        startSlice = text.length;
                        $.get("http://philips-macbook-pro.local:8080/edit?name=" + word + '&uuid=' + uuid, function(data) {
                            backframe.attr('src', function(i, val) { return val; });
                        });
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

    function setTextHeight() {
        var height = $(window).height();
        $('#input').outerHeight(height);
    }

    function focusCaret(input) {
        input.focus();
        val = input.val();
        input.val('');
        input.val(val);
    }

    function userID() {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }

    $(window).resize(setTextHeight);

}(window.jQuery, window, document));
// The global jQuery object is passed as a parameter