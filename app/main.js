(function($, window, document) {

    $(function() {
        var input = $('#input');
        var droppedIn = false;
        var backframe = $('iframe#backframe');
        var word = 'here';
        var freezeWord = 'here';
        var lastWord = 'here';
        var text = input.val();
        var startSlice = 0;
        var charGrid = { 'width': 20, 'height': 4 };
        var charDim = { 'width': 20, 'height': 40 };
        var dimObj = {};
        var textOffset = {};
        windowResize();
        getTextOffset();
        $(document).keydown(keyHandler);
        $(document).keypress(otherKey);
        $(window).resize(windowResize);


        socket.on('new_page', function(data) {
            //Could do this but causes sync errors TODO: fix sync
            refreshIframe();
        })

        function refreshIframe() {
            backframe.attr('src', './scraped/' + word + '_com/index.html');
        }

        function otherKey(e) {
            var char = e.key;
            if (char == ' ') {
                char = '\&nbsp'
            } else {
                redrawCircle(input.text().length);
                checkForOverflow(input.text().length);
            }
            input.html(input.html() + char);
            text = input.text();
            if (droppedIn) {
                var replacement = text.slice(startSlice, text.length);
                socket.emit('edit', { page: word, ext: 'com', user: uuid, text: replacement });
            } else {
                var words = text.split(/\W+/);
                lastWord = word;
                word = words[words.length - 1];
                if (word.length == 0) {
                    word = words[words.length - 2];
                }
                if (lastWord != word) {
                    socket.emit('refresh', { page: word, ext: 'com' });
                }
            }
        };

        function keyHandler(e) {
            switch (e.keyCode) {
                case 13: //enter
                    if (e.shiftKey) {
                        droppedIn = !droppedIn;
                        if (droppedIn) {
                            input.css({ 'left': '50%' });
                            startSlice = text.length;
                            freezeWord = word;
                            socket.emit('enter_edit', { user: uuid, page: word, ext: 'com' });
                        } else {
                            input.css({ 'left': 0 });
                            socket.emit('leave_edit', { user: uuid, page: word, ext: 'com' });
                            input.val(input.val() + ' ' + freezeWord);
                        }

                    }
                    e.preventDefault();
                    break;
                case 38: //up
                    if (droppedIn) {
                        startSlice = text.length;
                        socket.emit('nav', { user: uuid, page: word, ext: 'com', direction: -1 });
                    }
                    e.preventDefault();
                    break;
                case 40: //down
                    if (droppedIn) {
                        startSlice = text.length;
                        socket.emit('nav', { user: uuid, page: word, ext: 'com', direction: 1 });
                    }
                    e.preventDefault();
                    break;
                case 8:
                case 39: //right
                case 37: //left
                    e.preventDefault();
                    break;
                default:
                    break;
            }

        }

        function textDim(text, font) {
            if (!dimObj.fakeEl) dimObj.fakeEl = $('<span>').hide().appendTo(document.body);
            dimObj.fakeEl.html(text || this.val() || this.text()).css('font', font || this.css('font'));
            return { 'width': dimObj.fakeEl.width(), 'height': dimObj.fakeEl.height() };
        };



        function windowResize() {
            setTextHeight();
            updateCharCount();
            for (i = 0; i < 2; i++) {
                redrawCircle(i);
            }
        }

        function setTextHeight() {
            var height = $(window).height();
            input.outerHeight(height);
        }

        //TODO make this dynamically add a span to the input then get its offset
        function getTextOffset() {
            textOffset.top = $('#offset').offset().top;
            textOffset.left = $('#offset').offset().left;
        }

        function updateCharCount() {
            charDim = textDim('W', '80px Inconsolata');
            //charDim.width = input.textWidth()/input.text().length;
            charGrid.width = Math.floor(input.width() / charDim.width);
            charGrid.height = Math.floor(input.height() / charDim.height);
        }

        function getCharCoords(charIndex) {
            var row = Math.floor(charIndex / charGrid.width);
            var col = (charIndex) % (charGrid.width);
            return {'row':row,'col':col}
        }

        function getCharPos(charIndex) {
            var cc = getCharCoords(charIndex);
            var x = cc.col * charDim.width +
                textOffset.left;
            var y = cc.row * charDim.height +
                textOffset.top;
            return {'x':x,'y':y}
        }

        function getDotPos(charIndex) {
            var cp = getCharPos(charIndex)
            var x = cp.x + charDim.width / 2 -
                $('#base_circle').width() / 2;
            var y = cp.y + charDim.height -
                $('#base_circle').height() / 2;
            return {'x':x,'y':y}
        }

        function checkForOverflow(charIndex){
            var cp = getCharPos(charIndex);
            if (cp.y + charDim.height > input.innerHeight())
                input.text(input.text().slice(charGrid.width));
        }

        function redrawCircle(charIndex) {
            var svg = {};
            var dp = getDotPos(charIndex);
            if ($('svg#' + charIndex).length) {
                svg = $('svg#' + charIndex)
            } else {
                svg = $('svg#base_circle').clone();
                svg.appendTo('div#circles');
                svg.attr('id', charIndex);
            }
            svg.css({
                'left': dp.x + 'px',
                'top': dp.y + 'px'
            });
        }

    });
    var uuid = userID();

    var socket = io.connect('http://localhost:3000');

    function userID() {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }

}(window.jQuery, window, document));