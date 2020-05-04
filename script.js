function getCookie(name) {
  let cookie = document.cookie.split(';');
  let cookies = {};
  if (cookie != '') {
    for (val in cookie) {
        cookies[cookie[val].split('=')[0].trim()] = cookie[val].split('=')[1].trim();
    };

    if (cookies[name]) {
        return cookies[name];
    };
  };
  return '';
};

var game = {
  height: 4,
  val: [2,2,2,2,2,2,2,2,2,4],
  score: 0,
  highScore: 0,
  shifted: false,
  keepGoing: false,
  newTiles: [],
  mergedTiles: [],
  direction: false,
  newBoard: function () {
    let board = [];
    for (let i=0; i < this.height; i++) {
      board[i] = new Array(this.height);
    };
    return board;
  },
  full: function() {
    for (row in this.board) {
      for (column in this.board[row]) {
        if (!this.board[row][column]) {
          return false;
        };
      };
    };
    return true;
  },
  playable: function() {
    this.direction = 'up';
    if (this.checkShifted(this.shift('up'))) {
        return true;
    };
    this.direction = 'left'
    if (this.checkShifted(this.shift())) {
      return true;
    };
    return false;
  },
  endGame: function(win) {
    document.getElementById('end').style.display = 'block';
    game.clear();
    // if you loss you can't keep going so don't give the option
    if (!win) {
      document.getElementById('keep-going').style.display = 'none';
      document.getElementById('game-over').textContent = 'Game Over';
    } else {
      document.getElementById('game-over').textContent = 'You Win!'
    };
  },
  newVal: function () {
    while (true) {
      let x = Math.floor(Math.random() * this.height);
      let y = Math.floor(Math.random() * this.height);
      if (!this.board[y][x]) {
        this.board[y][x] = this.val[Math.floor(Math.random() * 10)];
        this.newTiles.push({row: y, column: x});
        return 1;
      };
    };
    return 1;
  },
  clear: function () {
    this.keepGoing = false;
    // delete the past game from cookie
    let oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    document.cookie = "board=; score=;highScore=; expires=" + oneYearAgo;
    return 1;
  },
  init: function () {
    let board = getCookie('board');
    let score = getCookie('score');
    let highScore = getCookie('highScore');
    let newGame = true;

    if (!board == '') {
      this.board = JSON.parse(board);
      this.score = Number(score);
      this.highScore = Number(highScore);
      if (this.playable()) {
        newGame = false;
      };
    } if (newGame) {
      this.score = 0;
      this.board = this.newBoard(); 
      this.newVal(); this.newVal();
    }
    document.querySelector(".game-container").style = 'grid-template-columns: repeat('+this.height.toString()+', 1fr); grid-template-rows: repeat('+this.height.toString()+', 1fr)';
    // hide the end game screen
    document.getElementById('end').style.display = 'none';
    this.display();
    return 1;
  },
  rotate: function (board) {
    let rotatedBoard = this.newBoard();
    for (let row=0; row < this.height; row++) {
      let column = this.height - row - 1;
      for (let i=0; i < this.height; i++) {
        rotatedBoard[i][column] = board[row][i];
      };
    };
    return rotatedBoard;
  },
  shift: function () {
    let board;
    
    if (!this.direction) { return false}

    if (this.direction == 'up') {
      board = this.rotate(this.rotate(this.rotate(JSON.parse(JSON.stringify(this.board)))));
    } else if (this.direction == 'right') {
     board = this.rotate(this.rotate(JSON.parse(JSON.stringify(this.board))));
    } else if (this.direction == 'down') {
     board = this.rotate(JSON.parse(JSON.stringify(this.board)));
    } else if (this.direction == 'left') {
      board = JSON.parse(JSON.stringify(this.board));
    };
    let newBoard = [];
    let mergedBoard = this.newBoard();
    
    for (row in board) {
      let shifting = board[row];
      let shifted = new Array(board.length);
      
      for (let i=1; i < shifting.length; i++) {
        for (let column=1; column < shifting.length; column++) {
          if (!shifting[column-1]) {
            shifting[column-1] = shifting[column];
            shifting[column] = null;
            if (shifted[column]) {
              shifted[column-1] = true;
              shifted[column] = null;
            }
          // check if it should be MERGED
          } else if (shifting[column-1] == shifting[column] && !shifted[column-1] && !shifted[column]) {
            shifting[column-1] *= 2;
            shifting[column] = null;
            shifted[column-1] = true;
            shifted[column] = false;
            // record the merged tile's location
            //this.mergedTiles.push({'row': row, 'column': column-1})
            mergedBoard[row][column-1] = true;
            this.score += shifting[column-1];
            if (this.score > this.highScore) {
              this.highScore = this.score;
            };
          };
        };
      };
      newBoard.push(shifting);
    };

    // orient the board correctly
    // orient the merged board correctly to see which tiles have been merged
    if (this.direction == 'up') {
      newBoard = this.rotate(JSON.parse(JSON.stringify(newBoard)));
      mergedBoard = this.rotate(mergedBoard);
    } else if (this.direction == 'right') {
      newBoard = this.rotate(this.rotate(JSON.parse(JSON.stringify(newBoard))));
      mergedBoard = this.rotate(this.rotate(mergedBoard));
    } else if (this.direction == 'down') {
      newBoard = this.rotate(this.rotate(this.rotate(JSON.parse(JSON.stringify(newBoard)))));
      mergedBoard = this.rotate(this.rotate(this.rotate(mergedBoard)));
    };

    for (row in mergedBoard) {
      for (column in mergedBoard[row]) {
        if (mergedBoard[row][column] == true) {
          this.mergedTiles.push({'row': row, 'column': column});
        };
      };
    };
    
    return newBoard;
  },
  checkShifted: function(newBoard) {
    if (JSON.stringify(newBoard) != JSON.stringify(this.board)) {
      return true;
    };
    return false;
  },
  update(newBoard) {
    
    if (this.checkShifted(newBoard)) {
      this.board = newBoard;
      this.newVal();
      this.display();
    };
    // if the board is full and can't be played on you lose so end the game
    if (this.full()) {
      if (!this.playable()) {
        this.endGame(false);
      };
    };
    for (row in this.board) {
      if (this.board[row].includes(2048) && !this.keepGoing) {
        this.endGame(true);
      };
    };

    // set a cookie to preserve the game that expires one year from now
    let oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    document.cookie = 'board=' + JSON.stringify(this.board) + '; expires=' + oneYearFromNow;
    document.cookie = 'score=' + this.score.toString() + '; expires=' + oneYearFromNow;
    document.cookie = 'highScore=' + this.highScore.toString() + '; expires=' + oneYearFromNow;
  },
  display: function (newVal) {
    let gameContainer = document.querySelector('.game-container')
    
    // clear the current elements
    let child = gameContainer.lastElementChild;  
    while (true) {
      if (child.id == 'end') {
        break;
      }
      gameContainer.removeChild(child); 
      child = gameContainer.lastElementChild; 
    }; 
    
    // add tiles to screen
    // let tiles = document.getElementsByClass('tile')
    
    for (row in this.board) {
      for (column in this.board) {
        let tile = document.createElement("div");
        let text;
        if (this.board[row][column]) {
          tile.className = 'tile-'+this.board[row][column].toString();
          let text = document.createTextNode(this.board[row][column]);
          tile.appendChild(text);
          
          // if the tile is a new tile
          for (newTile in this.newTiles) {
            if (this.newTiles[newTile].row == row && this.newTiles[newTile].column == column) {
              tile.className += " new-tile";
            };
          };
          for (mergedTile in this.mergedTiles) {
            if (this.mergedTiles[mergedTile].row == row && this.mergedTiles[mergedTile].column == column) {
              tile.className += " merged-tile";
            };
          };
        } else {
          tile.className = 'blank-tile'
        };
        tile.className += ' tile'
        gameContainer.appendChild(tile);
      };
    };
    let i = 0;
    if (this.mergedTiles.length) {
      document.getElementById('pop').play();
    };
    for (i=0; i < this.mergedTiles.length; i++) {
      document.getElementById('pop').load();
      document.getElementById('pop').play();
    }
    // update the score
    document.getElementById('score').textContent = this.score;
    document.getElementById('high').textContent= this.highScore;
    
    // reset new tiles and merged tiles
    this.newTiles = [];
    this.mergedTiles = []

    return 1;
  }
};

