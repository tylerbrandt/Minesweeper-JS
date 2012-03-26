/*global $,alert*/
/*jslint browser: true, white: true, plusplus: true, maxerr: 50, indent: 4 */


function MinesweeperCell(board, row, col, isMine) {
	'use strict';
	this.row = row;
	this.col = col;
	this.isMine = isMine;
	this.flagged = false;
	this.error = false;
	this.board = board;

	/**
	 * Reveal the cell when clicked
	 */
	this.reveal = function () {
		// if already revealed, do nothing
		if (!this.revealed) {
			this.revealed = true;

			if (this.isMine && !this.flagged) {
				// revealing an unflagged mine is game over
				this.error = true;
				this.board.gameOver();
			} else if (!this.isMine && this.numAdjacent === 0) {
				// similar to Windows minesweeper, if a "0" cell is clicked, 
				// also reveal any neighbors
				this.board.revealNeighbors(this);
			}

			// update the display
			this.update();
		}
	};

	/**
	 * Toggle the flagged status of the cell
	 */
	this.flag = function () {
		// if there is a mine to flag or this is an unflag operation
		if (this.board.remainingMines > 0 || this.flagged) {
			this.flagged = !this.flagged;
			if (this.flagged) {
				this.board.remainingMines--;
			} else {
				this.board.remainingMines++;
			}
			this.update();
		}
	};

	/**
	 * Update the display of this cell by changing CSS properties
	 */
	this.update = function () {
		// get the display element that corresponds to this cell
		this.cell = this.cell || $("#board tr:eq(" + this.row + ") td:eq(" + this.col + ")",this.board.context);
		if (this.revealed) {
			if (this.isMine && !this.flagged) {
				$(this.cell)
					.addClass("mine");
				if (this.error) {
					// the mine the user actually clicked on should stand out more
					$(this.cell).addClass("error");
				}
			} else if (!this.isMine) {
				// for a regular cell just show the number
				$(this.cell)
					.addClass("num" + this.numAdjacent)
					// subtract 2 for borders
					.addClass("revealed")
					.css({
						"background-position": "0px -" + this.numAdjacent * (this.board.sizeFactor - 2) + "px"
					});
			}
		} else {
			if (this.isMine && !this.flagged) {
				// unreveal a mine (after cheating)
				$(this.cell).removeClass("mine");
			}
		}

		// set appropriate flag class
		if (this.flagged) {
			$(this.cell).addClass("flag");
		} else {
			$(this.cell).removeClass("flag");
		}

		// update the remaining mines counter
		$("#remainingMines",this.board.context).text(this.board.remainingMines);
	};
}

