/* TODO
* Implement game over state
* Clean up code
* jsdoc
*/

(function init() {
	
	var board,flag;

	board = new MinesweeperBoard();
	board.init();

	// button handlers
	$("#verify").click(board.verify);
	$("#reveal_all").click(board.revealMines);
	$("#new_game").click(board.init);
}());

function MinesweeperBoard(numRows,numCols,numMines) {
	this.cells;

	var board = this;
	
	this.init = function() {
		board.numRows = $("#boardsize").val();
		board.numCols = board.numRows;
		board.numMines = $("#numMines").val();

		board.cells = [];
		board.mines = (function() {
			var mines = {};
			// generate a random number between 0 and rows*cols-1
			var randMax = board.numRows * board.numCols;
			var i,minePos
			for(i = 0; i < board.numMines; ++i) {
				do {
					minePos = Math.floor(Math.random() * randMax);
				} while(mines.hasOwnProperty(minePos));
				mines[minePos] = true;
			}

			return mines;
		}());
		var i,j,isMine;
		for(i = 0; i < board.numRows; ++i) {
			board.cells[i] = [];
			for(j = 0; j < board.numCols; ++j) {
				isMine = board.mines.hasOwnProperty(i * board.numCols + j);	
				board.cells[i][j] = new MinesweeperCell(i,j,isMine);
			}
		}

		board.draw();
	};

	//this.init();

	
	this.draw = function() {
		$("#board").empty();
		$("#message").empty();
		for(i = 0; i < this.numRows; ++i) {
			row = document.createElement("tr");
			for(j = 0; j < this.numCols; ++j) {
				col = document.createElement("td");

				$(col)
				.data("pos",{ "i": i, "j": j})
				.click(function() {
					var pos = $(this).data("pos");
					board.cells[pos.i][pos.j].reveal(board);
				})
				.dblclick(function() {
					var pos = $(this).data("pos");
					board.revealNeighbors(board.cells[pos.i][pos.j]);
				})
				.on("contextmenu",function(e) {
					e.preventDefault();
					var pos = $(this).data("pos");
					board.cells[pos.i][pos.j].flag();
					return false;
				});

				

				$(row).append(col);
			}
			$("#board").append(row);
		}

	};

	this.countAdjacent = function(i,j) {
		var totalMines = 0;
		var ii = 0,jj = 0;
		var tableCell = $("#board tr:eq(" + i + ") td:eq(" + j + ")");

		var prevRow = i - 1 < 0 ? i : i - 1;
		var prevCol = j - 1 < 0 ? j : j - 1;
		var nextRow = i + 2 > this.numRows ? i + 1 : i + 2;
		var nextCol = j + 2 > this.numCols ? j + 1 : j + 2;

		for(ii = prevRow;ii < nextRow; ii++) {
			for(jj = prevCol; jj < nextCol; jj++) {
				// skip center square
				if(ii !== i || jj !== j) {
					if(this.cells[ii][jj].isMine) {
						totalMines++;
					}
				}
			}
		}

		return totalMines;
	}

	// if any unflagged cells are mines, reveal them
	this.verify = function() {
		var i,j,cell;

		for(i = 0; i < board.numRows; ++i) {
			for(j = 0; j < board.numCols; ++j) {
				cell = board.cells[i][j];
				if(cell.isMine && !cell.flagged) {
					board.gameOver(false);
					return;
				}
			}
		}

		// Winner!
		board.gameOver(true);
	}

	/* TODO: should go somewhere else */
	this.gameOver = function(win) {
		
		if(win) {
			$("#message").removeClass("bad").text("WINNER!");
		} else {
			$("#message").addClass("bad").text("GAME OVER!");
		}
		
		for(var mine in this.mines) {
			var i = Math.floor(mine / this.numRows);
			var j = mine % this.numCols;
			var cell = $("#board tr:eq(" + i + ") td:eq(" + j + ")");
			$(cell).addClass("mine");
		}
		$("td.mine.revealed");
	}

	/** 
	 * Call reveal on neighbors of the given cell
	 */
	this.revealNeighbors = function(cell) {
		var i = cell.row;
		var j = cell.col;

		var updateCells = [];
		
		// TODO: remove duplication with above
		var prevRow = i - 1 < 0 ? i : i - 1;
		var prevCol = j - 1 < 0 ? j : j - 1;
		var nextRow = i + 2 > board.numRows ? i + 1 : i + 2;
		var nextCol = j + 2 > board.numCols ? j + 1 : j + 2;

		for(ii = prevRow;ii < nextRow; ii++) {
			for(jj = prevCol; jj < nextCol; jj++) {
				// skip center square
				if(ii !== i || jj !== j) {
					updateCells.push(board.cells[ii][jj]);
				}
			}
		}

		for(i = 0; i < updateCells.length; ++i) {
			updateCells[i].reveal(board);
		}
	}

	this.revealMines = function() {
		// show the mines for 5 seconds
		var i,j,cell,unreveal,timeout = 5000;
		for(i = 0; i < board.numRows; ++i) {
			for(j = 0; j < board.numCols; ++j) {
				cell = board.cells[i][j]
				if(cell.isMine) {
					cell.revealed = true;
					cell.update();
					window.setTimeout((function(cell) {
						return function() {
							cell.revealed = false;
							cell.update();
						};
					}(cell)),timeout);
				}
			}
		}
	}
}

function MinesweeperCell(row,col,isMine) {
	this.row = row;
	this.col = col;
	this.isMine = isMine;
	this.flagged = false;
	this.error = false;

	this.reveal = function(board) {
		if(!this.revealed) {
			this.revealed = true;
			if(this.isMine && !this.flagged) {
				this.error = true;
				board.gameOver();
			} else {
				this.numAdjacent = board.countAdjacent(this.row,this.col);
				if(this.numAdjacent === 0) {
					board.revealNeighbors(this);
				}
				
			}
			
			this.update();
		}
	};

	this.flag = function() {
		this.flagged = !this.flagged;
		this.update();
	};

	this.update = function() {
		this.cell = this.cell || $("#board tr:eq(" + this.row + ") td:eq(" + this.col + ")");
		if(this.revealed) {
			if(this.isMine && !this.flagged) {
				$(this.cell).addClass("mine");
				if(this.error) {
					$(this.cell).addClass("error").text("X");
				}
			} else if(!this.isMine) {
				$(this.cell)
				.css("background-image","url(img/" + this.numAdjacent + ".png)")
				.css("background-size","100%");
			}
		} else {
			if(this.isMine && !this.flagged) {
				$(this.cell).removeClass("mine");
			}
		}
		if(this.flagged) {
			$(this.cell).addClass("flag");
		}
	}
}

