module("MinesweeperBoard");

test("A newly created board",function() {
	var board = new MinesweeperBoard("#fixture8");
	equal(board.context,"#fixture8","should have the correct context");
	var board2 = new MinesweeperBoard("#fixture16");
	equal(board2.context,"#fixture16","should have the correct context");
});

test("An initialized board",function() {
	var board = new MinesweeperBoard("#fixture8");
	board.init();
	equal(board.numRows,8,"should have the correct # of rows (8)");
	equal(board.numCols,8,"should have the correct # of columns (8)");
	equal(board.numMines,10,"should have the correct # of mines (10)");
	equal(board.numMines,board.remainingMines,"should have remainingMines equal to numMines");

	var board2 = new MinesweeperBoard("#fixture16");
	board2.init();
	equal(board2.numRows,16,"should have the correct # of rows(16)");
	equal(board2.numCols,16,"should have the correct # of columns(16)");
	equal(board2.numMines,32,"should have the correct # of mines(32)");

	ok(!board.locked,"should not be locked");
	ok(!board.flagmode,"should not be in flagmode");
});


test("A board's remainingMines",function() {
	var board = new MinesweeperBoard("#fixture8"),cell,i = 0,j = 0;
	board.init();

	equal(board.remainingMines,10,"should start at numMines");

	cell = board.cells[0][0];

	cell.flag();
	equal(board.remainingMines,9,"should decrease by 1 for a flag");

	cell.flag();
	equal(board.remainingMines,10,"should increase by 1 for an unflag");

	cell.flag();
	cell = board.cells[0][1];
	cell.flag();
	equal(board.remainingMines,8,"should decrease by 1 for each flag");

	// reset board
	board.init();
	for(i = 0; i < board.numMines; ++i) {
		// flag all the mines
		cell = board.cells[Math.floor(i / board.numCols)][i % board.numRows];
		cell.flag();		
	}
	equal(board.remainingMines,0,"should be equal to 0 when all flags are placed");

	cell = board.cells[Math.floor((i+1) / board.numCols)][(i+1) % board.numRows];
	cell.flag();
	equal(board.remainingMines,0,"should not go lower than 0");

	board = new MinesweeperBoard("#fixture16");
	board.init();
	equal(board.remainingMines,32,"should be equal to numMines when no flags are placed");

	for(i = 0; i < board.numMines; ++i) {
		// flag all the mines
		cell = board.cells[Math.floor(i / board.numCols)][i % board.numRows];
		cell.flag();		
	}
	equal(board.remainingMines,0,"should be equal to 0 when all flags are placed (start with 32)");
});

module("MinesweeperCell");

test("A newly created cell",function() {
	var board = new MinesweeperBoard("fixture8");
	var cell = new MinesweeperCell(board,1,1,false);
	ok(!cell.revealed,"should not be revealed");
	ok(!cell.flagged,"should not be flagged");
	equal(board,cell.board,"should point to its board");
});

test("A new mine cell",function() {
	var cell = new MinesweeperCell(null,0,0,true);
	ok(cell.isMine,"should have the isMine property set");
});

test("Adjacent mines",function() {
	var board = new MinesweeperBoard("#fixture8");
	var mines = {0:true,1:true,2:true,8:true,10:true,16:true,17:true,18:true};
	board.init(mines);
	var cell = board.cells[1][1];

	equal(cell.numAdjacent,8,"8 adjacent mines");

	mines = {};
	board.init(mines);
	cell = board.cells[1][1];

	equal(cell.numAdjacent,0,"0 adjacent mines");

	mines = {0:true,2:true,8:true};
	board.init(mines);
	cell = board.cells[1][1];

	equal(cell.numAdjacent,3,"3 adjacent mines");

	mines = {0:true,2:true,8:true,12:true};
	board.init(mines);
	cell = board.cells[1][1];

	equal(cell.numAdjacent,3,"far away mines don't count");

	mines = {0:true,1:true,9:true};
	board.init(mines);
	cell = board.cells[1][0];

	equal(cell.numAdjacent,3,"left border");

	mines = {8:true,1:true};
	board.init(mines);
	cell = board.cells[0][0];

	equal(cell.numAdjacent,2,"left top");

	mines = {62:true};
	board.init(mines);
	cell = board.cells[7][7];

	equal(cell.numAdjacent,1,"bottom right");
});
