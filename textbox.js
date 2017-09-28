// IIFE - Immediately Invoked Function Expression
(function($, window, document) {

    // The $ is now locally scoped 

    // Listen for the jQuery ready event on the document
    $(function() {
        // The DOM is ready!
        setTextHeight();
        var input = $('#input');
        input.focusout(function() {
            focusCaret(input);
        });
        focusCaret(input);
        var background = $('#background');
        var backframe = $('iframe#backframe');
        var word = '';
        var lastWord = '';
        var droppedIn = false;
        var currentNode = null;
        input.keydown(function(e) {
            switch (e.keyCode) {
                case 13:
                    if (e.shiftKey) {
                        //TODO drop in
                        droppedIn = !droppedIn;
                        console.log('were in=' + droppedIn);
                    } else {
                        e.preventDefault();
                    }
                    break;
                case 38: //up
                case 40: //down
                    if (droppedIn) {
                        console.log('edit');
                        $.get("http://philips-macbook-pro.local:8080/edit?name=" + word + '&uuid=' + uuid, function(data) {
                            console.log('back!:');
                            backframe.attr('src', function(i, val) { return val; });
                        });

                        // if (currentNode.children().length) {
                        //     currentNode = currentNode.children()[0];
                        // } else if (currentNode.next().length) {
                        //     currentNode = currentNode.next()[0];
                        // } else {
                        //     currentNode = currentNode.parent();
                        //     if (currentNode.next().length) {
                        //         currentNode = currentNode.next()[0];
                        //     }
                        // }
                        // console.log(currentNode.tagName)
                    }
                    // currentNode.css('background-color', 'red');
                case 39: //right
                case 37: //left
                    e.preventDefault();
                    break;
                default:
                    break;
            }

        });

        input.bind('input propertychange', function() {
            var text = input.val();
            var words = text.split(/\W+/);
            lastWord = word;
            // console.log('lastword :' + word + ':');
            word = words[words.length - 1];
            if (!word.length)
                word = words[words.length - 2];
            if (lastWord != word) {
                // console.log('word :' + word + ':');
                $.get('http://philips-macbook-pro.local:8080/proxy?name=' + word, function(data) {
                    focusCaret(input);
                    console.log('data:' + data);
                    backframe.attr('src', data);
                });

                // backframe.on('load', function() {
                //     console.log('iframe loaded')
                //     currentNode = backframe.contents().find('body');
                //     console.log(backframe);
                // });
            }
            background.val(text + text.slice(0, 10) + '\n\n\n\n');
            if (input.length)
                background.scrollTop(input.scrollTop());
        });
    });
    var uuid = userID();

    function setTextHeight() {
        var height = $(window).height();
        $('#input').outerHeight(height / 2);
        $('#background').outerHeight(height);
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

    // The rest of the code goes here!
    $(window).resize(setTextHeight);


}(window.jQuery, window, document));
// The global jQuery object is passed as a parameter