function MinesweeperBoard(context) {
	'use strict';
	// keep track of the board for when 'this' is rebound
	var board = this,
		/**
		 * Click => reveal/flag
		 */
		clickHandler = function () {
			// reveal cell
			if(!board.locked) {
				var pos = $(this).data("pos"),
				cell = board.cells[pos.i][pos.j];
				if (board.flagmode) {
					cell.flag();
				} else {
					cell.reveal();
				}
			}
		},

		/**
		 * Double-click => reveal neighboring cells
		 */
		dblClickHandler = function () {
			// reveal adjacent cells
			if(!board.locked) {
				if (!board.flagmode) {
					var pos = $(this).data("pos");
					board.revealNeighbors(board.cells[pos.i][pos.j]);
				}
			}
		},

		/**
		 * Right-click => flag (only works with mouse obviously)
		 */
		contextHandler = function (e) {
			if(!board.locked) {
				var pos = $(this).data("pos");
				// flag
				e.preventDefault();
				board.cells[pos.i][pos.j].flag();
				return false;
			}
		},

		/** 
		 * Find the min/max for rows/cols surrounding the current cell
		 */
		adjacentBounds = function(i,j) {
			return {
				prevRow: i - 1 < 0 ? i : i - 1,
				prevCol: j - 1 < 0 ? j : j - 1,
				nextRow: i + 2 > board.numRows ? i + 1 : i + 2,
				nextCol: j + 2 > board.numCols ? j + 1 : j + 2
			};
		};
	
	this.context = context || document;

	/**
	 * Start a new game
	 */
	this.init = function (init_mines) {
		var i, j, isMine;

		board.locked = false;

		board.numRows = $("#boardsize",board.context).val();
		board.numCols = board.numRows;
		board.numMines = $("#numMines",board.context).val();
		board.remainingMines = board.numMines;

		board.cells = [];
		board.flagmode = false;

		// generate mines randomly
		board.mines = init_mines || (function () {
			var mines = {},
				// generate a random number between 0 and rows*cols-1
				randMax = board.numRows * board.numCols,
				i,
				minePos;
			for (i = 0; i < board.numMines; ++i) {
				// if we get a repeat try again
				do {
					minePos = Math.floor(Math.random() * randMax);
				} while (mines.hasOwnProperty(minePos));
				mines[minePos] = true;
			}

			return mines;
		}());

		// add cells to the board
		for (i = 0; i < board.numRows; ++i) {
			board.cells[i] = [];
			for (j = 0; j < board.numCols; ++j) {
				isMine = board.mines.hasOwnProperty(i * board.numCols + j);
				board.cells[i][j] = new MinesweeperCell(board, i, j, isMine);
				board.cells[i][j].numAdjacent = board.countAdjacent(i, j);
			}
		}

		// draw the UI
		board.draw();
	};

	/**
	 * Add board elements to the DOM; set styles and handlers
	 */
	this.draw = function () {
		// make the board fill the screen
		var size = Math.min(Math.floor($(window).width() / this.numCols),
						Math.floor(($(window).height() - $("#actions",board.context).height()) / this.numRows)),
			i, j, row, col;

		// save the size factor
		board.sizeFactor = size;
		
		// hide game-over message box
		$("#messagebox",board.context).hide();
		$("#message",board.context).empty();
		
		$("#remainingMines",board.context).text(board.numMines);

		// turn off flagmode
		$("#flagmode",board.context).removeClass("on");

		// reset the board
		$("#board",board.context).empty();
		for (i = 0; i < this.numRows; ++i) {
			row = document.createElement("tr");
			for (j = 0; j < this.numCols; ++j) {
				col = document.createElement("td");

				$(col)
				// set a data property to easily grab this element's cell when clicked
				.data("pos", { "i": i, "j": j})
				.click(clickHandler)
				.dblclick(dblClickHandler)
				.on("contextmenu", contextHandler);

				// size all elements the same
				$(col).css({
					"width": size,
					"height": size
				});

				

				$(row).append(col);
			}
			
			// add the row of cells to the DOM
			$("#board",board.context).append(row);
		}
		$("#board",board.context).css({
			"width": size * board.numCols
		});

	};

	/** 
	 * Reveal all mines for 5 seconds when the "Cheat" button is clicked
	 */
	this.revealMines = function () {
		// show the mines for 5 seconds
		var i, j, cell, timeout = 5000, unrevealCells = [];
		
		if(!board.locked) {
			for (i = 0; i < board.numRows; ++i) {
				for (j = 0; j < board.numCols; ++j) {
					cell = board.cells[i][j];
					if (cell.isMine) {
						cell.revealed = true;
						cell.update();
						unrevealCells.push(cell);
						
					}
				}
			}

			// set a timeout to return mines to unrevealed state
			window.setTimeout((function (cells) {
				return function () {
					var i, cell;
					for (i = 0; i < cells.length; ++i) {
						cell = cells[i];
						cell.revealed = false;
						cell.update();
					}
				};
			}(unrevealCells)), timeout);
		}
	};

	/** 
	 * Call reveal on neighbors of the given cell
	 */
	this.revealNeighbors = function (cell) {
		var i = cell.row,
			j = cell.col,

			updateCells = [],
		
			bounds = adjacentBounds(i,j),
			ii, jj;

		for (ii = bounds.prevRow;ii < bounds.nextRow; ii++) {
			for (jj = bounds.prevCol; jj < bounds.nextCol; jj++) {
				// skip center square
				if (ii !== i || jj !== j) {
					updateCells.push(board.cells[ii][jj]);
				}
			}
		}

		for (i = 0; i < updateCells.length; ++i) {
			updateCells[i].reveal();
		}
	};

	// if any unflagged cells are mines, reveal them
	this.verify = function () {
		var i, j, cell;

		if(!board.locked) {
			for (i = 0; i < board.numRows; ++i) {
				for (j = 0; j < board.numCols; ++j) {
					cell = board.cells[i][j];
					if (cell.isMine && !cell.flagged) {
						board.gameOver(false);
						return;
					}
				}
			}

			// Winner!
			board.gameOver(true);
		}
	};

	/**
	 * Count the mines adjacent to the cell in i,j
	 */
	this.countAdjacent = function (i, j) {
		var totalMines = 0,
			ii = 0, jj = 0,

			bounds = adjacentBounds(i,j);

		for (ii = bounds.prevRow;ii < bounds.nextRow; ii++) {
			for (jj = bounds.prevCol; jj < bounds.nextCol; jj++) {
				// skip center square
				if (ii !== i || jj !== j) {
					if (this.mines.hasOwnProperty(ii * this.numRows + jj)) {
						totalMines++;
					}
				}
			}
		}

		return totalMines;
	};

	/**
	 * Endgame, if win is true then WINNER, else GAME OVER
	 */
	this.gameOver = function (win) {
		var mine, i, j, cell;		

		board.locked = true;

		if (win) {
			$("#message",board.context).removeClass("bad").text("WINNER!");
		} else {
			$("#message",board.context).addClass("bad").text("GAME OVER!");
		}
		
		for (mine in board.mines) {
			if(board.mines.hasOwnProperty(mine)) {
				i = Math.floor(mine / board.numRows);
				j = mine % board.numCols;
				cell = board.cells[i][j];
				if (!cell.flagged) {
					cell.revealed = true;
					cell.update();
				}
			}
		}
		$("#messagebox",board.context).show();
	};	
}

/**
 * Start the game!
 */
(function init(fixture) {
	'use strict';
	var context = fixture || document,
		board = new MinesweeperBoard(context);
	board.init();

	// button handlers
	$("#verify",context).click(board.verify);
	$("#reveal_all",context).click(board.revealMines);
	$("#new_game",context).click(function() {
		board.init();
	});
	$("#flagmode",context).click(function () {
		board.flagmode = !board.flagmode;
		if (board.flagmode) {
			$("#flagmode",context).addClass("on");
		} else {
			$("#flagmode",context).removeClass("on");
		}
	});
	$("#settings",context).click(function() {
		$("#options",context).toggle('fast');
	});
	$("#boardsize",context).change(function() {
		var defaultMines = {
			"8": 10,
			"16": 50,
			"32": 250
		};
		$("#numMines")
			.val(defaultMines[$(this).val()])
			// more than half of the squares mines is just silly
			.attr("max",Math.floor(Math.pow($(this).val(),2) / 2));
		board.init();
	});
	$("#numMines",context).change(function() {
		var maxMines = Math.floor(Math.pow($("#boardsize").val(),2) / 2);
		
		if($(this).val() < 1 || $(this).val() > maxMines) {
			alert("Please select a number between 1 and " + maxMines);
			$(this).val(board.numMines);
		} else {
			board.init();	
		}
	});
}(document));