game.init();

window.addEventListener('keydown', function(e) { 
  let direction;
  switch (e.keyCode) {
    case 87: 
      direction = 'up';
      break;
    case 38:
      direction = 'up';
      break;
    case 68:
      direction = 'right';
      break;
    case 39:
     direction = 'right';
      break;
    case 83:
      direction = 'down';
      break;
    case 40:
      direction = 'down';
      break;
    case 65:
      direction = 'left';
      break;
    case 37:
      direction = 'left';
      break;
    default:
      direction = false;
      break;
  };
  game.direction = direction;
  let newBoard = game.shift(direction);
  if (newBoard) {
    game.update(newBoard);
  }
});

// stop scroll from keyboard
window.addEventListener("keydown", function(e) {
    // space and arrow keys
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false)

document.getElementById('new-game').onclick = function() { game.clear(); game.init(); };
document.getElementById('restart').onclick = function() { game.clear(); game.init(); };
document.getElementById('keep-going').onclick = function() {
  document.getElementById('end').style.display = 'none';
  game.keepGoing = true;
};

// from: https://stackoverflow.com/questions/2264072/detect-a-finger-swipe-through-javascript-on-the-iphone-and-android

document.addEventListener('touchstart', handleTouchStart, false);        
document.addEventListener('touchmove', handleTouchMove, false);

var xDown = null;                                                        
var yDown = null;

function getTouches(evt) {
  return evt.touches ||             // browser API
         evt.originalEvent.touches; // jQuery
}                                                     

function handleTouchStart(evt) {
    const firstTouch = getTouches(evt)[0];                                      
    xDown = firstTouch.clientX;                                      
    yDown = firstTouch.clientY;                                      
};                                                

function handleTouchMove(evt) {
    // stop scrooling
    evt.preventDefault();

    let direction;

    if ( ! xDown || ! yDown ) {
        return;
    }

    var xUp = evt.touches[0].clientX;                                    
    var yUp = evt.touches[0].clientY;

    var xDiff = xDown - xUp;
    var yDiff = yDown - yUp;

    if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {/*most significant*/
        if ( xDiff > 0 ) {
            /* left swipe */ 
            direction = 'left';
        } else {
            direction = 'right';
        }                       
    } else {
        if ( yDiff > 0 ) {
            direction = 'up';
        } else { 
            direction = 'down'
        }                                                                 
    }
    /* reset values */
    xDown = null;
    yDown = null;
    game.direction = direction;
    let newBoard = game.shift();
    if (newBoard) {
        game.update(newBoard);
    };                             
};
